import mongoose from "mongoose";

const pullRequestSchema = new mongoose.Schema(
  {
    prId: {
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
    number: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    sourceBranch: {
      type: String,
      required: true,
    },
    targetBranch: {
      type: String,
      required: true,
      default: "main",
    },
    status: {
      type: String,
      enum: ["open", "closed", "merged"],
      default: "open",
    },
    author: {
      type: String,
      default: "developer",
    },
    authorAvatar: {
      type: String,
      default: "",
    },
    hasAnalysis: {
      type: Boolean,
      default: false,
    },
    latestAnalysisId: {
      type: String,
      default: null,
    },
    riskLevel: {
      type: String,
      enum: ["high", "medium", "low", "pending"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

pullRequestSchema.index({ repositoryId: 1, number: 1 }, { unique: true });

export const PullRequest = mongoose.models.PullRequest || mongoose.model("PullRequest", pullRequestSchema);
export default PullRequest;
