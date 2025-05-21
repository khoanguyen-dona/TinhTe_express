const router = require('express').Router()
const CommentEmotion = require('../models/CommentEmotion')


// create comment emotion
router.post('/', async(req, res)=>{
    try {
        const emotion = await CommentEmotion.findOne({
            $and:[
                {commentId: req.body.commentId},
                {userId: req.body.userId},
            ]
        })
        if(emotion){
            if(emotion.type===req.body.type){
                 await CommentEmotion.findByIdAndDelete(emotion._id)
                res.status(200).json({message:'delete comment emotion succesfully'}) 
            }else {
                emotion.type = req.body.type
                emotion.save()
                res.status(200).json({message:'change emotion type succesfully',emotion:emotion})
            }
        } else {   
            const emotion = new CommentEmotion(req.body)
            await emotion.save()
            res.status(200).json({message: 'post emotions successfully', emotion: emotion})
        }

    } catch(err){
        console.log('post comment-emotion failed',err)
    }
})

//get comment emotion by userId and commentId
router.get('/:commentId', async (req,res) => {
    const commentId = req.params.commentId
    const userId= req.query.userId
    try {
        const userEmotion = await CommentEmotion.find({
            $and:[
                {commentId: commentId},
                userId ? {userId: userId} : {}
            ]
        }).populate('userId')
        res.status(200).json({message:'fetch successfully', emotion: userEmotion})
    } catch(err){
        console.log('fetch user emotion failed',err)
    }
})





module.exports = router