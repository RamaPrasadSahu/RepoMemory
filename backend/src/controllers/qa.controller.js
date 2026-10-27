import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { QA } from "../models/QA.model.js";
import { Repository } from "../models/Repository.model.js";
import { qaEngineService } from "../services/qaEngine.service.js";

const defaultSuggested = [
  "Where is user authentication and JWT verification handled?",
  "How is student GPA and final grade calculated?",
  "What happens when bulk attendance CSV export is triggered?",
  "Where are the Mongoose database schemas defined?",
  "Which test suites cover the grading algorithm?",
];

const defaultHistoryItems = [
  {
    id: "qa_101_1",
    qaId: "qa_101_1",
    repositoryId: "repo_101",
    question: "Where is user authentication and JWT verification handled?",
    answer:
      "User authentication is primarily handled in src/middleware/authMiddleware.js and src/controllers/authController.js. The verifyAuthToken middleware extracts bearer tokens from the incoming Authorization header, verifies them against process.env.ACCESS_TOKEN_SECRET, and attaches the decoded user payload to req.user.",
    confidenceScore: 0.98,
    category: "Authentication & Security",
    createdAt: "2026-10-24T12:00:00.000Z",
    sourceCitations: [
      {
        filePath: "src/middleware/authMiddleware.js",
        symbolName: "verifyAuthToken",
        lineRange: "Lines 14-38",
        codeSnippet:
          "export const verifyAuthToken = async (req, res, next) => {\n  const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');\n  if (!token) throw new ApiError(401, 'Unauthorized');\n  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);\n  req.user = await User.findById(decoded._id).select('-password');\n  next();\n};",
      },
    ],
    relatedNodes: ["src/middleware/authMiddleware.js", "src/controllers/authController.js"],
  },
];

import mongoose from "mongoose";

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Ask a code-grounded natural language question about a repository.
 */
export const askQuestion = asyncHandler(async (req, res) => {
  const { repositoryId } = req.params;
  const { question } = req.body;

  if (!question || !question.trim()) {
    throw new ApiError(400, "Question prompt is required");
  }

  let repo = null;
  if (isDbConnected()) {
    try {
      repo = await Repository.findOne({ repoId: repositoryId });
    } catch {
      // fallback
    }
  }

  // Generate code-grounded answer
  const generated = qaEngineService.generateAnswer(repo || { name: repositoryId }, question.trim());

  const qaId = `qa_${Date.now()}`;
  const responseItem = {
    id: qaId,
    qaId,
    repositoryId,
    question: question.trim(),
    answer: generated.answer,
    confidenceScore: generated.confidenceScore,
    category: generated.category,
    createdAt: new Date().toISOString(),
    sourceCitations: generated.sourceCitations,
    relatedNodes: generated.relatedNodes,
  };

  if (isDbConnected()) {
    try {
      await QA.create(responseItem);
    } catch {
      // resilient
    }
  }

  return res.status(200).json(new ApiResponse(200, responseItem, "Answer generated successfully"));
});

/**
 * Get suggested quick questions for a repository.
 */
export const getSuggestedQuestions = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, defaultSuggested, "Suggested questions retrieved"));
});

/**
 * Get Q&A query history for a repository.
 */
export const getQAHistory = asyncHandler(async (req, res) => {
  const { repositoryId } = req.params;

  let history = [];
  try {
    history = await QA.find({ repositoryId }).sort({ createdAt: -1 }).limit(50);
    if (history.length === 0 && repositoryId === "repo_101") {
      history = defaultHistoryItems;
    }
  } catch {
    history = defaultHistoryItems.filter((h) => h.repositoryId === repositoryId);
  }

  const formatted = history.map((item) => ({
    id: item.qaId || item.id || item._id,
    repositoryId: item.repositoryId,
    question: item.question,
    answer: item.answer,
    confidenceScore: item.confidenceScore,
    category: item.category,
    createdAt: item.createdAt,
    sourceCitations: item.sourceCitations,
    relatedNodes: item.relatedNodes,
  }));

  return res.status(200).json(new ApiResponse(200, formatted, "Q&A history retrieved"));
});
