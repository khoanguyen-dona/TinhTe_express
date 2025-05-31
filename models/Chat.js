const mongoose = require('mongoose')

const ChatSchema = new mongoose.Schema(
    {
        members: { type: Array, required: true},
        lastMessage: { type: String},
        senderId: { type: String},
        isReceiverSeen: { type: Boolean}
    },
    { timestamps: true}
    
)

module.exports = mongoose.model('Chat', ChatSchema)