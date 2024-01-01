const Frame = require('./schemas/frame-schema');

const fetchFrame = async (animationID, frameNumber) => {
    try {
        const frame = await Frame.findOne({ animationID, frameNumber });
        if (!frame) {
            throw new Error('Frame not found');
        }
        return frame;
    } catch (error) {
        console.error('Error fetching frame:', error);
        throw error;
    }
};

const insertFrame = async (animationID, frameNumber, rgbValues) => {
    try {
        const frame = new Frame({ animationID, frameNumber, rgbValues });
        await frame.save();
    } catch (error) {
        console.error('Error inserting frame:', error);
        throw error;
    }
};

module.exports = { fetchFrame, insertFrame };