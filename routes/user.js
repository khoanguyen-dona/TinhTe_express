const router = require('express').Router()
const User = require('../models/User')
const {
    isAuthenticated,
    isAdmin,
    isAccountOwner
} = require('./verifyToken')


// update user info
router.put('/:userId', isAccountOwner, async( req , res ) =>{
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
router.put('/:userId/update-password', isAccountOwner, async( req , res ) =>{
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
router.get('/', isAdmin, async(req, res)=>{
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

// get user info
router.get('/:userId', async( req , res ) =>{
    try {
        const user = await User.findById(req.params.userId)       
        const {password,...other} = user._doc
        return res.status(200).json({message: "get user successfully",user: other})

    }catch(err){
        res.status(400).json({message:'user not exists'})
    }
})

// get user by username
router.get('/username/:username', async(req, res)=>{
    const limit = parseInt(req.query.limit)
    const page = parseInt(req.query.page)
    const username  = req.params.username

    try {     
        const users = await User.find({
            username: { $regex: username, $options: 'i' }         
        }).skip( limit*(page-1) ).limit(limit)

        const totalUser = await User.countDocuments({
            username: { $regex: username, $options: 'i' } 
        })
        const totalPage = Math.ceil(totalUser/limit)
        const hasNext = parseInt(limit*page) < totalUser ? true : false
        
        res.status(200).json({message:'get users by username successfully',
            users: users, page: page, limit: limit, totalUserFound: totalUser, hasNext: hasNext, totalPage: totalPage})
                       
    } catch(err) {
        console.log('err while fetching users by username',err)
    }
})

module.exports = router