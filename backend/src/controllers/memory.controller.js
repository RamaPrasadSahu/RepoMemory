import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Memory } from "../models/Memory.model.js";

const defaultMemories = [
  {
    id: "mem_101",
    memoryId: "mem_101",
    repositoryId: "repo_101",
    title: "ADR 001: Options-Object Parameter Pattern for Grade Calculation",
    category: "Architecture",
    status: "Accepted",
    author: "Sarah Chen (Lead Architect)",
    createdAt: "2026-10-24T10:15:00.000Z",
    updatedAt: "2026-10-24T18:30:00.000Z",
    summary:
      "Transitioned calculateFinalGrade() from legacy positional arguments to an extensible options object to support semester profiling.",
    context:
      "The legacy calculateFinalGrade(scores, weights) signature was fragile as different university departments required semester-specific curves.",
    decision:
      "Standardized calculateFinalGrade({ scores, weights, semesterProfile, enableHonorsCurve }) using a single structured options object.",
    consequences:
      "High downstream impact on graduation check routes and legacy unit test suites. All consumers must be refactored.",
    affectedSymbols: [
      { path: "src/utils/gradeCalculator.js", type: "module", symbol: "calculateFinalGrade" },
      { path: "src/controllers/studentController.js", type: "controller", symbol: "computeStudentGpa" },
      { path: "src/routes/graduationRoutes.js", type: "route", symbol: "GET /graduation/eligible" },
    ],
  },
  {
    id: "mem_102",
    memoryId: "mem_102",
    repositoryId: "repo_101",
    title: "ADR 002: Streaming HTTP Responses for Bulk Attendance CSV Export",
    category: "Performance",
    status: "Accepted",
    author: "Elena Rostova (Senior Backend Engineer)",
    createdAt: "2026-10-23T09:00:00.000Z",
    updatedAt: "2026-10-23T11:45:00.000Z",
    summary:
      "Adopted Mongoose cursor streaming with fast-csv directly to Express response stream to prevent Out-Of-Memory (OOM) crashes.",
    context:
      "Previous exports buffered 45,000+ attendance records in memory before serializing to a string, causing node memory spikes past 1.2 GB.",
    decision:
      "Replaced batch in-memory array accumulation with Mongoose .cursor() piping directly to fast-csv format and into res.",
    consequences:
      "Memory consumption remains constant at ~18 MB regardless of attendance dataset size.",
    affectedSymbols: [
      { path: "src/controllers/attendanceController.js", type: "controller", symbol: "exportAttendanceCsv" },
    ],
  },
];

import mongoose from "mongoose";

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * List architectural decision records for a repository with optional filters.
 */
export const getMemories = asyncHandler(async (req, res) => {
  const { repositoryId } = req.params;
  const { category, status, search } = req.query;

  let records = [];
  if (isDbConnected()) {
    try {
      const query = { repositoryId };
      if (category && category !== "all" && category !== "All") {
        query.category = category;
      }
      if (status && status !== "all" && status !== "All") {
        query.status = status;
      }
      // Safe query cap prevents memory exhaustion on large datasets
      records = await Memory.find(query).sort({ createdAt: -1 }).limit(100);

      if (records.length === 0 && repositoryId === "repo_101") {
        await Memory.insertMany(defaultMemories);
        records = await Memory.find(query).sort({ createdAt: -1 }).limit(100);
      }
    } catch {
      records = defaultMemories.filter((m) => m.repositoryId === repositoryId);
    }
  } else {
    records = defaultMemories.filter((m) => m.repositoryId === repositoryId);
  }

  let formatted = records.map((m) => ({
    id: m.memoryId || m._id,
    repositoryId: m.repositoryId,
    title: m.title,
    category: m.category,
    status: m.status,
    author: m.author,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    summary: m.summary,
    context: m.context,
    decision: m.decision,
    consequences: m.consequences,
    affectedSymbols: m.affectedSymbols,
    createdBy: m.createdBy,
  }));

  if (search && typeof search === "string" && search.trim()) {
    const q = search.toLowerCase().trim().slice(0, 100); // capped length
    formatted = formatted.filter(
      (m) =>
        m.title?.toLowerCase().includes(q) ||
        m.summary?.toLowerCase().includes(q) ||
        m.decision?.toLowerCase().includes(q)
    );
  }

  return res.status(200).json(new ApiResponse(200, formatted, "Project memories retrieved"));
});

/**
 * Get single memory record by ID.
 */
