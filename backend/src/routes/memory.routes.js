import { Router } from "express";
import {
  getMemoryById,
  updateMemory,
  deleteMemory,
} from "../controllers/memory.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Enforce cryptographic JWT authentication on all standalone memory routes
router.use(verifyJWT);

router.route("/:memoryId")
  .get(getMemoryById)
  .put(updateMemory)
  .delete(deleteMemory);

export default router;

