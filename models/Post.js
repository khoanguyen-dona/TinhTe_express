
const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema(
    {
        title: { type: String , required: true, unique: false},
        content: { type: String},
        thumbnail: { type: String, required: true },
        imgGallery: { type: Array},
        categories: { type: Array},
        authorId: { type: Schema.Types.ObjectId, ref: 'User'},
        view: { type: Number },
        isApproved: {type: Boolean}
    },
    { timestamps: true }
)

module.exports = mongoose.model('Post', PostSchema)
