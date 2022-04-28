const mongoose = require('mongoose');

const reqNumber = {
    type: Number,
    required: true
};

const animationSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    frameDuration: reqNumber,
    repeatCount: reqNumber,
    frames: {
        type: [Array],
        required: true
    },
});

module.exports = mongoose.model('animation', animationSchema);