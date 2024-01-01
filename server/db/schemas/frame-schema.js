const mongoose = require('mongoose');

const rgbValueLength = 768; // 256 pixels * 3 RGB values per pixel

const FrameSchema = new mongoose.Schema({
    animationID: {
        type: String,
        required: true
    },
    frameNumber: {
        type: Number,
        required: true
    },
    rgbValues: {
        type: [Number],
        required: true,
        validate: {
            validator: function (v) {
                return v.length === rgbValueLength;
            },
            message: props => `${props.value.length} is not the correct length for rgbValues. Expected ${rgbValueLength}.`
        }
    }
});

module.exports = mongoose.model('Frame', FrameSchema);