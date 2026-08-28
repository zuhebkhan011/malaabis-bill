const mongoose = require("mongoose");

const productMappingLearningSchema = new mongoose.Schema(
  {
    rawName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true // store lowercase for quick mapping lookups
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    matchedName: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductMappingLearning", productMappingLearningSchema);
