import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    memoryId: {
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Architecture", "Security", "Performance", "Integration", "Data Modeling", "Refactoring"],
      default: "Architecture",
    },
    status: {
      type: String,
      enum: ["Accepted", "Proposed", "Deprecated", "Superseded"],
      default: "Accepted",
    },
    author: {
      type: String,
      default: "Engineering Team",
    },
    summary: {
      type: String,
      default: "",
    },
    context: {
      type: String,
      default: "",
    },
    decision: {
      type: String,
      required: true,
    },
    consequences: {
      type: String,
      default: "",
    },
    affectedSymbols: {
      type: [
        {
          path: String,
          type: { type: String },
          symbol: String,
        },
      ],
      default: [],
    },
    createdBy: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Memory = mongoose.models.Memory || mongoose.model("Memory", memorySchema);
export default Memory;
