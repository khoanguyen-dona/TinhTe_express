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

// get number of comment in current month
router.get('/count/this-month', async (req, res) => {
    try {
        const now = new Date(); // Lấy thời gian hiện tại
        const currentMonth = now.getMonth(); // Lấy tháng hiện tại (0-11)
        const currentYear = now.getFullYear(); // Lấy năm hiện tại
        const users = await User.find({})

        // Lọc các bình luận được tạo trong tháng và năm hiện tại
        const usersThisMonth = users.filter(user => {
            const date = new Date(user.createdAt);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const totalUsersThisMonth = usersThisMonth.length;

        res.status(200).json({
            message: `Tổng số user mới trong tháng ${currentMonth + 1}, năm ${currentYear}:`,
            total: totalUsersThisMonth,
        });

    } catch (error) {
        console.error('Lỗi khi đếm bình luận:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
    }
});

// delete user
router.delete('/:userId', isAdmin, async(req, res) => {
    try {
        await User.findByIdAndDelete(req.params.userId)
        res.status(200).json({message:'delete user successfully'})
    } catch(err){
        console.log('delete user failed', err)
    }
})

module.exports = router