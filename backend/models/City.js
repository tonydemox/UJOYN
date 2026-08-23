const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    province: {
        type: String,
        required: true,
    },
    region: {
        type: String,
    },
    lat: {
        type: Number,
        required: true,
    },
    lng: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model('City', citySchema);