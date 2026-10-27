import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    analysisId: {
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
    repositoryName: {
      type: String,
      default: "",
    },
    pullRequestId: {
      type: String,
      required: true,
      index: true,
    },
    pullRequestNumber: {
      type: Number,
      required: true,
    },
    pullRequestTitle: {
      type: String,
      required: true,
    },
    sourceBranch: {
      type: String,
      required: true,
    },
    targetBranch: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "completed",
    },
    riskLevel: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "low",
    },
    confidenceScore: {
      type: Number,
      default: 0.9,
    },
    summary: {
      type: String,
      default: "",
    },
    changedFilesCount: {
      type: Number,
      default: 0,
    },
    affectedFilesCount: {
      type: Number,
      default: 0,
    },
    testRecommendationsCount: {
      type: Number,
      default: 0,
    },
    changedFiles: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    affectedFiles: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    testRecommendations: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    evidence: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    graph: {
      nodes: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      edges: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Analysis = mongoose.models.Analysis || mongoose.model("Analysis", analysisSchema);
export default Analysis;
