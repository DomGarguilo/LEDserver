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
 * Inserts a frame into the database.
 * @param frameID - The ID of the frame.
 * @param rgbValues - The RGB values of the frame.
 * @throws If there is an error inserting the frame.
 */
const insertFrame = async (frameID: string, rgbValues: Uint8Array) => {
    try {
        // Validation: ensure correct length for 16x16 RGB data
        if (rgbValues.length !== 768) {
            throw new Error(`Invalid frame data length. Expected 768 bytes (16x16x3), got ${rgbValues.length}`);
        }

        // Validation: ensure all values are in valid RGB range (0-255)
        for (let i = 0; i < rgbValues.length; i++) {
            if (rgbValues[i] > 255) {
                throw new Error(`Invalid RGB value at index ${i}: ${rgbValues[i]}. Must be 0-255`);
            }
        }

        const buffer = Buffer.from(rgbValues);
        // Use upsert to avoid duplicates - if frameID exists, update the data
        await FrameSchema.findOneAndUpdate(
            { frameID },
            { rgbValues: buffer },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error inserting frame:', error);
        throw error;
    }
};

export { fetchFrame, insertFrame };