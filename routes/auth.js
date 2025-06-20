const router = require('express').Router()
const User = require('../models/User')
const jwt = require("jsonwebtoken");


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
            // {expiresIn:"1m"}
          );
        
        const {password, ...rest} = user._doc
        
        res.status(200).json({data: rest, accessToken: accessToken, message:"user login successfully"})
        
    } catch(err){
        console.log('err while create user',err)
        return res.status(400).json({message:'sai email hoặc mật khẩu'})
    }
})


module.exports = router