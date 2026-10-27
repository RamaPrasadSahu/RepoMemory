import { Router } from "express";
import {
  getAllRepositories,
  getRepositoryById,
  connectRepository,
  disconnectRepository,
} from "../controllers/repository.controller.js";
import { getPullRequests } from "../controllers/pullRequest.controller.js";
import {
  askQuestion,
  getSuggestedQuestions,
  getQAHistory,
} from "../controllers/qa.controller.js";
import {
  getMemories,
  createMemory,
} from "../controllers/memory.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Enforce cryptographic JWT authentication on all repository routes
router.use(verifyJWT);

// Base Repository Endpoints
router.route("/").get(getAllRepositories);
router.route("/connect").post(connectRepository);
router.route("/:repositoryId")
  .get(getRepositoryById)
  .delete(disconnectRepository);

// Repository Pull Requests
router.route("/:repositoryId/pull-requests").get(getPullRequests);

// Repository Q&A Endpoints
router.route("/:repositoryId/qa").post(askQuestion);
router.route("/:repositoryId/qa/suggested").get(getSuggestedQuestions);
router.route("/:repositoryId/qa/history").get(getQAHistory);

// Repository Architectural Memory (ADR) Endpoints
router.route("/:repositoryId/memory")
  .get(getMemories)
  .post(createMemory);

export default router;

