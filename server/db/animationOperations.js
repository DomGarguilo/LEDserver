const Frame = require('./schemas/frame-schema');

/**
 * @returns the array of RGB values for the given frame as it is stored in the database
 * @throws an error if the frame is not found
 */
const fetchFrame = async (frameID) => {
    try {
        const frame = await Frame.findOne({ frameID }, 'rgbValues -_id');
        if (!frame) {
            console.error(`Frame not found for Frame ID: ${frameID}`);
            return null;
        }
        return frame.rgbValues;
    } catch (error) {
        console.error('Error fetching frame:', error);
        throw error;
    }
};

// TODO change frame ID to the first param
const insertFrame = async (animationID, frameID, rgbValues) => {
    try {
        const frame = new Frame({ animationID, frameID, rgbValues });
        await frame.save();
    } catch (error) {
        console.error('Error inserting frame:', error);
        throw error;
    }
};

module.exports = { fetchFrame, insertFrame };