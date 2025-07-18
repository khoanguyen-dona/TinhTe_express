const router = require('express').Router()
const Comment = require('../models/Comment')
const ReportComment = require('../models/ReportComment')
const {
    isAdmin,
    isAuthenticated,
} = require('./verifyToken')


// create comment
router.post('/', isAuthenticated, async( req , res ) =>{
    try{
        const newComment = new Comment(req.body)
        await newComment.save()
        res.status(200).json({message:"commented successfully",comment: newComment})
    } catch(err){
        console.log('err while create user',err)
    }
})


//get comments by postId and type='thread'
router.get('/:postId',  async (req, res) => {
    let type = req.query.type
    let limit = parseInt(req.query.limit) || 5
    let page = parseInt(req.query.page) || 1
    const post_id = req.params.postId
    try{
        const comments = await Comment.find({
            $and: [
                {postId: post_id},
                type ? {type: {$in: type }} : {}
            ]
        }).skip( limit*(page-1) ).limit(limit).populate('userId','-password')
        
        const totalComments = await Comment.countDocuments({
            $and: [
                {postId: post_id},
                type ? {type: {$in: type }} : {}
            ]
        })

        const hasNext = parseInt(limit*page) < totalComments ? true : false

        res.status(200).json({message:'query successfully', comments: comments, page: page,totalComments: totalComments , limit: limit, hasNext: hasNext })
    } catch(err) {
        res.status(500).json(err)
    }
} )

//get comments by refcommentIdTypeThread and type='comment'
router.get('/refCommentId/:commentId',  async (req, res) => {
    let limit = parseInt(req.query.limit) || 5
    let page = parseInt(req.query.page) || 1
    try{
        const comment_id = req.params.commentId
        const comments = await Comment.find({
            $and: [
                {refCommentIdTypeThread: comment_id}, 
            ]
        }).skip( limit*(page-1) ).limit(limit).populate('userId refCommentUserId','-password')

        const totalReplies = await Comment.countDocuments({
            $and: [
                {refCommentIdTypeThread: comment_id},
            ]
        })

        const hasNext = parseInt(limit*page) < totalReplies ? true : false
  
        res.status(200).json({message:'query successfully', comments: comments, page: page, limit: limit, totalReplies: totalReplies, hasNext: hasNext})
    } catch(err) {
        res.status(500).json(err)
    }
} )

//get comments by refcommentIdTypeThread and type='comment'
router.get('/refCommentId/:commentId/replyNumber',  async (req, res) => {
 
    try{
        const comment_id = req.params.commentId
   
        const totalReplies = await Comment.countDocuments({
            $and: [
                {refCommentIdTypeThread: comment_id},
            ]
        })
  
        res.status(200).json({message:'query successfully',totalReplies: totalReplies})
    } catch(err) {
        res.status(500).json(err)
    }
} )

//get comment by commentId
router.get('/commentId/:commentId', async(req, res)=>{
    try{
        const comment = await Comment.findById(req.params.commentId).populate('userId','-password')
        res.status(200).json({message:'get comment successfully', comment: comment})
    } catch(err){
        console.log('fetching comment failed',err)
    }
})


// get commentCount base on post
router.get('/comment-count/:postId', async(req, res)=>{
    try {     
        const totalComment = await Comment.countDocuments({postId: req.params.postId})       
        res.status(200).json({message:'get comment count by post successfully', count: totalComment})
              
    } catch(err) {
        console.log('err while fetching post',err)
    }
})

// get commentCount base on userId
router.get('/comment-count/user/:userId', async(req, res)=>{
    const userId = req.params.userId
    try {     
        const totalComment = await Comment.countDocuments({userId: userId})       
        res.status(200).json({message:'get comment count by user successfully', count: totalComment})
              
    } catch(err) {
        console.log('err while fetching post',err)
    }
})

//get latest comment base on postId
router.get('/latest-comment/:postId', async(req, res)=>{
    try {
        const latestComment = await Comment.find({postId: req.params.postId}).sort({createdAt:-1}).limit(1).populate('userId','_id username img')
        res.status(200).json({message:'get latest post successfully', latestComment: latestComment})
    } catch(err){   
        console.log('fetch latest post failed ', err)
        
    }
})

// get number of comment in current month
router.get('/count/this-month', async (req, res) => {
    try {
        const now = new Date(); // Lấy thời gian hiện tại
        const currentMonth = now.getMonth(); // Lấy tháng hiện tại (0-11)
        const currentYear = now.getFullYear(); // Lấy năm hiện tại
        const comments = await Comment.find({})

        // Lọc các bình luận được tạo trong tháng và năm hiện tại
        const commentsThisMonth = comments.filter(comment => {
            const commentDate = new Date(comment.createdAt);
            return commentDate.getMonth() === currentMonth && commentDate.getFullYear() === currentYear;
        });

        const totalCommentsThisMonth = commentsThisMonth.length;

        res.status(200).json({
            message: `Tổng số bình luận trong tháng ${currentMonth + 1}, năm ${currentYear}:`,
            total: totalCommentsThisMonth,
        });

    } catch (error) {
        console.error('Lỗi khi đếm bình luận:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
    }
});

// get number of comment in current month
router.get('/count/all-comments', async (req, res) => {
    try {          
        const comments = await Comment.countDocuments({})
     
        res.status(200).json({
            message: `Tổng số bình luận :`,
            total: comments,
        });

    } catch (error) {
        console.error('Lỗi khi đếm bình luận:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
    }
});

router.delete('/:commentId', isAdmin, async(req, res) => {
    try{
        await Comment.findByIdAndDelete(req.params.commentId)
        await ReportComment.findOneAndDelete({commentId: req.params.commentId})
        res.status(200).json( {message:'delete comment successfully' } )
        
    } catch(err){
        console.log('delete comment by commentId failed',err)
    }
})


module.exports = router