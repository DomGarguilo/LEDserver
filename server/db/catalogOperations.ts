import { Metadata } from '../Metadata';
import AnimationCatalogModel from './schemas/catalog-animation-schema';
import ArchivedAnimationCatalogModel from './schemas/catalog-archived-animation-schema';

const fetchAnimationCatalog = async (): Promise<Metadata[]> => {
  try {
    const catalogDocuments = await AnimationCatalogModel.find({}, '-_id animationID frameDuration repeatCount frameOrder').lean();
    return catalogDocuments.map((doc) => new Metadata(doc.animationID, doc.frameDuration, doc.repeatCount, doc.frameOrder));
  } catch (error) {
    console.error('Error fetching animation catalog:', error);
    throw error;
  }
};

const fetchCatalogEntryById = async (animationID: string): Promise<Metadata | undefined> => {
  try {
    const doc = await AnimationCatalogModel.findOne({ animationID }, '-_id animationID frameDuration repeatCount frameOrder').lean();
    return doc ? new Metadata(doc.animationID, doc.frameDuration, doc.repeatCount, doc.frameOrder) : undefined;
  } catch (error) {
    console.error('Error fetching animation catalog entry:', error);
    throw error;
  }
};

const upsertCatalogEntries = async (metadataEntries: Metadata[]) => {
  try {
    const operations = metadataEntries.map((metadata) => (
      AnimationCatalogModel.findOneAndUpdate(
        { animationID: metadata.animationID },
        {
          animationID: metadata.animationID,
          frameDuration: metadata.frameDuration,
          repeatCount: metadata.repeatCount,
          frameOrder: metadata.frameOrder,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    ));

    await Promise.all(operations);
  } catch (error) {
    console.error('Error upserting animation catalog entries:', error);
    throw error;
  }
};

const archiveCatalogEntry = async (animationID: string): Promise<boolean> => {
  try {
    const catalogEntry = await AnimationCatalogModel.findOne({ animationID }).lean();

    if (!catalogEntry) {
      return false;
    }

    const { _id, ...entryWithoutId } = catalogEntry;

    await ArchivedAnimationCatalogModel.findOneAndUpdate(
      { animationID: entryWithoutId.animationID },
      { ...entryWithoutId, archivedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await AnimationCatalogModel.deleteOne({ animationID });

    return true;
  } catch (error) {
    console.error('Error archiving animation catalog entry:', error);
    throw error;
  }
};

export { fetchAnimationCatalog, fetchCatalogEntryById, upsertCatalogEntries, archiveCatalogEntry };
