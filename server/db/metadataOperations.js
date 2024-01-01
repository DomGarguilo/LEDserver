const MetadataArray = require('./schemas/metadata-schema');

const fetchMetadataArray = async () => {
    try {
        const metadataArrayDocument = await MetadataArray.findOne({});
        return metadataArrayDocument ? metadataArrayDocument.metadataArray : [];
    } catch (error) {
        console.error('Error fetching metadata array:', error);
        throw error;
    }
};

const replaceMetadataArray = async (newMetadataArray) => {
    try {
        const updatedDocument = await MetadataArray.findOneAndUpdate(
            {}, 
            { metadataArray: newMetadataArray }, 
            { upsert: true, new: true }
        );
        return updatedDocument;
    } catch (error) {
        console.error('Error replacing metadata array:', error);
        throw error;
    }
};

module.exports = { fetchMetadataArray, replaceMetadataArray };