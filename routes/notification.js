const router = require('express').Router()
const Notification = require('../models/Notification')

const {
    isAuthenticated,
    isRelatedToChatByChatId
} = require('./verifyToken')

//create Notification
router.post('/', async(req, res) => {
    try { 
        const newNotification = new Notification(req.body)
        newNotification.save()
        res.status(200).json({message:'create notification successfully', notification: newNotification})
    } catch(err) {
        console.log('create Notification failed', err)
    }
})

// update notification
router.put('/:notificationId', async(req, res)=>{
    try {
        const updatedNotification = await Notification.findByIdAndUpdate(req.params.notificationId,{
            $set: req.body
        },
        {
            new: true
        })

        res.status(200).json({message:'update successfully', notification: updatedNotification})

    } catch(err){
        console.log('update notification failed',err)
    }
})


//get messages by chatId ,limit and page
router.get('/:userId' , async(req,res)=>{
    const page = req.query.page
    const limit = req.query.limit
    const userId = req.params.userId.toString()
    try {
        const notifications = await Notification.find({userId: userId}).sort({createdAt: -1}).skip( limit*(page-1) ).limit(limit)

        const totalNotification = await Notification.countDocuments({userId: userId})
      
        const hasNext = parseInt(limit*page) < totalNotification ? true : false
        res.status(200).json({message:'get notification by userId successfully',
             notifications: notifications, limit: limit, page: page, totalNotification: totalNotification, hasNext: hasNext})
    } catch(err){
        console.log('get messages by chatId,limit and page failed',err)
    }
})




module.exports = router