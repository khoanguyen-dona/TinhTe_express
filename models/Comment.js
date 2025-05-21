const mongoose = require('mongoose')
const { Schema } = mongoose;

const CommentSchema = new mongoose.Schema(
    {
        postId: { type:String , required: true},
        content: { type: String , required: true},
        userId: { type: Schema.Types.ObjectId, ref: 'User'},
        imgGallery: { type: Array},
        type: { 
            type: String,
            enum: ['thread','comment'],
            required: true,
        },
        refCommentIdTypeThread: { type: String , default:null},
        refCommentUserId: { type: Schema.Types.ObjectId, ref: 'User' , default:null},
        isApproved: { type: Boolean, default: true},
        isReplied: { type: Boolean, default: false},
    },
    { timestamps: true }
)

module.exports = mongoose.model('Comment', CommentSchema)