const jwt = require('jsonwebtoken')
const Post = require('../models/Post')
const Chat = require('../models/Chat')
const  redis = require('../config/redis');


const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.token

    const refreshToken = req.cookies.refreshToken

    if(refreshToken===undefined){
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'? true : false ,
            sameSite:  process.env.NODE_ENV === 'production'? 'lax' : 'none' ,
            path: '/',
        });
        return res.status(401).json( {message:'refreshToken not valid', redirectTo:`${process.env.FRONT_END_URL}/login?sessionExpired=true` })
    }

    // find refreshToken in redis
    const refreshToken_redis = await redis.hGetAll(`refreshToken:${refreshToken}`)

    // if refreshToken not existed in redis redirect to login page
    if(Object.keys(refreshToken_redis).length===0){

        // Xóa cookie refresh token
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'? true : false ,
            sameSite:  process.env.NODE_ENV === 'production'? 'lax' : 'none' ,
            path: '/',
        });
        return res.status(401).json( {message:'refreshToken not valid', redirectTo:`${process.env.FRONT_END_URL}/login?sessionExpired=true` })
    }

    // if refreshToken existed in redis , go check status of accessToken   
    if (authHeader && authHeader.startsWith('Bearer ')) { 
        let accessToken

        accessToken = authHeader.split(" ")[1].toString()   
        console.log('received accessToken', accessToken)
        // find accessToken in redis
        const accessToken_redis =  await redis.get(`accessToken:${accessToken}`)

        // if accessToken existed in redis simply set req.user 
        if (accessToken_redis!==null){
            req.user = JSON.parse(accessToken_redis)
            console.log('next!')
            next()
        }  else {

            // if acessToken is error and refreshToken still valid , we delete the old refreshToken and create new pair of access-refresh token.                                               
            console.log('accessToken is expired or not valid')

            // delete refreshToken is redis
            try{
                if(refreshToken){
                    await redis.del(`refreshToken:${refreshToken}`)
                }
            } catch(err){
                console.log('delete refreshToken failed',err)
            }
            
            
            jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY, async (err, decoded)=>{

                if (err) {
                    res.clearCookie('refreshToken', {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production'? true : false ,
                        sameSite:  process.env.NODE_ENV === 'production'? 'lax' : 'none' ,
                        path: '/',
                    });
                    return res.status(401).json( {message:'refreshToken not valid', redirectTo:`${process.env.FRONT_END_URL}/login?sessionExpired=true` })
                }

                const newRefreshToken = jwt.sign({
                    id: decoded.id,
                    isAdmin: decoded.isAdmin,
                    isReporter: decoded.isReporter
                }, process.env.REFRESH_SECRET_KEY, { expiresIn: '2m' })

                const newAccessToken = jwt.sign({
                    id: decoded.id,
                    isAdmin: decoded.isAdmin,
                    isReporter: decoded.isReporter
                }, process.env.JWT_SECRET_KEY, { expiresIn: '30s' })
                
                req.user = decoded
                        
                // add refreshToken to redis
                try {
                    const pipeline = redis.multi() 
                    pipeline.hSet(`refreshToken:${newRefreshToken}`,{
                            id: decoded.id,
                            isAdmin: decoded.isAdmin.toString(),
                            isReporter: decoded.isReporter.toString(),
                    } )  
                    pipeline.expire(`refreshToken:${newRefreshToken}`, 120) 
                    await pipeline.exec()
                } catch(err){
                    console.log('addRefresh failed',err)
                }

                // add accessToken to redis              
                try{
                    await redis.setEx(`accessToken:${newAccessToken}`, 30 , JSON.stringify({
                        id: decoded.id.toString(),
                        isAdmin: decoded.isAdmin.toString(),
                        isReporter: decoded.isReporter.toString()
                    }) )                                      
                } catch(err){
                    console.log('add accessToken to redis failed', err)
                }
                
            // add refreshToken to client
                res.cookie('refreshToken', newRefreshToken, {
                    httpOnly: true,
                    secure:  process.env.NODE_ENV === 'production'? true : false ,
                    sameSite: process.env.NODE_ENV === 'production'? 'lax':'none'  ,
                    maxAge: 2 * 60 * 1000,
                    path: '/',
                });
                        
                console.log('created new accessToken: ', newAccessToken)                                                                          
                return res.status(200).json({message:'created new accessToken', accessToken: newAccessToken}) 
            })      
                    
        }
    } else {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'? true : false ,
            sameSite:  process.env.NODE_ENV === 'production'? 'lax' : 'none' ,
            path: '/',
        });
        return res.status(401).json( {message:'refreshToken not valid', redirectTo:`${process.env.FRONT_END_URL}/login?sessionExpired=true` })
    }



};


