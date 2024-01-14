import Frame from './schemas/frame-schema';

/**
 * @returns the array of RGB values for the given frame as it is stored in the database
 * @throws an error if the frame is not found
 */
const fetchFrame = async (frameID: string): Promise<Uint8Array> => {
    try {
        const frame = await Frame.findOne({ frameID }, 'rgbValues -_id');
        if (!frame) {
            throw new Error(`Frame not found for Frame ID: ${frameID}`);
        }
        return new Uint8Array(frame.rgbValues);
    } catch (error) {
        console.error('Error fetching frame:', error);
        throw error;
    }
};

// TODO change frame ID to the first param
const insertFrame = async (animationID: string, frameID: string, rgbValues: Uint8Array) => {
    try {
        const frame = new Frame({ animationID, frameID, rgbValues: Array.from(rgbValues) });
        await frame.save();
    } catch (error) {
        console.error('Error inserting frame:', error);
        throw error;
    }
};

export { fetchFrame, insertFrame };