import mongoose from "mongoose";

const qaSchema = new mongoose.Schema(
  {
    qaId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    repositoryId: {
      type: String,
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    confidenceScore: {
      type: Number,
      default: 0.95,
    },
    category: {
      type: String,
      default: "Codebase Architecture",
    },
    sourceCitations: {
      type: [
        {
          filePath: String,
          symbolName: String,
          lineRange: String,
          codeSnippet: String,
        },
      ],
      default: [],
    },
    relatedNodes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const QA = mongoose.models.QA || mongoose.model("QA", qaSchema);
export default QA;
