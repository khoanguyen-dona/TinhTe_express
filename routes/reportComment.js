const router = require('express').Router()
const ReportComment = require('../models/ReportComment')
const Comment = require('../models/Comment')
const {
    isAuthenticated,
} = require('./verifyToken')

//create report comment
router.post('/', isAuthenticated, async( req , res ) =>{
    try{
        const Reported = await ReportComment.find({
            $and: [
                {userId: req.body.userId},
                {commentId: req.body.commentId}
            ]
        })
        if(Reported.length>0){
            await ReportComment.findByIdAndDelete(Reported[0]._id)
            res.status(200).json({message:'un reportComment successfully', unReport:true})
        } else{   
            const newReport = new ReportComment(req.body)
            await newReport.save()
            res.status(200).json({message:"report successfully",reportComment: newReport, unReport:false})
        }
    } catch(err){
        console.log('report comment failed',err)
    }
})

// get report comment by postId and userId
router.get('/', async(req,res)=>{
    const postId = req.query.postId
    const userId = req.query.userId
    try{
        const reportComments = await ReportComment.find({
            $and: [
                {postId: postId},
                {userId: userId}
            ]
        })
        res.status(200).json({message:'query successfully', reportComments: reportComments})
    } catch(err) {

    }
})

// get all report comment
router.get('/comments',  async (req, res) => {
    const limit = parseInt(req.query.limit) || 10
    const page = parseInt(req.query.page) || 1

    try{
        const reports = await ReportComment.find({})
        const commentIdArray = []
        for ( let report of reports){
            commentIdArray.push(report.commentId)
        }

        const comments = await Comment.find({_id: {$in: commentIdArray} }).skip( limit*(page-1) ).limit(limit).populate('userId','-password')
    
        const totalComments = await Comment.countDocuments({_id: {$in: commentIdArray } }) 
        const totalPage = Math.ceil(totalComments/limit)
        const hasNext = page*limit < totalComments ? true : false

    //     const hasNext = parseInt(limit*page) < totalComments ? true : false
        res.status(200).json({message:"query successfully", comments: comments, page: page, totalPage: totalPage, limit: limit, hasNext: hasNext })
        // res.status(200).json({message:'query successfully', comments: comments, page: page,totalComments: totalComments , limit: limit, hasNext: hasNext })
    } catch(err) {
        res.status(500).json(err)
    }
} )

// get number of comment in current month
router.get('/count/this-month', async (req, res) => {
    try {
        const now = new Date(); // Lấy thời gian hiện tại
        const currentMonth = now.getMonth(); // Lấy tháng hiện tại (0-11)
        const currentYear = now.getFullYear(); // Lấy năm hiện tại
        const reports = await ReportComment.find({})

        // Lọc các bình luận được tạo trong tháng và năm hiện tại
        const reportsThisMonth = reports.filter(comment => {
            const commentDate = new Date(comment.createdAt);
            return commentDate.getMonth() === currentMonth && commentDate.getFullYear() === currentYear;
        });

        const totalReportsThisMonth = reportsThisMonth.length;

        res.status(200).json({
            message: `Tổng số report trong tháng ${currentMonth + 1}, năm ${currentYear}:`,
            total: totalReportsThisMonth,
        });

    } catch (error) {
        console.error('Lỗi khi đếm bình luận:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
    }
});

module.exports = router