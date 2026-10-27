import mongoose from "mongoose";

const repositorySchema = new mongoose.Schema(
  {
    repoId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    primaryLanguage: {
      type: String,
      default: "JavaScript",
    },
    defaultBranch: {
      type: String,
      default: "main",
    },
    connectionStatus: {
      type: String,
      enum: ["connected", "disconnected", "syncing", "error"],
      default: "connected",
    },
    starsCount: {
      type: Number,
      default: 0,
    },
    forksCount: {
      type: Number,
      default: 0,
    },
    openPrsCount: {
      type: Number,
      default: 0,
    },
    lastAnalyzedAt: {
      type: Date,
      default: null,
    },
    branches: {
      type: [String],
      default: ["main"],
    },
    modulesCount: {
      type: Number,
      default: 0,
    },
    testsCount: {
      type: Number,
      default: 0,
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

export const Repository = mongoose.models.Repository || mongoose.model("Repository", repositorySchema);
export default Repository;
