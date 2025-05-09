const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema(
    {
        postId: { type:String , required: true},
        content: { type: String , required: true, unique: false},
        userId: { type: Schema.Types.ObjectId, ref: 'User'},
        imgGallery: { type: Array},
        type: { 
            type: String,
            enum: ['thread','comment'],
            required: true,
        },
        refCommentIdTypeThread: { type: String},
        refCommentUserId: { type: String },
        refCommentUsername: { type: String },
        isApproved: { type: Boolean, default: true},
        isReplied: { type: Boolean, default: false},
    },
    { timestamps: true }
)

module.exports = mongoose.model('Comment', CommentSchema)