const router = require('express').Router()
const User = require('../models/User')

// update user info
router.put('/:userId', async( req , res ) =>{
    try {
        const user = await User.findById(req.params.userId)
        if(!user){
            return res.status(400).json({message:'user not exists'})
        } else{

            const updatedUser = await User.findByIdAndUpdate(req.params.userId,
                {
                    $set: req.body
                },{ new: true }
            )
            
            return res.status(200).json({message: "user updated successfully",data: updatedUser})
        }
    }catch(err){
        res.status(400).json({message:'user not exists'})
    }
})

// update password
router.put('/:userId/update-password', async( req , res ) =>{
    try {
        const user = await User.findById(req.params.userId)
        if(!user){
            return res.status(400).json({message:'user not exists'})
        } else{

        if(user.password !== req.body.password){
            res.status(400).json({message:'Sai mật khẩu'})
        } else {
            user.password = req.body.password1   
            user.save()
            return res.status(200).json({message: "user updated successfully"})
        }

            // const updatedUser = await User.findByIdAndUpdate(req.params.userId,
            //     {
            //         $set: req.body
            //     },{ new: true }
            // )
            
        }
    }catch(err){
        res.status(400).json({message:'user not exists'})
    }
})

//get all users by page and limit 
router.get('/', async(req, res)=>{
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    const isReporter = req.query.isReporter==='true'?true:false
    const isAdmin = req.query.isAdmin==='true'?true:false
    try {
        const users = await User.find({
            $and: [
                isReporter ? {isReporter: isReporter}:{},
                isAdmin ? {isAdmin: isAdmin}:{},
            ]
        }).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).select("-password")

        const totalUsers = await User.countDocuments({
            $and: [
                isReporter ? {isReporter: isReporter}:{},
                isAdmin ? {isAdmin: isAdmin}:{},
            ]
        }) 

        const totalPage = Math.ceil(totalUsers/limit)
        const hasNext = page*limit < totalUsers ? true : false
        res.status(200).json({message:'get users successfully', users: users, totalPage: totalPage,
            totalUsers: totalUsers, hasNext: hasNext, limit: limit})
    } catch(err) {
        console.log('err while fetching users',err)
    }
})



module.exports = router