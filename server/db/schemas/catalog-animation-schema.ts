import mongoose, { Document, Schema } from 'mongoose';

interface IAnimationCatalog extends Document {
  animationID: string;
  frameDuration: number;
  repeatCount: number;
  frameOrder: string[];
  createdAt: Date;
}

const AnimationCatalogSchema = new Schema<IAnimationCatalog>({
  animationID: {
    type: String,
    required: true,
    unique: true,
  },
  frameDuration: {
    type: Number,
    required: true,
  },
  repeatCount: {
    type: Number,
    required: true,
  },
  frameOrder: {
    type: [String],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AnimationCatalogModel = mongoose.model<IAnimationCatalog>('AnimationCatalog', AnimationCatalogSchema);

export default AnimationCatalogModel;
