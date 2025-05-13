const router = require('express').Router()
const Post = require('../models/Post')

//create post
router.post('', async( req , res ) =>{
    try {
        const newPost = await Post(req.body)
        newPost.save()
        res.status(200).json({message: 'post success',post: newPost})
    } catch(err){
        console.log('err while posting ',err)
    }
})

// update post
router.put('/:postId', async( req, res) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(req.params.postId,
            {
                $set: req.body
            },
            {
                new: true
            }
        )
        res.status(200).json({message:'update post successfully', post: updatedPost})
    } catch(err){
        console.log('err while update post')
    }
})

//get posts by userId and pageNumber
router.get('/', async(req, res)=>{
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    try {
        const posts = await Post.find({authorId: req.query.userId}).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit)

        const totalPosts = await Post.countDocuments({
            authorId: req.query.userId
        }) 

        const totalPage = Math.ceil(totalPosts/limit)
        res.status(200).json({message:'get posts successfully', posts: posts, totalPage: totalPage})
    } catch(err) {
        console.log('err while fetching post',err)
    }
})

//delete post by postId
router.delete('/:postId', async( req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.postId)
        res.status(200).json({message: 'Delete post successfully'}) 
    } catch(err){
        console.log('delete post failed',err)
    }
})


// get post by postId
router.get('/:postId', async (req, res)=>{
    try {
        const post = await Post.findById(req.params.postId)
        res.status(200).json({message:'get post successfully',post: post})
    } catch(err) {

    }
})



module.exports = router