const Frame = require('./schemas/frame-schema');

/**
 * @returns the array of RGB values for the given frame as it is stored in the database
 * @throws an error if the frame is not found
 */
const fetchFrame = async (animationID, frameNumber) => {
    try {
        const frame = await Frame.findOne({ animationID, frameNumber }, 'rgbValues -_id');
        if (!frame) {
            console.error(`Frame not found for Animation ID: ${animationID}, Frame Number: ${frameNumber}`);
            return null;
        }
        return frame.rgbValues;
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