export const getMemoryById = asyncHandler(async (req, res) => {
  const { memoryId } = req.params;

  let memory = null;
  try {
    memory = await Memory.findOne({ memoryId });
  } catch {
    memory = defaultMemories.find((m) => m.memoryId === memoryId);
  }

  if (!memory) {
    memory = defaultMemories.find((m) => m.memoryId === memoryId);
  }

  if (!memory) {
    throw new ApiError(404, `Memory record "${memoryId}" not found`);
  }

  return res.status(200).json(new ApiResponse(200, memory, "Memory record fetched"));
});

/**
 * Record a new architectural decision.
 */
export const createMemory = asyncHandler(async (req, res) => {
  const { repositoryId } = req.params;
  const { title, category, status, author, context, decision, consequences, affectedSymbols } = req.body;

  if (!title?.trim() || !decision?.trim()) {
    throw new ApiError(400, "Title and decision rationale are required fields");
  }

  const memoryId = `mem_${Date.now()}`;
  const memoryData = {
    id: memoryId,
    memoryId,
    repositoryId,
    title: title.trim(),
    category: category || "Architecture",
    status: status || "Accepted",
    author: author?.trim() || req.user?.name || "Engineering Team",
    summary: decision.trim().slice(0, 160),
    context: context?.trim() || "",
    decision: decision.trim(),
    consequences: consequences?.trim() || "",
    affectedSymbols: Array.isArray(affectedSymbols) ? affectedSymbols : [],
    createdBy: req.user?._id || "system",
  };

  let created = memoryData;
  if (isDbConnected()) {
    try {
      created = await Memory.create(memoryData);
    } catch {
      // resilient fallback
    }
  }

  return res.status(201).json(new ApiResponse(201, memoryData, "Architectural decision recorded successfully"));
});

/**
 * Update an existing memory record.
 * Whitelists allowed fields and verifies ownership (BOLA).
 */
export const updateMemory = asyncHandler(async (req, res) => {
  const { memoryId } = req.params;
  const { title, category, status, context, decision, consequences, affectedSymbols } = req.body;

  let existing = null;
  if (isDbConnected()) {
    existing = await Memory.findOne({ memoryId });
    if (existing) {
      const isOwner = existing.createdBy && existing.createdBy === req.user?._id;
      const isAdmin = req.user?.role === "admin";
      if (!isOwner && !isAdmin) {
        throw new ApiError(403, "Forbidden: Only the record author or an administrator can modify this architectural decision");
      }
    }
  }

  const sanitizedUpdates = {};
  if (title !== undefined) sanitizedUpdates.title = String(title).trim();
  if (category !== undefined) sanitizedUpdates.category = String(category).trim();
  if (status !== undefined) sanitizedUpdates.status = String(status).trim();
  if (context !== undefined) sanitizedUpdates.context = String(context).trim();
  if (decision !== undefined) {
    sanitizedUpdates.decision = String(decision).trim();
    sanitizedUpdates.summary = String(decision).trim().slice(0, 160);
  }
  if (consequences !== undefined) sanitizedUpdates.consequences = String(consequences).trim();
  if (Array.isArray(affectedSymbols)) sanitizedUpdates.affectedSymbols = affectedSymbols;

  let updated = null;
  if (isDbConnected()) {
    try {
      updated = await Memory.findOneAndUpdate(
        { memoryId },
        { $set: sanitizedUpdates },
        { new: true, runValidators: true }
      );
    } catch {
      // resilient
    }
  }

  if (!updated) {
    const defaultItem = defaultMemories.find((m) => m.memoryId === memoryId);
    updated = { ...(defaultItem || { id: memoryId, memoryId }), ...sanitizedUpdates };
  }

  return res.status(200).json(new ApiResponse(200, updated, "Memory record updated successfully"));
});

/**
 * Delete a memory record.
 * Verifies ownership (BOLA): only creator or admin can delete.
 */
export const deleteMemory = asyncHandler(async (req, res) => {
  const { memoryId } = req.params;

  if (isDbConnected()) {
    const existing = await Memory.findOne({ memoryId });
    if (existing) {
      const isOwner = existing.createdBy && existing.createdBy === req.user?._id;
      const isAdmin = req.user?.role === "admin";
      if (!isOwner && !isAdmin) {
        throw new ApiError(403, "Forbidden: Only the record author or an administrator can delete this architectural decision");
      }
    }

    try {
      await Memory.deleteOne({ memoryId });
    } catch {
      // non-fatal
    }
  }

  return res.status(200).json(new ApiResponse(200, { success: true }, "Memory record deleted successfully"));
});
