import FrameSchema from './schemas/frame-schema';

/**
 * Fetches a frame from the database based on the provided frame ID.
 * @param frameID - The ID of the frame to fetch.
 * @returns A Promise that resolves to a Buffer containing the RGB values of the frame.
 * @throws If the frame is not found or if the frame's rgbValues have an incorrect length.
 */
const fetchFrame = async (frameID: string): Promise<Buffer> => {
    try {
        const frame = await FrameSchema.findOne({ frameID }, 'rgbValues -_id');
        if (!frame) {
            throw new Error(`Frame not found for Frame ID: ${frameID}`);
        }
        const buffer: Buffer = frame.rgbValues;
        if (buffer.length !== 768) {
            throw new Error(`Frame does not have the correct length for rgbValues. Expected 768, got ${buffer.length}`);
        }
        return buffer;
    } catch (error) {
        console.error('Error fetching frame:', error);
        throw error;
    }
};

/**
 * Inserts a frame into the database for a given animation.
 * @param animationID - The ID of the animation.
 * @param frameID - The ID of the frame.
 * @param rgbValues - The RGB values of the frame.
 * @throws If there is an error inserting the frame.
 */
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

/**
 * Fetches all frames for a given animation ID.
 */
const fetchFramesByAnimationID = async (animationID: string): Promise<Array<{ frameID: string; rgbValues: Buffer }>> => {
  try {
    const frames = await FrameSchema.find({ animationID }, 'frameID rgbValues -_id');
    return frames.map(f => ({ frameID: f.frameID, rgbValues: f.rgbValues }));
  } catch (error) {
    console.error('Error fetching frames by animationID:', error);
    throw error;
  }
};

export { fetchFrame, insertFrame, fetchFramesByAnimationID };