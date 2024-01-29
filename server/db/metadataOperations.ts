import { Metadata } from "../Metadata";
import MetadataArray from './schemas/metadata-schema';

/**
 * @returns {Promise<Metadata[]>} The metadata array from the database
 */
const fetchMetadataArray = async (): Promise<Metadata[]> => {
    try {
        const metadataArrayDocument = await MetadataArray.findOne({});
        return metadataArrayDocument ? metadataArrayDocument.metadataArray : [];
    } catch (error) {
        console.error('Error fetching metadata array:', error);
        throw error;
    }
};

/**
 * @param {Metadata[]} newMetadataArray The metadata array to replace the current one in the database
 */
const replaceMetadataArray = async (newMetadataArray: Metadata[]) => {
    try {
        await MetadataArray.findOneAndUpdate(
            {},
            { metadataArray: newMetadataArray },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error replacing metadata array:', error);
        throw error;
    }
};

export { fetchMetadataArray, replaceMetadataArray };