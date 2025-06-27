// utils/MedLinkEmbeddings.js
const { Embeddings } = require("@langchain/core/embeddings");
const { pipeline } = require("@xenova/transformers");

// Caching the pipeline for efficiency
let embeddingPipeline = null;

class MedLinkEmbeddings extends Embeddings {
  constructor(params) {
    super(params || {});
    // Using a well-supported sentence-transformer model
    this.modelName = "Xenova/all-MiniLM-L6-v2";
  }

  async _getPipeline() {
    if (embeddingPipeline === null) {
      // Load the feature-extraction pipeline
      embeddingPipeline = await pipeline("feature-extraction", this.modelName);
    }
    return embeddingPipeline;
  }

  // Method to embed a single query
  async embedQuery(text) {
    const pipe = await this._getPipeline();
    const result = await pipe(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(result.data);
  }

  // Method to embed multiple documents
  async embedDocuments(texts) {
    const pipe = await this._getPipeline();
    const embeddings = [];

    // Process each text individually to ensure proper handling
    for (const text of texts) {
      const result = await pipe(text, {
        pooling: "mean",
        normalize: true,
      });
      embeddings.push(Array.from(result.data));
    }

    return embeddings;
  }
}

module.exports = { MedLinkEmbeddings };

