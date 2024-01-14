import mongoose from 'mongoose';

const rgbValueLength = 768; // 256 pixels * 3 RGB values per pixel

interface IFrameSchema {
    animationID: string;
    frameID: string;
    rgbValues: number[];
}

const FrameSchema = new mongoose.Schema<IFrameSchema>({
    animationID: {
        type: String,
        required: true
    },
    frameID: {
        type: String,
        required: true
    },
    rgbValues: {
        type: [Number],
        required: true,
        validate: {
            validator: (v: number[]) => v.length === rgbValueLength,
            message: (props: { value: number[] }) => `${props.value.length} is not the correct length for rgbValues. Expected ${rgbValueLength}.`
        }
    }
});

const FrameModel = mongoose.model<IFrameSchema>('Frame', FrameSchema);

export default FrameModel;
