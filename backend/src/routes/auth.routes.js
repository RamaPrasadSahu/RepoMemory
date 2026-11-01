import { Router } from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  getCurrentUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  googleLogin,
  microsoftLogin,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/logout").post(verifyJWT, logoutUser);

// Password recovery routes
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);

// Social OAuth Single Sign-On routes
router.route("/google").post(googleLogin);
router.route("/microsoft").post(microsoftLogin);

export default router;


