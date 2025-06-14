const router = require('express').Router()
const PostEmotion = require('../models/PostEmotion')
const {
    isAuthenticated,
} = require('./verifyToken')

// create post emotions
router.post('/', isAuthenticated, async(req, res)=>{
    try {
        const emotion = await PostEmotion.findOne({
            $and:[
                {postId: req.body.postId},
                {userId: req.body.userId},
            ]
        })
        if(emotion){
            if(emotion.type===req.body.type){
                 await PostEmotion.findByIdAndDelete(emotion._id)
                res.status(200).json({message:'delete post emotion succesfully'}) 
            }else {
                emotion.type = req.body.type
                emotion.save()
                res.status(200).json({message:'change emotion type succesfully',emotion:emotion})
            }
        } else {   
            const emotion = new PostEmotion(req.body)
            await emotion.save()
            res.status(200).json({message: 'post emotions successfully', emotion: emotion})
        }

    } catch(err){
        console.log('post comment-emotion failed',err)
    }
})

//get post emotions by userId and postId
router.get('/:postId', async (req,res) => {
    const postId = req.params.postId
    const userId= req.query.userId
    try {
        const userEmotion = await PostEmotion.find({
            $and:[
                {postId: postId},
                userId ? {userId: userId} : {}
            ]
        }).populate('userId','_id username img')
        res.status(200).json({message:'fetch successfully', emotion: userEmotion})
    } catch(err){
        console.log('fetch user emotion failed',err)
    }
})

//count emotion by userId
router.get('/emotion-count/:userId', async (req,res) => {
    const userId = req.params.userId;
    try {
        const emotionCount = await PostEmotion.countDocuments({userId: userId})
        res.status(200).json({message:'fetch emotion count successfully', emotionCount: emotionCount})
    } catch(err){
        console.log('fetch emotion count by userId failed',err)
    }

})




module.exports = router