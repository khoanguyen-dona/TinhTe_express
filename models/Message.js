const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema(
    {
        chatId: { type: String},
        sender: { type: String},
        text: { type: String},
        imgs: { type: Array, default: []},
    },
    { timestamps: true}
)

module.exports = mongoose.model('Message', MessageSchema)