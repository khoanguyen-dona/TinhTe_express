const router = require('express').Router()
const Comment = require('../models/Comment')



// create comment
router.post('/', async( req , res ) =>{
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



module.exports = router