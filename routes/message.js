const router = require('express').Router()
const Message = require('../models/Message')
const {
    isAuthenticated,
    isRelatedToChatByChatId
} = require('./verifyToken')

//create message
router.post('/', isAuthenticated, async(req, res)=>{
    try {
        const newMessage = new Message(req.body)
        newMessage.save()
        res.status(200).json({message:'create message successfully', data: newMessage})
    } catch(err){
        console.log('create message failed',err)
    }
})


//get messages by chatId ,limit and page
router.get('/' , isRelatedToChatByChatId, async(req,res)=>{
    const page = req.query.page
    const limit = req.query.limit
    const chatId = req.query.chatId
    try {
        const messages = (await Message.find({chatId: chatId}).sort({createdAt: -1}).skip( limit*(page-1) ).limit(limit)).reverse()

        const totalMessages = await Message.countDocuments({chatId: chatId})
      
        const hasNext = parseInt(limit*page) < totalMessages ? true : false
        res.status(200).json({message:'get messages successfully', messages: messages, limit: limit, page: page, totalMessages: totalMessages, hasNext: hasNext})
    } catch(err){
        console.log('get messages by chatId,limit and page failed',err)
    }
})


module.exports = router