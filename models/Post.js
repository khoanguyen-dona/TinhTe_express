
const mongoose = require('mongoose')
const { Schema } = mongoose;


const PostSchema = new mongoose.Schema(
    {
        title: { type: String , required: true },
        shortDescription: { type: String },
        content: { type: String },
        thumbnail: { type: String, required: true },
        imgGallery: { type: Array },
        category: { type: String },
        authorId: { type: Schema.Types.ObjectId, ref: 'User' },
        view: { type: Number, default:0 },
        isApproved: { type: Boolean , default: false },
        isPosted: { type: Boolean }
    },
    { timestamps: true }
)

module.exports = mongoose.model('Post', PostSchema)
