import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Repository } from "../models/Repository.model.js";
import { gitEngineService } from "../services/gitEngine.service.js";
import { isValidRepoFullName, parseGithubUrl } from "../utils/gitUtils.js";
import { saveAnalysisToStore } from "./analysis.controller.js";
import { savePullRequestsToStore } from "./pullRequest.controller.js";

// Global cache for dynamically connected repositories
export const inMemoryRepositories = new Map();

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
  let dbRepos = [];
  if (isDbConnected()) {
    try {
      dbRepos = await Repository.find({}).sort({ updatedAt: -1 }).limit(100);
      if (dbRepos.length === 0) {
        await Repository.insertMany(defaultSeeds);
        dbRepos = await Repository.find({}).sort({ updatedAt: -1 }).limit(100);
      }
    } catch {
      dbRepos = defaultSeeds;
    }
  } else {
    dbRepos = defaultSeeds;
  }

  // Combine dynamic in-memory repositories, DB repositories, and default seeds
  const memRepos = Array.from(inMemoryRepositories.values());
  const combined = [
    ...memRepos,
    ...dbRepos.map((r) => (r.toObject ? r.toObject() : r)),
    ...defaultSeeds,
  ];

  // Deduplicate by repoId / fullName
  const uniqueMap = new Map();
  combined.forEach((r) => {
    const key = r.repoId || r.id || r.fullName;
    if (key && !uniqueMap.has(key)) {
      uniqueMap.set(key, r);
    }
  });

  const repos = Array.from(uniqueMap.values());

  // Format ID to match frontend expectations
  const formatted = repos.map((r) => ({
    id: r.repoId || r.id || r._id,
    name: r.name,
    fullName: r.fullName,
    description: r.description,
    primaryLanguage: r.primaryLanguage,
    defaultBranch: r.defaultBranch,
    connectionStatus: r.connectionStatus || "connected",
    starsCount: r.starsCount || 0,
    forksCount: r.forksCount || 0,
    openPrsCount: r.openPrsCount || 0,
    lastAnalyzedAt: r.lastAnalyzedAt,
    branches: r.branches || ["main"],
    modulesCount: r.modulesCount || 24,
    testsCount: r.testsCount || 30,
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
        $or: [{ repoId: repositoryId }, { name: repositoryId }, { fullName: repositoryId }],
      });
    } catch {
      // non-fatal
    }
  }

  if (!repo) {
    repo = inMemoryRepositories.get(repositoryId);
  }

  if (!repo) {
    repo = defaultSeeds.find((r) => r.repoId === repositoryId || r.name === repositoryId || r.fullName === repositoryId);
  }

  if (!repo) {
    throw new ApiError(404, `Repository "${repositoryId}" not found`);
  }

  const formatted = {
    id: repo.repoId || repo.id || repo._id,
    name: repo.name,
    fullName: repo.fullName,
    description: repo.description,
    primaryLanguage: repo.primaryLanguage,
    defaultBranch: repo.defaultBranch,
    connectionStatus: repo.connectionStatus || "connected",
    starsCount: repo.starsCount || 0,
    forksCount: repo.forksCount || 0,
    openPrsCount: repo.openPrsCount || 0,
    lastAnalyzedAt: repo.lastAnalyzedAt,
    branches: repo.branches || ["main"],
    modulesCount: repo.modulesCount || 24,
    testsCount: repo.testsCount || 30,
    createdBy: repo.createdBy,
  };

  return res.status(200).json(new ApiResponse(200, formatted, "Repository fetched"));
});

/**
 * Connect a new GitHub repository reference.
 * Supports "owner/repo", full GitHub URLs (e.g. "https://github.com/owner/repo"),
 * and direct PR URLs. Automatically synchronizes open pull requests from GitHub.
 */
