import mongoose from 'mongoose';

const rgbValueLength = 768; // 256 pixels * 3 RGB values per pixel

interface IFrameSchema {
    frameID: string;
    rgbValues: Buffer;
}

const FrameSchema = new mongoose.Schema<IFrameSchema>({
    frameID: {
        type: String,
        required: true,
        unique: true
    },
    rgbValues: {
        type: Buffer,
        required: true,
        validate: {
            validator: (v: Buffer) => v.length === rgbValueLength,
            message: (props: { value: Buffer }) => `${props.value.length} is not the correct length for rgbValues. Expected ${rgbValueLength}.`
        }
    }
});

const FrameModel = mongoose.model<IFrameSchema>('Frame', FrameSchema);

export default FrameModel;
