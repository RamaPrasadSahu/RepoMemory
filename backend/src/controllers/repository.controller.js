import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Repository } from "../models/Repository.model.js";
import { gitEngineService } from "../services/gitEngine.service.js";
import { isValidRepoFullName } from "../utils/gitUtils.js";

// Seed default repositories if DB is fresh
const defaultSeeds = [
  {
    repoId: "repo_101",
    name: "student-management-system",
    fullName: "acme-corp/student-management-system",
    description: "Core backend REST API for managing student enrollment, grading algorithms, and faculty rosters.",
    primaryLanguage: "JavaScript",
    defaultBranch: "main",
    connectionStatus: "connected",
    starsCount: 142,
    forksCount: 38,
    openPrsCount: 2,
    lastAnalyzedAt: new Date("2026-10-24T18:45:00.000Z"),
    branches: ["main", "develop", "staging", "feature/grade-calc-v2", "feature/csv-export"],
    modulesCount: 48,
    testsCount: 64,
  },
  {
    repoId: "repo_102",
    name: "commerce-api-gateway",
    fullName: "acme-corp/commerce-api-gateway",
    description: "High-throughput payment gateway and inventory reservation orchestrator.",
    primaryLanguage: "TypeScript",
    defaultBranch: "master",
    connectionStatus: "connected",
    starsCount: 310,
    forksCount: 84,
    openPrsCount: 1,
    lastAnalyzedAt: new Date("2026-10-24T14:20:00.000Z"),
    branches: ["master", "release/v2.4", "payment-v2"],
    modulesCount: 92,
    testsCount: 140,
  },
];

import mongoose from "mongoose";

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * List all connected repositories.
 */
export const getAllRepositories = asyncHandler(async (req, res) => {
  let repos = [];
  if (isDbConnected()) {
    try {
      // Safe upper query cap prevents unbounded memory exhaustion
      repos = await Repository.find({}).sort({ updatedAt: -1 }).limit(100);
      if (repos.length === 0) {
        await Repository.insertMany(defaultSeeds);
        repos = await Repository.find({}).sort({ updatedAt: -1 }).limit(100);
      }
    } catch {
      repos = defaultSeeds;
    }
  } else {
    repos = defaultSeeds;
  }

  // Format ID to match frontend expectations
  const formatted = repos.map((r) => ({
    id: r.repoId || r._id,
    name: r.name,
    fullName: r.fullName,
    description: r.description,
    primaryLanguage: r.primaryLanguage,
    defaultBranch: r.defaultBranch,
    connectionStatus: r.connectionStatus,
    starsCount: r.starsCount,
    forksCount: r.forksCount,
    openPrsCount: r.openPrsCount,
    lastAnalyzedAt: r.lastAnalyzedAt,
    branches: r.branches,
    modulesCount: r.modulesCount,
    testsCount: r.testsCount,
    createdBy: r.createdBy,
  }));

  return res.status(200).json(new ApiResponse(200, formatted, "Repositories retrieved"));
});

/**
 * Get repository details by ID.
 */
export const getRepositoryById = asyncHandler(async (req, res) => {
  const { repositoryId } = req.params;

  let repo = null;
  if (isDbConnected()) {
    try {
      repo = await Repository.findOne({
        $or: [{ repoId: repositoryId }, { name: repositoryId }],
      });
    } catch {
      repo = defaultSeeds.find((r) => r.repoId === repositoryId || r.name === repositoryId);
    }
  } else {
    repo = defaultSeeds.find((r) => r.repoId === repositoryId || r.name === repositoryId);
  }

  if (!repo) {
    repo = defaultSeeds.find((r) => r.repoId === repositoryId || r.name === repositoryId);
  }

  if (!repo) {
    throw new ApiError(404, `Repository "${repositoryId}" not found`);
  }

  const formatted = {
    id: repo.repoId || repo._id,
    name: repo.name,
    fullName: repo.fullName,
    description: repo.description,
    primaryLanguage: repo.primaryLanguage,
    defaultBranch: repo.defaultBranch,
    connectionStatus: repo.connectionStatus,
    starsCount: repo.starsCount,
    forksCount: repo.forksCount,
    openPrsCount: repo.openPrsCount,
    lastAnalyzedAt: repo.lastAnalyzedAt,
    branches: repo.branches,
    modulesCount: repo.modulesCount,
    testsCount: repo.testsCount,
    createdBy: repo.createdBy,
  };

  return res.status(200).json(new ApiResponse(200, formatted, "Repository fetched"));
});

/**
 * Connect a new GitHub repository reference.
 */
export const connectRepository = asyncHandler(async (req, res) => {
  const { fullName, description, primaryLanguage } = req.body;

  if (!fullName || !isValidRepoFullName(fullName)) {
    throw new ApiError(400, 'Invalid repository format. Please provide "owner/repo" (e.g. facebook/react)');
  }

  // Fetch real GitHub repository metadata
  const remoteData = await gitEngineService.fetchRemoteRepository(fullName.trim());

  const repoId = `repo_${Date.now()}`;
  let created = null;

  try {
    created = await Repository.findOneAndUpdate(
      { fullName: remoteData.fullName },
      {
        $set: {
          repoId,
          name: remoteData.name,
          fullName: remoteData.fullName,
          description: description || remoteData.description,
          primaryLanguage: primaryLanguage || remoteData.primaryLanguage,
          defaultBranch: remoteData.defaultBranch,
          connectionStatus: "connected",
          starsCount: remoteData.starsCount,
          forksCount: remoteData.forksCount,
          branches: remoteData.branches,
          modulesCount: 24,
          testsCount: 30,
          createdBy: req.user?._id || "system",
        },
      },
      { upsert: true, new: true }
    );
  } catch {
    created = {
      id: repoId,
      createdBy: req.user?._id || "system",
      ...remoteData,
    };
  }

  const responseData = {
    id: created.repoId || repoId,
    name: created.name,
    fullName: created.fullName,
    description: created.description,
    primaryLanguage: created.primaryLanguage,
    defaultBranch: created.defaultBranch,
    connectionStatus: "connected",
    starsCount: created.starsCount,
    forksCount: created.forksCount,
    branches: created.branches,
    createdBy: created.createdBy,
  };

  return res.status(201).json(new ApiResponse(201, responseData, "Repository connected successfully"));
});

/**
 * Disconnect a repository.
 * Enforces Broken Object-Level Authorization (BOLA) verification:
 * Only the owner or an admin can disconnect a repository.
 */
export const disconnectRepository = asyncHandler(async (req, res) => {
  const { repositoryId } = req.params;

  if (isDbConnected()) {
    const existing = await Repository.findOne({
      $or: [{ repoId: repositoryId }, { name: repositoryId }],
    });

    if (existing) {
      const isOwner = existing.createdBy && existing.createdBy === req.user?._id;
      const isAdmin = req.user?.role === "admin";
      if (!isOwner && !isAdmin) {
        throw new ApiError(403, "Forbidden: Only the repository creator or an administrator can disconnect this repository");
      }
      await Repository.deleteOne({ _id: existing._id });
    }
  }

  return res.status(200).json(new ApiResponse(200, { success: true }, "Repository disconnected"));
});
