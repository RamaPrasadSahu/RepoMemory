import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Analysis } from "../models/Analysis.model.js";

// Standard reference analysis data matching frontend expectations
const defaultAnalysisDetails = {
  id: "analysis_101",
  analysisId: "analysis_101",
  repositoryId: "repo_101",
  repositoryName: "student-management-system",
  pullRequestId: "pr_401",
  pullRequestNumber: 142,
  pullRequestTitle: "Refactor student authentication and grade calculation logic",
  sourceBranch: "feature/grade-calc-v2",
  targetBranch: "main",
  status: "completed",
  riskLevel: "high",
  confidenceScore: 0.94,
  summary:
    "Modifications to studentController.js and gradeCalculator.js alter the parameter signature of calculateFinalGrade(), impacting multiple downstream graduation check routes, transcript exports, and legacy test suites that pass positional arguments.",
  changedFilesCount: 3,
  affectedFilesCount: 7,
  testRecommendationsCount: 4,
  changedFiles: [
    {
      path: "src/controllers/studentController.js",
      type: "controller",
      status: "changed",
      additions: 48,
      deletions: 22,
      modifiedFunctions: ["computeStudentGpa", "getAcademicHistory", "updateStudentEnrollment"],
      summary: "Refactored computeStudentGpa to delegate calculation to updated gradeCalculator module.",
    },
    {
      path: "src/utils/gradeCalculator.js",
      type: "module",
      status: "changed",
      additions: 85,
      deletions: 40,
      modifiedFunctions: ["calculateFinalGrade", "normalizeHonorScores"],
      summary: "Changed calculateFinalGrade signature from positional (scores, weights) to options object.",
    },
    {
      path: "src/middleware/authMiddleware.js",
      type: "middleware",
      status: "changed",
      additions: 12,
      deletions: 4,
      modifiedFunctions: ["verifyFacultyRole"],
      summary: "Added department scoping check in verifyFacultyRole.",
    },
  ],
  affectedFiles: [
    {
      path: "src/routes/studentRoutes.js",
      type: "route",
      status: "affected",
      classification: "direct",
      reason: "Mounts computeStudentGpa on GET /api/v1/students/:id/gpa.",
      confidence: 0.98,
    },
    {
      path: "src/routes/graduationRoutes.js",
      type: "route",
      status: "affected",
      classification: "transitive",
      reason: "Directly imports calculateFinalGrade from src/utils/gradeCalculator.js using old positional arguments.",
      confidence: 0.95,
    },
    {
      path: "src/services/transcriptService.js",
      type: "service",
      status: "affected",
      classification: "transitive",
      reason: "Calls studentController.getAcademicHistory during PDF generation.",
      confidence: 0.89,
    },
    {
      path: "src/models/Student.js",
      type: "model",
      status: "affected",
      classification: "transitive",
      reason: "Mongoose virtual field invokes gradeCalculator internally on document retrieval.",
      confidence: 0.86,
    },
    {
      path: "tests/unit/gradeCalculator.test.js",
      type: "test",
      status: "affected",
      classification: "test_coverage",
      reason: "Directly exercises calculateFinalGrade using old positional signature.",
      confidence: 1.0,
    },
  ],
  testRecommendations: [
    {
      id: "test_rec_1",
      name: "Grade Calculator Unit Tests",
      testFile: "tests/unit/gradeCalculator.test.js",
      priority: "high",
      command: "npm test -- tests/unit/gradeCalculator.test.js",
      targetType: "unit",
      estimatedDuration: "1.2s",
      reason: "Direct unit test suite for modified function calculateFinalGrade().",
    },
    {
      id: "test_rec_2",
      name: "Student Controller Integration Tests",
      testFile: "tests/integration/studentApi.test.js",
      priority: "high",
      command: "npm test -- tests/integration/studentApi.test.js",
      targetType: "integration",
      estimatedDuration: "4.8s",
      reason: "Verifies student GPA endpoint behavior with new semester query params.",
    },
    {
      id: "test_rec_3",
      name: "Graduation Eligibility E2E Flow",
      testFile: "tests/e2e/graduationFlow.spec.js",
      priority: "medium",
      command: "npx playwright test tests/e2e/graduationFlow.spec.js",
      targetType: "e2e",
      estimatedDuration: "12.4s",
      reason: "Ensures graduation audit report renders valid honors calculations.",
    },
  ],
  evidence: [
    {
      id: "ev_1",
      title: "Function Signature Mismatch in AST Call Expression",
      type: "verified_ast",
      isAiGenerated: false,
      sourceFile: "src/utils/gradeCalculator.js",
      targetFile: "src/routes/graduationRoutes.js",
      confidence: 0.98,
      description:
        "AST analysis detected export function calculateFinalGrade({ scores, weights, semesterProfile }), whereas graduationRoutes.js:94 calls calculateFinalGrade(student.scores, student.weights).",
      codeSnippet: "// In src/routes/graduationRoutes.js:94\nconst gpa = calculateFinalGrade(student.scores, student.weights);\n// Expects: calculateFinalGrade({ scores, weights, semesterProfile })",
    },
    {
      id: "ev_2",
      title: "Static Import Relationship",
      type: "verified_ast",
      isAiGenerated: false,
      sourceFile: "src/controllers/studentController.js",
      targetFile: "src/routes/studentRoutes.js",
      confidence: 1.0,
      description: "src/routes/studentRoutes.js contains import { computeStudentGpa } from '../controllers/studentController.js'.",
      codeSnippet: "import { computeStudentGpa } from '../controllers/studentController.js';\nrouter.get('/:id/gpa', verifyFacultyRole, computeStudentGpa);",
    },
  ],
  graph: {
    nodes: [
      {
        id: "src/controllers/studentController.js",
        label: "studentController.js",
        path: "src/controllers/studentController.js",
        type: "controller",
        status: "changed",
        metadata: { language: "javascript", additions: 48, deletions: 22 },
      },
      {
        id: "src/utils/gradeCalculator.js",
        label: "gradeCalculator.js",
        path: "src/utils/gradeCalculator.js",
        type: "module",
        status: "changed",
        metadata: { language: "javascript", additions: 85, deletions: 40 },
      },
      {
        id: "src/middleware/authMiddleware.js",
        label: "authMiddleware.js",
        path: "src/middleware/authMiddleware.js",
        type: "middleware",
        status: "changed",
        metadata: { language: "javascript", additions: 12, deletions: 4 },
      },
      {
        id: "src/routes/studentRoutes.js",
        label: "studentRoutes.js",
        path: "src/routes/studentRoutes.js",
        type: "route",
        status: "affected",
        metadata: { language: "javascript" },
      },
      {
        id: "src/routes/graduationRoutes.js",
        label: "graduationRoutes.js",
        path: "src/routes/graduationRoutes.js",
        type: "route",
        status: "affected",
        metadata: { language: "javascript" },
      },
      {
        id: "src/services/transcriptService.js",
        label: "transcriptService.js",
        path: "src/services/transcriptService.js",
        type: "service",
        status: "affected",
        metadata: { language: "javascript" },
      },
      {
        id: "src/models/Student.js",
        label: "Student.js",
        path: "src/models/Student.js",
        type: "model",
        status: "affected",
        metadata: { language: "javascript" },
      },
      {
        id: "tests/unit/gradeCalculator.test.js",
        label: "gradeCalculator.test.js",
        path: "tests/unit/gradeCalculator.test.js",
        type: "test",
        status: "affected",
        metadata: { language: "javascript" },
      },
    ],
    edges: [
      { id: "e1", source: "src/controllers/studentController.js", target: "src/utils/gradeCalculator.js", type: "imports", label: "imports" },
      { id: "e2", source: "src/routes/studentRoutes.js", target: "src/controllers/studentController.js", type: "imports", label: "calls" },
      { id: "e3", source: "src/routes/graduationRoutes.js", target: "src/utils/gradeCalculator.js", type: "imports", label: "calls" },
      { id: "e4", source: "src/services/transcriptService.js", target: "src/controllers/studentController.js", type: "imports", label: "calls" },
      { id: "e5", source: "src/models/Student.js", target: "src/utils/gradeCalculator.js", type: "imports", label: "imports" },
      { id: "e6", source: "tests/unit/gradeCalculator.test.js", target: "src/utils/gradeCalculator.js", type: "imports", label: "tests" },
      { id: "e7", source: "src/routes/studentRoutes.js", target: "src/middleware/authMiddleware.js", type: "imports", label: "uses" },
    ],
  },
};

