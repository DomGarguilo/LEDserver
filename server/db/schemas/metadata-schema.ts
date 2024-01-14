import mongoose, { Document, Schema } from 'mongoose';

interface IMetadataObject {
    animationID: string;
    frameDuration: number;
    repeatCount: number;
    totalFrames: number;
    frameOrder: string[];
}

interface IMetadataArray extends Document {
    metadataArray: IMetadataObject[];
}

const MetadataObjectSchema = new Schema<IMetadataObject>({
    animationID: {
        type: String,
        required: true
    },
    frameDuration: {
        type: Number,
        required: true
    },
    repeatCount: {
        type: Number,
        required: true
    },
    totalFrames: {
        type: Number,
        required: true
    },
    frameOrder: {
        type: [String],
        required: true
    }
});

const MetadataArraySchema = new Schema<IMetadataArray>({
    metadataArray: {
        type: [MetadataObjectSchema],
        required: true
    }
});

const MetadataArrayModel = mongoose.model<IMetadataArray>('MetadataArray', MetadataArraySchema);

export default MetadataArrayModel;
