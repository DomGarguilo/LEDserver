import mongoose, { Document, Schema } from 'mongoose';

interface IArchivedAnimationCatalog extends Document {
  animationID: string;
  frameDuration: number;
  repeatCount: number;
  frameOrder: string[];
  createdAt: Date;
  archivedAt: Date;
}

const ArchivedAnimationCatalogSchema = new Schema<IArchivedAnimationCatalog>({
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
    required: true,
  },
  archivedAt: {
    type: Date,
    default: Date.now,
  },
});

const ArchivedAnimationCatalogModel = mongoose.model<IArchivedAnimationCatalog>('ArchivedAnimationCatalog', ArchivedAnimationCatalogSchema);

export default ArchivedAnimationCatalogModel;