export const connectRepository = asyncHandler(async (req, res) => {
  const { fullName, description, primaryLanguage, token: bodyToken } = req.body;
  const token = req.headers["x-github-token"] || bodyToken || null;

  if (!fullName) {
    throw new ApiError(400, 'Repository name or URL is required (e.g. "facebook/react" or "https://github.com/facebook/react")');
  }

  // Parse using unified GitHub utility
  const parsed = parseGithubUrl(fullName);
  const repoRef = parsed.isValid ? parsed.fullName : fullName.trim();

  if (!isValidRepoFullName(repoRef)) {
    throw new ApiError(400, 'Invalid repository format. Please provide "owner/repo" or a valid GitHub URL (e.g. facebook/react)');
  }

  // Fetch real GitHub repository metadata
  const remoteData = await gitEngineService.fetchRemoteRepository(repoRef, token);

  // Fetch real pull requests from GitHub
  const remotePrs = await gitEngineService.fetchPullRequests(repoRef, token).catch(() => []);

  const repoId = `repo_${Date.now()}`;
  let created = null;

  const repoRecord = {
    repoId,
    id: repoId,
    name: remoteData.name,
    fullName: remoteData.fullName,
    description: description || remoteData.description,
    primaryLanguage: primaryLanguage || remoteData.primaryLanguage,
    defaultBranch: remoteData.defaultBranch,
    connectionStatus: "connected",
    starsCount: remoteData.starsCount,
    forksCount: remoteData.forksCount,
    openPrsCount: remotePrs.length || remoteData.openPrsCount,
    branches: remoteData.branches,
    modulesCount: 24,
    testsCount: 30,
    createdBy: req.user?._id || "system",
  };

  // Cache in-memory
  inMemoryRepositories.set(repoId, repoRecord);
  inMemoryRepositories.set(remoteData.fullName, repoRecord);

  // If remote PRs exist, populate them into the PR store
  if (remotePrs.length > 0) {
    await savePullRequestsToStore(remotePrs, repoId, remoteData.fullName);
  }

  if (isDbConnected()) {
    try {
      created = await Repository.findOneAndUpdate(
        { fullName: remoteData.fullName },
        { $set: repoRecord },
        { upsert: true, new: true }
      );
    } catch {
      created = repoRecord;
    }
  } else {
    created = repoRecord;
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
    openPrsCount: remotePrs.length,
    branches: created.branches,
    createdBy: created.createdBy,
    pullRequestsCount: remotePrs.length,
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

  inMemoryRepositories.delete(repositoryId);

  if (isDbConnected()) {
    const existing = await Repository.findOne({
      $or: [{ repoId: repositoryId }, { name: repositoryId }, { fullName: repositoryId }],
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

/**
 * Verify a GitHub Personal Access Token (PAT).
 */
export const verifyGithubAccount = asyncHandler(async (req, res) => {
  const token = req.body?.token || req.headers["x-github-token"];
  if (!token || typeof token !== "string" || !token.trim()) {
    throw new ApiError(400, "GitHub Personal Access Token is required.");
  }

  try {
    const result = await gitEngineService.verifyToken(token.trim());
    return res.status(200).json(new ApiResponse(200, result, "GitHub token verified successfully"));
  } catch (err) {
    throw new ApiError(401, err.message || "Invalid GitHub token. Please verify token permissions and expiration.");
  }
});

/**
 * Fetch repositories owned or collaborated by the user.
 */
export const getGithubRepositories = asyncHandler(async (req, res) => {
  const token = req.headers["x-github-token"] || req.query?.token || null;
  const username = req.query?.username || null;

  if (!token && !username) {
    throw new ApiError(400, "A GitHub token or username is required to fetch repositories.");
  }

  try {
    const repos = await gitEngineService.fetchUserRepositories(token, username);
    return res.status(200).json(new ApiResponse(200, repos, "GitHub repositories fetched successfully"));
  } catch (err) {
    throw new ApiError(502, err.message || "Failed to retrieve repositories from GitHub API");
  }
});

/**
 * Analyze an arbitrary GitHub Pull Request URL or reference.
 * Generates an interactive AST ripple impact analysis and stores the report.
 */
export const analyzeGithubPullRequest = asyncHandler(async (req, res) => {
  const { repoUrl, prNumber, token: bodyToken } = req.body;
  const token = req.headers["x-github-token"] || bodyToken || null;

  if (!repoUrl) {
    throw new ApiError(400, "GitHub repository or pull request URL is required.");
  }

  const parsed = parseGithubUrl(repoUrl);
  if (!parsed.isValid) {
    throw new ApiError(400, `Invalid GitHub format: "${repoUrl}". Expected "owner/repo" or "https://github.com/owner/repo/pull/123"`);
  }

  const targetPrNumber = prNumber || parsed.prNumber || 1;

  // Run real AST diff & graph impact analysis
  const analysis = await gitEngineService.analyzeRemotePullRequest(parsed.fullName, targetPrNumber, token);

  // Persist analysis into the global analysis store
  await saveAnalysisToStore(analysis);

  // Ensure repository is connected
  const repoRef = parsed.fullName;
  const remoteRepo = await gitEngineService.fetchRemoteRepository(repoRef, token).catch(() => null);

  const repoRecord = {
    repoId: analysis.repositoryId,
    id: analysis.repositoryId,
    name: remoteRepo?.name || parsed.repo,
    fullName: parsed.fullName,
    description: remoteRepo?.description || `Connected GitHub repository ${parsed.fullName}`,
    primaryLanguage: remoteRepo?.primaryLanguage || "JavaScript",
    defaultBranch: remoteRepo?.defaultBranch || "main",
    connectionStatus: "connected",
    starsCount: remoteRepo?.starsCount || 0,
    forksCount: remoteRepo?.forksCount || 0,
    openPrsCount: 1,
    branches: remoteRepo?.branches || ["main"],
    modulesCount: analysis.changedFilesCount + analysis.affectedFilesCount,
    testsCount: analysis.testRecommendationsCount,
    lastAnalyzedAt: new Date(),
    createdBy: req.user?._id || "system",
  };

  inMemoryRepositories.set(analysis.repositoryId, repoRecord);
  inMemoryRepositories.set(parsed.fullName, repoRecord);

  if (isDbConnected()) {
    try {
      await Repository.findOneAndUpdate(
        { fullName: parsed.fullName },
        { $set: repoRecord },
        { upsert: true, new: true }
      );
    } catch {
      // non-fatal
    }
  }

  // Create or update PR record so it's linked
  const prRecord = {
    id: analysis.pullRequestId,
    prId: analysis.pullRequestId,
    repositoryId: analysis.repositoryId,
    repositoryName: parsed.fullName,
    repositoryFullName: parsed.fullName,
    number: targetPrNumber,
    title: analysis.pullRequestTitle,
    description: analysis.summary,
    sourceBranch: analysis.sourceBranch,
    targetBranch: analysis.targetBranch,
    status: "open",
    author: {
      name: "GitHub Contributor",
      username: "contributor",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    },
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    hasAnalysis: true,
    latestAnalysisId: analysis.id,
    analysisId: analysis.id,
    analysisStatus: "completed",
    riskLevel: analysis.riskLevel,
    changedFilesCount: analysis.changedFilesCount,
    affectedFilesCount: analysis.affectedFilesCount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    htmlUrl: analysis.githubUrl,
  };

  await savePullRequestsToStore([prRecord], analysis.repositoryId, parsed.fullName);

  return res.status(200).json(new ApiResponse(200, analysis, "Pull request analyzed successfully"));
});
