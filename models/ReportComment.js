const mongoose = require('mongoose')
const { Schema } = mongoose;

//comment ID : the comment is reported
//postId: in what post
//userId: id of the user who report that comment


const ReportCommentSchema = new mongoose.Schema(
    {
        commentId: { type: String , required: true},
        postId: { type: String , required: true},
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true}
    },
    { timestamps: true }
)

module.exports = mongoose.model('ReportComment', ReportCommentSchema)