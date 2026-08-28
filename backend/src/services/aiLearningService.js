const ProductMappingLearning = require("../models/ProductMappingLearning");
const Product = require("../models/Product");

class AiLearningService {
  /**
   * Looks up a previously learned override mapping for the given raw invoice product name.
   * @param {string} rawName - The extracted product name from the invoice.
   * @returns {Promise<object|null>} The mapped Product document from the database, or null if not learned.
   */
  static async getLearnedMapping(rawName) {
    if (!rawName) return null;
    const cleanKey = rawName.trim().toLowerCase();
    
    const learnedRecord = await ProductMappingLearning.findOne({ rawName: cleanKey });
    if (!learnedRecord) return null;

    // Verify product still exists in catalog
    const product = await Product.findOne({ _id: learnedRecord.productId, status: "active" });
    return product;
  }

  /**
   * Registers a manual matching mapping correction made by the user.
   * @param {string} rawName 
   * @param {string} productId 
   * @param {string} matchedName 
   */
  static async recordCorrection(rawName, productId, matchedName) {
    if (!rawName || !productId || !matchedName) return;
    const cleanKey = rawName.trim().toLowerCase();

    await ProductMappingLearning.findOneAndUpdate(
      { rawName: cleanKey },
      {
        productId,
        matchedName
      },
      { upsert: true, new: true }
    );
    console.log(`[AI-Learning] Successfully learned mapping: "${cleanKey}" ➔ "${matchedName}"`);
  }
}

module.exports = AiLearningService;
