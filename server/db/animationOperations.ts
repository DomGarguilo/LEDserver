import FrameSchema from './schemas/frame-schema';

/**
 * @returns the array of RGB values for the given frame as it is stored in the database
 * @throws an error if the frame is not found
 */
const fetchFrame = async (frameID: string): Promise<Uint8Array> => {
    try {
        const frame = await FrameSchema.findOne({ frameID }, 'rgbValues -_id');
        if (!frame) {
            throw new Error(`Frame not found for Frame ID: ${frameID}`);
        }
        const buffer: Buffer = frame.rgbValues;
        if (buffer.length !== 768) {
            throw new Error(`Frame does not have the correct length for rgbValues. Expected 768, got ${buffer.length}`);
        }
        return new Uint8Array(buffer);
    } catch (error) {
        console.error('Error fetching frame:', error);
        throw error;
    }
};

// TODO change frame ID to the first param
const insertFrame = async (animationID: string, frameID: string, rgbValues: Uint8Array) => {
    try {
        const buffer = Buffer.from(rgbValues.buffer);
        const frame = new FrameSchema({ animationID, frameID, rgbValues: buffer });
        await frame.save();
    } catch (error) {
        console.error('Error inserting frame:', error);
        throw error;
    }
};

export { fetchFrame, insertFrame };