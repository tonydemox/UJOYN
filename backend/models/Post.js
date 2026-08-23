// backend/models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        minAge: {
            type: Number,
            default: 0,
        },
        maxAge: {
            type: Number,
            default: 99,
        },
        city: {
            name: { type: String, required: true },
            province: { type: String },
            coordinates: { type: [Number], required: true },
        },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] },
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        status: {
            type: String,
            enum: ['upcoming', 'completed', 'cancelled'],
            default: 'upcoming',
        },
        photos: [
            {
                url: { type: String, required: true },
                uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                uploadedAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

postSchema.pre('save', function () {
    if (this.isModified('city.coordinates')) {
        this.location = { type: 'Point', coordinates: this.city.coordinates };
    }
});

postSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Post', postSchema);