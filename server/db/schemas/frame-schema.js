const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const rgbValueLength = 768; // 256 pixels * 3 RGB values per pixel

const FrameSchema = new mongoose.Schema({
    animationID: {
        type: String,
        required: true
    },
    frameID: {
        type: String,
        default: uuidv4,
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