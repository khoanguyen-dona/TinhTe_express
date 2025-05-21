const mongoose = require('mongoose')
const { Schema } = mongoose;

const CommentEmotionSchema = new mongoose.Schema(
    {
        commentId : { type: String, required: true},
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true},
        type: { 
            type: String , 
            enum: ['like','love','fun','sad','wow'],
            required: true ,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('CommentEmotion', CommentEmotionSchema)