const router = require('express').Router()
const User = require('../models/User')
const jwt = require("jsonwebtoken");
const  redis = require('../config/redis');

const {
    verifyToken
} = require('./verifyToken')

//register
router.post('/register', async( req , res ) =>{
    try{
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,         
        })
        await newUser.save()
        res.status(200).json({message:"create user successfully",data: newUser})
    } catch(err){
        console.log('err while create user',err)
    }
})

//login
router.post('/login', async( req , res ) =>{
    try{
        const user = await User.findOne({email: req.body.email})
        if(!user){
            return res.status(400).json({message:'Sai email hoặc mật khẩu'})
        }
        if(user.password !== req.body.password){
            return res.status(400).json({message:'sai email hoặc mật khẩu'})
        }
        const accessToken = jwt.sign(
            {
              id: user._id,
              isAdmin: user.isAdmin,
              isReporter: user.isReporter
            },
            process.env.JWT_SECRET_KEY,
            {expiresIn:"30s"}
        );

        const refreshToken = jwt.sign(
            {
                id: user._id,
                isAdmin: user.isAdmin,
                isReporter: user.isReporter
            },
            process.env.REFRESH_SECRET_KEY,
            {expiresIn:"2m"}
        );
 
        //save refreshToken in redis
        const pipeline = redis.multi() 
        if(refreshToken){      
            pipeline.hSet(`refreshToken:${refreshToken}`,{
                id: user._id.toString(),
                isAdmin: user.isAdmin.toString(),
                isReporter: user.isReporter.toString()
            } )  
            pipeline.expire(`refreshToken:${refreshToken}`, 120)       
            await pipeline.exec()
 

        }
        
        // send cookie to client
        res.cookie('refreshToken', refreshToken ,
            {
                httpOnly: true, // RẤT QUAN TRỌNG: Không thể truy cập bằng JavaScript phía client
                secure: process.env.NODE_ENV === 'production'? true : false, // Chỉ gửi qua HTTPS trong production
                sameSite:  process.env.NODE_ENV === 'production'? 'lax' : 'none', // Bảo vệ CSRF: 'strict', 'lax', or 'none'
                // maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày tính bằng mili giây (phù hợp với expiresIn của token)
                maxAge: 2 * 60 * 1000, 
                path: '/', // Cookie khả dụng trên tất cả các đường dẫn
            }
        );
        const {password, ...rest} = user._doc
            
        return res.status(200).json({data: rest, accessToken: accessToken, message:"user login successfully"})
        
    } catch(err){
        console.log('err while create user',err)
        return res.status(400).json({message:'sai email hoặc mật khẩu'})
    }
})

// try to get refreshToken
router.get('/get-refresh-token',verifyToken, async(req, res) => {
    try{
        const refreshToken = req.cookies.refreshToken

        if (!refreshToken){

            return res.redirect(`${process.env.FRONT_END_URL}/login?sessionExpired=true`)

        } else {

            const refreshToken_redis = await redis.hGetAll(`refreshToken:${refreshToken}`)

            if(Object.keys(refreshToken_redis).length>0){
                await redis.hDel(`refreshToken:${refreshToken}`)

                const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

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

                res.cookie('refreshToken', newRefreshToken, {
                    httpOnly: true,
                    secure: false,
                    sameSite: 'lax',
                    maxAge: 2 * 60 * 1000,
                    path: '/',
                });

                res.status(200).json({message:'get successfully', accessToken: newAccessToken})
            }
        }


        // console.log('ref',Object.keys(refreshToken).length)

        
    } catch(err){
        console.log('get refreshToken failed',err)
    }
})

router.get('/logout', async (req, res)=>{
    // delete refreshToken in redis
    const refreshToken = req.cookies.refreshToken
    await redis.del(`refreshToken:${refreshToken}`)

    // delete refreshToken in browser
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' ? true : false ,
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none' ,
        path: '/',
      });

    res.status(200).json({message:'logout successfully'})

})

module.exports = router