import mongoose from "mongoose";

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Get full analysis report by ID.
 */
export const getAnalysisById = asyncHandler(async (req, res) => {
  const { analysisId } = req.params;

  let analysis = null;
  if (isDbConnected()) {
    try {
      analysis = await Analysis.findOne({ analysisId });
    } catch {
      // handled below
    }
  }

  if (!analysis) {
    analysis = defaultAnalysisDetails;
  }

  return res.status(200).json(new ApiResponse(200, analysis, "Analysis report retrieved"));
});

/**
 * Get React Flow graph for an analysis.
 */
export const getAnalysisGraph = asyncHandler(async (req, res) => {
  const { analysisId } = req.params;

  let analysis = null;
  try {
    analysis = await Analysis.findOne({ analysisId });
  } catch {
    // handled below
  }

  const graph = analysis?.graph || defaultAnalysisDetails.graph;
  return res.status(200).json(new ApiResponse(200, graph, "Analysis graph fetched"));
});

/**
 * Get downstream affected files for an analysis.
 */
export const getAffectedFiles = asyncHandler(async (req, res) => {
  const { analysisId } = req.params;

  let analysis = null;
  try {
    analysis = await Analysis.findOne({ analysisId });
  } catch {
    // handled below
  }

  const affectedFiles = analysis?.affectedFiles || defaultAnalysisDetails.affectedFiles;
  return res.status(200).json(new ApiResponse(200, affectedFiles, "Affected files fetched"));
});

