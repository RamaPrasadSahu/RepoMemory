import { Router } from "express";
import {
  getAnalysisById,
  getAnalysisGraph,
  getAffectedFiles,
  getTestRecommendations,
  getAnalysisHistory,
} from "../controllers/analysis.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Enforce cryptographic JWT authentication on all analysis routes
router.use(verifyJWT);

router.route("/").get(getAnalysisHistory);
router.route("/:analysisId").get(getAnalysisById);
router.route("/:analysisId/graph").get(getAnalysisGraph);
router.route("/:analysisId/affected-files").get(getAffectedFiles);
router.route("/:analysisId/test-recommendations").get(getTestRecommendations);

export default router;
