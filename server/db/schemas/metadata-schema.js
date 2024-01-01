const mongoose = require('mongoose');

const MetadataObjectSchema = new mongoose.Schema({
    animationID: {
        type: String,
        required: true
    },
    frameDuration: {
        type: Number,
        required: true
    },
    repeatCount: {
        type: Number,
        required: true
    },
    totalFrames: {
        type: Number,
        required: true
    }
});

const MetadataArraySchema = new mongoose.Schema({
    metadataArray: {
        type: [MetadataObjectSchema],
        default: []
    }
});

module.exports = mongoose.model('MetadataArray', MetadataArraySchema);