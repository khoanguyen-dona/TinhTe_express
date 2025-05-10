const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique:false },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isAdmin: { type: Boolean, default: false },
        isReporter: { type: Boolean, default: false },
        img: { type: String },
        verified: { type: Boolean, default: false },
        autoDelete: { type: Date, default: Date.now(), expires: 86400 } // auto delete after 24 hours in seconds until user's email is verified
    },
    { timestamps: true}
    
)

module.exports = mongoose.model('User', UserSchema)