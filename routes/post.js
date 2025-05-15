const router = require('express').Router()
const Post = require('../models/Post')
const { createSearchIndex } = require('../models/User')

//create post
router.post('', async( req , res ) =>{
    try {
        const newPost = await Post({
            title: req.body.title,
            shortDescription: req.body.shortDescription,
            content: req.body.content,
            thumbnail: req.body.thumbnail,
            imgGallery: req.body.imgGallery,
            category: req.body.category,
            authorId: req.body.authorId,
            view: 0,
            isApproved: false,
            isPosted: req.body.isPosted
        })
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
        const post = await Post.findById(req.params.postId).populate({path:'authorId'})
        res.status(200).json({message:'get post successfully',post: post})
    } catch(err) {
        console.log('get posts by postId failed')

    }
})

// get posts by pageNumber , limit
// router.get('/', async(req, res)=>{
//     const userId = req.query.userId
//     const page = parseInt(req.query.page)
//     const limit = parseInt(req.query.limit)
//     const isApproved = req.query.isApproved==='true'?true:false
//     const isPosted = req.query.isPosted==='true'?true:false
//     try {
//         const posts = await Post.find({
//             $and: [
//                 userId ? {authorId: userId}:{},
//                 isApproved ? {isApproved: isApproved}:{},
//                 isPosted ? {isPosted: isPosted}:{},
//             ]
//         }).populate({path:'authorId'}).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit)

//         const totalPosts = await Post.countDocuments({
//             $and: [
//                 userId ? {authorId: userId}:{},
//                 isApproved ? {isApproved: isApproved}:{},
//                 isPosted ? {isPosted: isPosted}:{},
//             ]
//         }) 

//         const totalPage = Math.ceil(totalPosts/limit)
//         const hasNext = page*limit < totalPosts ? true : false
//         res.status(200).json({message:'get posts successfully', posts: posts, totalPage: totalPage,
//              totalPosts: totalPosts, hasNext: hasNext})
//     } catch(err) {
//         console.log('err while fetching post',err)
//     }
// })


// get posts by pageNumber , limit and trending 
router.get('/', async(req, res)=>{
    const userId = req.query.userId
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    const isApproved = req.query.isApproved==='true'?true:false
    const isPosted = req.query.isPosted==='true'?true:false
    const mostWatch = req.query.mostWatch==='true'? true : false
    try {
        if(mostWatch){
            const oneWeekAgo = new Date()
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7 )
            const posts = await Post.find({
                $and: [
                    { createdAt: { $gte: oneWeekAgo } },
                    isApproved ? {isApproved: isApproved}:{},
                    isPosted ? {isPosted: isPosted}:{},
                ]
            }).populate({path:'authorId'}).sort({ view: -1 }).skip((page-1)*limit).limit(limit)

            const totalPosts = await Post.countDocuments({
                $and: [
                    userId ? {authorId: userId}:{},
                    isApproved ? {isApproved: isApproved}:{},
                    isPosted ? {isPosted: isPosted}:{},
                ]
            }) 
    
            const totalPage = Math.ceil(totalPosts/limit)
            const hasNext = page*limit < totalPosts ? true : false
            res.status(200).json({message:'get posts successfully', posts: posts, totalPage: totalPage,
                 totalPosts: totalPosts, hasNext: hasNext})
        } else{
            const posts = await Post.find({
                $and: [
                    userId ? {authorId: userId}:{},
                    isApproved ? {isApproved: isApproved}:{},
                    isPosted ? {isPosted: isPosted}:{},
                ]
            }).populate({path:'authorId'}).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit)

            const totalPosts = await Post.countDocuments({
                $and: [
                    userId ? {authorId: userId}:{},
                    isApproved ? {isApproved: isApproved}:{},
                    isPosted ? {isPosted: isPosted}:{},
                ]
            }) 
    
            const totalPage = Math.ceil(totalPosts/limit)
            const hasNext = page*limit < totalPosts ? true : false
            res.status(200).json({message:'get posts successfully', posts: posts, totalPage: totalPage,
                 totalPosts: totalPosts, hasNext: hasNext})
        }

        
    } catch(err) {
        console.log('err while fetching post',err)
    }
})

//increase view of post
router.get('/:postId/increase-view', async( req, res)=>{    
    try {  
        const post = await Post.findById(req.params.postId)
        post.view += 1
        post.save()
        res.status(200).json({message:'increased view number successfully'})
    }catch(err){}   
})

module.exports = router