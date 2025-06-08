const router = require('express').Router()
const Post = require('../models/Post')


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


// get posts by pageNumber ,category, limit and mostView 
router.get('/', async(req, res)=>{
    const userId = req.query.userId
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    const category = req.query.category
    const isApproved = req.query.isApproved==='true'?true:false
    const isPosted = req.query.isPosted==='true'?true:false
    const mostWatch = req.query.mostWatch==='true'? true : false
    try {
        if(mostWatch){
            const oneWeekAgo = new Date()
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 360 )
            const posts = await Post.find({
                $and: [
                    { createdAt: { $gte: oneWeekAgo } },
                    isApproved ? {isApproved: isApproved}:{},
                    isPosted ? {isPosted: isPosted}:{},
                    category? {category: category}:{}
                ]
            }).populate({path:'authorId'}).sort({ view: -1 }).skip((page-1)*limit).limit(limit)

            const totalPosts = await Post.countDocuments({
                $and: [
                    userId ? {authorId: userId}:{},
                    isApproved ? {isApproved: isApproved}:{},
                    isPosted ? {isPosted: isPosted}:{},
                    category ? {category: category}: {}
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
                    category ? {category: category}: {}
                ]
            }).populate({path:'authorId'}).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit)

            const totalPosts = await Post.countDocuments({
                $and: [
                    userId ? {authorId: userId}:{},
                    isApproved ? {isApproved: isApproved}:{},
                    isPosted ? {isPosted: isPosted}:{},
                    category ? {category: category}: {}
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

// get postNumber
router.get('/post-number/:title', async(req, res)=>{
    const title  = req.params.title
    try {     
        const totalPosts = await Post.countDocuments({category: title})       
        res.status(200).json({message:'get posts number successfully', totalPosts: totalPosts})
              
    } catch(err) {
        console.log('err while fetching post',err)
    }
})

//get latest post base on category
router.get('/latest-post/:category', async(req, res)=>{
    try {
        const latestPost = await Post.find({category:req.params.category}).sort({createdAt:-1}).limit(1).populate('authorId','_id username img')
        res.status(200).json({message:'get latest post successfully', latestPost: latestPost})
    } catch(err){   
        console.log('fetch latest post failed ', err)
        
    }
})

// get post by title
router.get('/post-title/:title', async(req, res)=>{
    const limit = parseInt(req.query.limit)
    const page = parseInt(req.query.page)
    const title  = req.params.title

    try {     
        const posts = await Post.find({
            title: { $regex: title, $options: 'i' }         
        }).skip( limit*(page-1) ).limit(limit).populate('authorId','-password')

        const totalPosts = await Post.countDocuments({
            title: { $regex: title, $options: 'i' } 
        })
        const totalPage = Math.ceil(totalPosts/limit)
        const hasNext = parseInt(limit*page) < totalPosts ? true : false
        
        res.status(200).json({message:'get posts by title successfully',
             posts: posts, page: page, limit: limit, totalPostsFound: totalPosts, hasNext: hasNext, totalPage: totalPage})
                       
    } catch(err) {
        console.log('err while fetching posts by title',err)
    }
})

module.exports = router