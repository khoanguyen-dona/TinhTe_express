const jwt = require('jsonwebtoken')
const Post = require('../models/Post')
const Chat = require('../models/Chat')
const  redis = require('../config/redis');


const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.token
    if (authHeader) { 
        const token = authHeader.split(" ")[1]   
        
        // find decodedToken in redis
        const decodedToken =  await redis.get(`decodedToken:${token}`)

        // if existed in redis simply set req.user 
        if (decodedToken!==null){
            console.log('take decodeToken from redis')
            req.user = JSON.parse(decodedToken)

            next()
        // if not then decoded it then set req.user
        } else {
            jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, user) => {
                if (err) {
                    if(err.name==='TokenExpiredError'){
                        return res.status(401).json({message:'token expired'})
                    }
                    return res.status(403).json({message: 'Token is not valid'});  
                } 
                req.user = user

                // up to redis      
                await redis.setEx(`decodedToken:${token}`, 86400 , JSON.stringify(user) )                                      
                next();
            });
        }
    } else {
        return res.status(401).json("You are not authenticated!");
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