const router = require('express').Router()
const Chat = require('../models/Chat')


// create a chat between 2 user
router.post('/', async(req, res)=>{
    try {
        const members = req.body.members
        const findChat = await Chat.findOne({
            members:{
                $all: members
            }
        })
        if(findChat){
            return res.status(200).json({message:'chat between 2 user already exists ',chat:findChat})
        }
        const chat = new Chat(req.body)
        chat.save()
        res.status(200).json({message:'create chat successfully', chat: chat})
    } catch(err){
        console.log('create a chat for 2 user failed', err)
    }
})

// get a chat by chatId
router.get('/:chatId', async(req,res)=>{
    try {
        const chat = await Chat.findById(req.params.chatId)
        res.status(200).json({message:'get chat by chatId successfully', chat: chat})
    } catch(err){
        console.log('get chat failed',err)
    }
})

//get chats of user by userId
router.get('/chat-list/:userId', async(req, res)=>{
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    try{
        const chatlist = await Chat.find({
            $and:[
                {members: {
                    $in: [req.params.userId]
                }},
                {$expr: { 
                    $gt: [{ $strLenCP: '$lastMessage' }, 0] }}
            ]
        }).sort({updatedAt: -1}).skip( limit*(page-1) ).limit(limit)

        const totalChat = await Chat.countDocuments({
            $and:[
                {members: {
                    $in: [req.params.userId]
                }},
                {$expr: { 
                    $gt: [{ $strLenCP: '$lastMessage' }, 0] }}
            ]
        })
        
        const hasNext = parseInt(limit*page) < totalChat ? true : false

        res.status(200).json({message:'get chatlist sucessfully', chatList: chatlist, page: page, limit: limit, totalChatFound: totalChat ,hasNext: hasNext })
    }catch(err){
        console.log("get chatlist failed",err)
    }
})

//get chat of 2 members by 2 userId
router.get('/', async(req,res)=>{
    try {
        const chat = await Chat.findOne({
            members: {
                $all: [req.query.user1, req.query.user2]
            }
        })
        if (chat===null){
            res.status(200).json({message:"no chat availabel", chat: chat})
        } else{
            res.status(200).json({message:'get chat of 2 user  success', chat: chat})
        }
    } catch(err){
        console.log('fetch chat of 2 user input failed',err)
    }
})

//update to chat by chatId
router.put('/:chatId', async(req,res)=>{
    try {
        const updatedChat = await Chat.findByIdAndUpdate(req.params.chatId, {
            $set: req.body
        },
        {
            new: true
        })
        res.status(200).json({message:"chat updated successfully", updatedChat: updatedChat})
    } catch(err) {
        console.log('update chat failed',err)
    }
})


module.exports = router