// const verifyToken = async (req, res, next) => {
//     const authHeader = req.headers.token
//     if (authHeader) { 
//         const token = authHeader.split(" ")[1]   
      
//         jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, user) => {
//             if (err) return res.status(403).json({message: 'Token is not valid'});
//             req.user = user;         
//             next();  
//         })

//     } else {
//         return res.status(401).json("You are not authenticated!");
//     }
// };


const isAuthenticated = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user ){
            next();
        } else {
            res.status(403).json({message: 'You are not allowed to do that '})
        }
    })
}

const isAdmin = (req, res, next) => {

    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next();
        } else {
          res.status(403).json({message: 'You are not allowed to this'})
        }
    })
}

const isReporter = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isReporter) {
            next();
        } else {
            res.status(403).json({message: 'You are not allowed to this'})
        }
    })
}

const isRelatedToChatByChatId = (req, res, next) => {
    verifyToken(req, res, async () => {
        const userRequestId = req.user.id
        const chatId = req.params.chatId || req.query.chatId
        const chat = await Chat.findById(chatId)
        if ( chat.members.includes(userRequestId) ) {
            next()
        } else{
            res.status(403).json({message:'Forbidden: you can not see chat that you are not related to'})
        }
    })
}

const isRelatedToChatByUserId = (req, res, next) => {
    verifyToken(req, res, async () => {
        const userRequestId = req.user.id
        const userId_1 = req.query.user1
        const userId_2 = req.query.user2
        if ( userRequestId===userId_1 || userRequestId===userId_2 ) {
            next()
        } else{
            res.status(403).json({message:'Forbidden: you can not see chat that you are not related to'})
        }
    })
}


const isOwnerOfChatList = (req, res, next) => {
    verifyToken(req, res, async () => {
        const userRequestId = req.user.id
        const userParamsId = req.params.userId
        if ( userRequestId === userParamsId ) {
            next()
        } else{
            res.status(403).json({message:'Forbidden: you can not see chat-list that you are not related to'})
        }
    })
}


const isPostAuthor = (req, res, next) => {
    verifyToken(req, res , async () => {
       
        const userRequestId = req.user.id
        const postId = req.params.postId
        const post = await Post.findById(postId)
        if ( post.authorId.toString() === userRequestId || req.user.isAdmin ) {
            next()
        } else {
            res.status(403).json({message:'Forbidden: you are not the owner of the post '})
        }
    })
}

const isAccountOwner = (req, res, next) => {
    verifyToken(req, res, async () => {
        const userRequestId = req.user.id
        const userIdUrlPath = req.params.userId
        if( userRequestId === userIdUrlPath ) {
            next()
        } else {
            res.status(403).json({message:'Forbidden: you are not the owner of this account'})
        }
    })
}

module.exports = {
    verifyToken,
    isAuthenticated,
    isReporter,
    isAdmin,
    isRelatedToChatByChatId,
    isRelatedToChatByUserId,
    isOwnerOfChatList,
    isPostAuthor,
    isAccountOwner
}