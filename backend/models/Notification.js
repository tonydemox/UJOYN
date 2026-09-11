const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
        {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: {
            type: String,
            enum: [ 'post_join', 'friend_request', 'friend_accept'],
            required: true,
        },
            actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
            read: { type: Boolean, default: false },
        },
    { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);