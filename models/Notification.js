const mongoose = require('mongoose')
const { Schema } = mongoose;
const NotificationSchema = new mongoose.Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User'}, // notification belong to this userId
        content: { type: String }, // 
        userIdRef: { type: String , default: null}, // userId who remind of this user 
        usernameRef: { type: String , default: null}, // username who remind of this user
        isReceiverSeen: { type: Boolean, default: false}, // check if this user has seen the notification 
        commentId: { type: String , default: null}, // commentId remind of this user ?
        refCommentIdTypeThread: { type: String , default: null },  // commentIdTypeThread that commentId ref to
        postSlug: { type: String, default: null},
        postId: {type: String , default : null}
    },
    { timestamps: true}
    
)

module.exports = mongoose.model('Notification', NotificationSchema)