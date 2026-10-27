import { Router } from "express";
import {
  getPullRequestById,
  getPullRequestAnalysis,
  startPullRequestAnalysis,
} from "../controllers/pullRequest.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Enforce cryptographic JWT authentication on all pull request routes
router.use(verifyJWT);

router.route("/:pullRequestId").get(getPullRequestById);
router.route("/:pullRequestId/analysis").get(getPullRequestAnalysis);
router.route("/:pullRequestId/analyze").post(startPullRequestAnalysis);

export default router;

