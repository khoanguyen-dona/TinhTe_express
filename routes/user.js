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



module.exports = router