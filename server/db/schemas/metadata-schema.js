const mongoose = require('mongoose');

const MetadataObjectSchema = new mongoose.Schema({
    animationID: {
        type: String,
        required: true
    },
    frameDuration: {
        type: Number,
        default: 500,
        required: true
    },
    repeatCount: {
        type: Number,
        default: 0,
        required: true
    },
    totalFrames: {
        type: Number,
        default: 0,
        required: true
    },
    frameOrder: {
        type: [String],
        default: [],
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