/**
 * Get test recommendations for an analysis.
 */
export const getTestRecommendations = asyncHandler(async (req, res) => {
  const { analysisId } = req.params;

  let analysis = null;
  try {
    analysis = await Analysis.findOne({ analysisId });
  } catch {
    // handled below
  }

  const testRecommendations = analysis?.testRecommendations || defaultAnalysisDetails.testRecommendations;
  return res.status(200).json(new ApiResponse(200, testRecommendations, "Test recommendations fetched"));
});

/**
 * Get paginated analysis history runs.
 */
export const getAnalysisHistory = asyncHandler(async (req, res) => {
  const rawPage = parseInt(req.query.page, 10) || 1;
  const rawLimit = parseInt(req.query.limit, 10) || 10;
  const page = Math.max(rawPage, 1);
  const limit = Math.min(Math.max(rawLimit, 1), 100);
  const repositoryId = req.query.repositoryId;
  const risk = req.query.risk;

  const historyList = [
    defaultAnalysisDetails,
    {
      id: "analysis_102",
      analysisId: "analysis_102",
      repositoryId: "repo_102",
      repositoryName: "commerce-api-gateway",
      pullRequestId: "pr_404",
      pullRequestNumber: 89,
      pullRequestTitle: "Migrate checkout payment intent to v2 Stripe webhook handler",
      sourceBranch: "payment-v2",
      targetBranch: "master",
      status: "completed",
      riskLevel: "high",
      summary: "Updates async webhook idempotency handler. Affects order status reconciliation.",
      changedFilesCount: 4,
      affectedFilesCount: 9,
      testRecommendationsCount: 5,
      createdAt: "2026-10-24T14:20:00.000Z",
    },
    {
      id: "analysis_103",
      analysisId: "analysis_103",
      repositoryId: "repo_103",
      repositoryName: "analytics-event-pipeline",
      pullRequestId: "pr_405",
      pullRequestNumber: 54,
      pullRequestTitle: "Add payload schema validation for telemetry events",
      sourceBranch: "fix/event-validator",
      targetBranch: "main",
      status: "completed",
      riskLevel: "medium",
      summary: "Schema validator enforces strict type checks on ingestion.",
      changedFilesCount: 2,
      affectedFilesCount: 4,
      testRecommendationsCount: 2,
      createdAt: "2026-10-23T21:10:00.000Z",
    },
  ];

  let filtered = [...historyList];
  if (repositoryId && repositoryId !== "all") {
    filtered = filtered.filter((h) => h.repositoryId === repositoryId);
  }
  if (risk && risk !== "all") {
    filtered = filtered.filter((h) => h.riskLevel === risk);
  }

  const paginated = {
    analyses: filtered.slice((page - 1) * limit, page * limit),
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit) || 1,
  };

  return res.status(200).json(new ApiResponse(200, paginated, "Analysis history fetched"));
});
