const router = require('express').Router()
const ReportComment = require('../models/ReportComment')
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

module.exports = router