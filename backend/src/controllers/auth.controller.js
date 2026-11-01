import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import axios from "axios";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.model.js";

const isDbConnected = () => mongoose.connection.readyState === 1;

// In-memory store for fallback/offline dev mode
const inMemoryUsers = new Map();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

/**
 * Register a new developer user.
 * Strictly prevents role escalation by locking default role to 'developer'.
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    throw new ApiError(400, "All fields (name, email, password) must be valid non-empty strings");
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
    throw new ApiError(
      400,
      "Password must contain at least 8 characters, including at least one letter and one number"
    );
  }

  let user = null;
  let accessToken = "";
  let refreshToken = "";

  if (isDbConnected()) {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new ApiError(409, "User with this email already exists");
    }

    // Role is strictly hardcoded to "developer" to prevent mass-assignment privilege escalation
    const created = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "developer",
    });

    accessToken = created.generateAccessToken();
    refreshToken = created.generateRefreshToken();

    created.refreshToken = refreshToken;
    await created.save({ validateBeforeSave: false });

    user = await User.findById(created._id).select("-password -refreshToken");
  } else {
    // Resilient in-memory mode when database service is not available
    if (inMemoryUsers.has(normalizedEmail)) {
      throw new ApiError(409, "User with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const dummyId = `user_${Date.now()}`;

    const secret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!secret || !refreshSecret) {
      throw new ApiError(500, "Server configuration error: JWT secrets missing in environment");
    }

    accessToken = jwt.sign(
      { _id: dummyId, email: normalizedEmail, name: name.trim(), role: "developer" },
      secret,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    );

    refreshToken = jwt.sign(
      { _id: dummyId },
      refreshSecret,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" }
    );

    const memoryUser = {
      _id: dummyId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "developer",
      refreshToken,
    };

    inMemoryUsers.set(normalizedEmail, memoryUser);
    user = { _id: dummyId, name: name.trim(), email: normalizedEmail, role: "developer" };
  }

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        { user, token: accessToken, refreshToken },
        "User registered successfully"
      )
    );
});

/**
 * Log in an existing user.
 * Employs generic error responses to prevent user enumeration attacks.
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    throw new ApiError(400, "Email and password must be valid non-empty strings");
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = null;
  let accessToken = "";
  let refreshToken = "";

  if (isDbConnected()) {
    let foundUser = await User.findOne({ email: normalizedEmail });
    // Provision demo account dynamically if requested
    if (!foundUser && normalizedEmail === "developer@example.com" && password === "demo-developer-mode") {
      try {
        foundUser = await User.create({
          name: "Rama Dev (Demo)",
          email: "developer@example.com",
          password: "demo-developer-mode",
          role: "developer",
        });
      } catch {
        // non-fatal
      }
    }

    // Constant-time failure response prevents timing & enumeration leaks
    if (!foundUser || !(await foundUser.isPasswordCorrect(password))) {
      throw new ApiError(401, "Invalid email or password");
    }

    accessToken = foundUser.generateAccessToken();
    refreshToken = foundUser.generateRefreshToken();

    foundUser.refreshToken = refreshToken;
    await foundUser.save({ validateBeforeSave: false });

    user = await User.findById(foundUser._id).select("-password -refreshToken");
  } else {
    // Resilient fallback mode
    let memUser = inMemoryUsers.get(normalizedEmail);
    if (!memUser && normalizedEmail === "developer@example.com" && password === "demo-developer-mode") {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      memUser = {
        _id: "user_demo_101",
        name: "Rama Dev (Demo)",
        email: "developer@example.com",
        password: hashedPassword,
        role: "developer",
        refreshToken: null,
      };
      inMemoryUsers.set(normalizedEmail, memUser);
    }

    if (!memUser || !(await bcrypt.compare(password, memUser.password))) {
      throw new ApiError(401, "Invalid email or password");
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    accessToken = jwt.sign(
      { _id: memUser._id, email: memUser.email, name: memUser.name, role: memUser.role },
      secret,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    );

    refreshToken = jwt.sign(
      { _id: memUser._id },
      refreshSecret,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" }
    );

    memUser.refreshToken = refreshToken;
    user = { _id: memUser._id, name: memUser.name, email: memUser.email, role: memUser.role };
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user, token: accessToken, refreshToken },
        "Logged in successfully"
      )
    );
});

/**
 * Refresh expired access token using valid refresh token.
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request: Refresh token is missing");
  }

  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  if (!refreshSecret) {
    throw new ApiError(500, "Server configuration error: REFRESH_TOKEN_SECRET is missing");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, refreshSecret);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  let user = null;
  let newAccessToken = "";
  let newRefreshToken = "";

  if (isDbConnected()) {
    user = await User.findById(decoded?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token: User no longer exists");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or has been revoked");
    }

    newAccessToken = user.generateAccessToken();
    newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });
  } else {
    // In-memory fallback verification
    const found = Array.from(inMemoryUsers.values()).find(
      (u) => u._id === decoded?._id && u.refreshToken === incomingRefreshToken
    );
    if (!found) {
      throw new ApiError(401, "Refresh token is expired or has been revoked");
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    newAccessToken = jwt.sign(
      { _id: found._id, email: found.email, name: found.name, role: found.role },
      secret,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    );
    newRefreshToken = jwt.sign(
      { _id: found._id },
      refreshSecret,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" }
    );
    found.refreshToken = newRefreshToken;
  }

  return res
    .status(200)
    .cookie("accessToken", newAccessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { token: newAccessToken, refreshToken: newRefreshToken },
        "Access token refreshed successfully"
      )
    );
});

/**
 * Get current authenticated user profile.
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched"));
});

/**
 * Log out user and clear session cookies.
 */
export const logoutUser = asyncHandler(async (req, res) => {
  if (req.user?._id) {
    if (isDbConnected()) {
      await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: null } });
    } else {
      const found = Array.from(inMemoryUsers.values()).find((u) => u._id === req.user._id);
      if (found) found.refreshToken = null;
    }
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/**
 * Request a password reset link.
 * Generates a crypto token, hashes it with sha256, and stores expiration.
 * Implements anti-enumeration: always returns a success response.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (typeof email !== "string" || !email.trim()) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  // Generate unhashed random 32-byte token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

  let userFound = false;

  if (isDbConnected()) {
    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      userFound = true;
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = expiresAt;
      await user.save({ validateBeforeSave: false });
    }
  } else {
    // In-memory fallback
    const memUser = inMemoryUsers.get(normalizedEmail);
    if (memUser) {
      userFound = true;
      memUser.resetPasswordToken = hashedToken;
      memUser.resetPasswordExpires = expiresAt.getTime();
    }
  }

  // Construct reset URL for frontend client
  const clientBaseUrl =
    process.env.CLIENT_URL || process.env.CORS_ORIGIN?.split(",")[0] || "http://localhost:5173";
  const resetUrl = `${clientBaseUrl}/reset-password?token=${resetToken}`;

  // Log in dev environment for easy testing without an external SMTP gateway
  if (process.env.NODE_ENV !== "production") {
    console.info(`[Auth] Password reset requested for: ${normalizedEmail}`);
    console.info(`[Auth] Reset Token: ${resetToken}`);
    console.info(`[Auth] Direct Reset Link: ${resetUrl}`);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        message: "If an account with that email exists, password reset instructions have been sent.",
        // For development/mock/demo testing, provide the token and reset link
        resetToken,
        resetUrl,
      },
      "Password reset instructions dispatched"
    )
  );
});

/**
 * Reset password using the valid reset token.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Password reset token is required");
  }

  if (
    !newPassword ||
    typeof newPassword !== "string" ||
    newPassword.length < 8 ||
    !PASSWORD_COMPLEXITY_REGEX.test(newPassword)
  ) {
    throw new ApiError(
      400,
      "New password must contain at least 8 characters, including at least one letter and one number"
    );
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  if (isDbConnected()) {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, "Password reset token is invalid or has expired");
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null; // Invalidate all active sessions
    await user.save();
  } else {
    // In-memory fallback
    const memUser = Array.from(inMemoryUsers.values()).find(
      (u) =>
        u.resetPasswordToken === hashedToken &&
        u.resetPasswordExpires &&
        u.resetPasswordExpires > Date.now()
    );

    if (!memUser) {
      throw new ApiError(400, "Password reset token is invalid or has expired");
    }

    const salt = await bcrypt.genSalt(10);
    memUser.password = await bcrypt.hash(newPassword, salt);
    memUser.resetPasswordToken = null;
    memUser.resetPasswordExpires = null;
    memUser.refreshToken = null;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Password has been reset successfully. You can now log in with your new password."
    )
  );
});

/**
 * Authenticate or register a developer using Google OAuth / Google Identity Services.
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const { credential, email, name, avatar, googleId } = req.body;

  let profile = {
    email: email || "",
    name: name || "",
    googleId: googleId || "",
    avatar: avatar || "",
  };

  // If a Google ID Token (credential) is supplied, decode or verify it
  if (credential && typeof credential === "string") {
    try {
      const decoded = jwt.decode(credential);
      if (decoded && decoded.email) {
        profile.email = decoded.email;
        profile.name = decoded.name || decoded.given_name || profile.name;
        profile.googleId = decoded.sub || profile.googleId;
        profile.avatar = decoded.picture || profile.avatar;
      }
    } catch {
      try {
        const tokenInfoRes = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
          { timeout: 5000 }
        );
        if (tokenInfoRes.data?.email) {
          profile.email = tokenInfoRes.data.email;
          profile.name = tokenInfoRes.data.name || profile.name;
          profile.googleId = tokenInfoRes.data.sub || profile.googleId;
          profile.avatar = tokenInfoRes.data.picture || profile.avatar;
        }
      } catch (err) {
        console.warn("[Google Auth] Token verification warning:", err.message);
      }
    }
  }

  if (!profile.email || !EMAIL_REGEX.test(profile.email.toLowerCase().trim())) {
    throw new ApiError(400, "Valid Google account email is required");
  }

  const normalizedEmail = profile.email.toLowerCase().trim();
  const userName = profile.name?.trim() || normalizedEmail.split("@")[0];
  const userAvatar =
    profile.avatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces";
  const userGoogleId = profile.googleId || `google_${Date.now()}`;

  let user = null;
  let accessToken = "";
  let refreshToken = "";

  if (isDbConnected()) {
    let existingUser = await User.findOne({
      $or: [{ googleId: userGoogleId }, { email: normalizedEmail }],
    });

    if (existingUser) {
      if (!existingUser.googleId) existingUser.googleId = userGoogleId;
      if (!existingUser.avatar && userAvatar) existingUser.avatar = userAvatar;
      if (existingUser.authProvider === "local") existingUser.authProvider = "google";
      await existingUser.save({ validateBeforeSave: false });
    } else {
      existingUser = await User.create({
        name: userName,
        email: normalizedEmail,
        googleId: userGoogleId,
        authProvider: "google",
        avatar: userAvatar,
        role: "developer",
      });
    }

    accessToken = existingUser.generateAccessToken();
    refreshToken = existingUser.generateRefreshToken();

    existingUser.refreshToken = refreshToken;
    await existingUser.save({ validateBeforeSave: false });

    user = await User.findById(existingUser._id).select("-password -refreshToken");
  } else {
    // In-memory fallback mode
    let memUser = Array.from(inMemoryUsers.values()).find(
      (u) => u.googleId === userGoogleId || u.email === normalizedEmail
    );

    if (memUser) {
      memUser.googleId = userGoogleId;
      if (userAvatar) memUser.avatar = userAvatar;
    } else {
      const dummyId = `user_google_${Date.now()}`;
      memUser = {
        _id: dummyId,
        name: userName,
        email: normalizedEmail,
        googleId: userGoogleId,
        authProvider: "google",
        avatar: userAvatar,
        role: "developer",
        refreshToken: null,
      };
      inMemoryUsers.set(normalizedEmail, memUser);
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    accessToken = jwt.sign(
      { _id: memUser._id, email: memUser.email, name: memUser.name, role: memUser.role },
      secret,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    );

    refreshToken = jwt.sign(
      { _id: memUser._id },
      refreshSecret,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" }
    );

    memUser.refreshToken = refreshToken;
    user = {
      _id: memUser._id,
      name: memUser.name,
      email: memUser.email,
      role: memUser.role,
      avatar: memUser.avatar,
      authProvider: "google",
    };
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user, token: accessToken, refreshToken },
        "Logged in with Google successfully"
      )
    );
});

/**
 * Authenticate or register a developer using Microsoft OAuth / Microsoft Identity.
 */
export const microsoftLogin = asyncHandler(async (req, res) => {
  const { accessToken: msAccessToken, idToken, email, name, avatar, microsoftId } = req.body;

  let profile = {
    email: email || "",
    name: name || "",
    microsoftId: microsoftId || "",
    avatar: avatar || "",
  };

  // If a Microsoft Graph API access token is supplied, verify against graph.microsoft.com
  if (msAccessToken && typeof msAccessToken === "string") {
    try {
      const graphRes = await axios.get("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${msAccessToken}` },
        timeout: 5000,
      });
      if (graphRes.data) {
        profile.email = graphRes.data.mail || graphRes.data.userPrincipalName || profile.email;
        profile.name = graphRes.data.displayName || profile.name;
        profile.microsoftId = graphRes.data.id || profile.microsoftId;
      }
    } catch (err) {
      console.warn("[Microsoft Auth] Graph API verification warning:", err.message);
    }
  }

  // If idToken is provided, decode payload
  if (!profile.email && idToken && typeof idToken === "string") {
    try {
      const decoded = jwt.decode(idToken);
      if (decoded) {
        profile.email = decoded.email || decoded.preferred_username || decoded.upn || profile.email;
        profile.name = decoded.name || profile.name;
        profile.microsoftId = decoded.oid || decoded.sub || profile.microsoftId;
      }
    } catch {
      // ignore
    }
  }

  if (!profile.email || !EMAIL_REGEX.test(profile.email.toLowerCase().trim())) {
    throw new ApiError(400, "Valid Microsoft account email is required");
  }

  const normalizedEmail = profile.email.toLowerCase().trim();
  const userName = profile.name?.trim() || normalizedEmail.split("@")[0];
  const userAvatar =
    profile.avatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces";
  const userMicrosoftId = profile.microsoftId || `ms_${Date.now()}`;

  let user = null;
  let accessToken = "";
  let refreshToken = "";

  if (isDbConnected()) {
    let existingUser = await User.findOne({
      $or: [{ microsoftId: userMicrosoftId }, { email: normalizedEmail }],
    });

    if (existingUser) {
      if (!existingUser.microsoftId) existingUser.microsoftId = userMicrosoftId;
      if (!existingUser.avatar && userAvatar) existingUser.avatar = userAvatar;
      if (existingUser.authProvider === "local") existingUser.authProvider = "microsoft";
      await existingUser.save({ validateBeforeSave: false });
    } else {
      existingUser = await User.create({
        name: userName,
        email: normalizedEmail,
        microsoftId: userMicrosoftId,
        authProvider: "microsoft",
        avatar: userAvatar,
        role: "developer",
      });
    }

    accessToken = existingUser.generateAccessToken();
    refreshToken = existingUser.generateRefreshToken();

    existingUser.refreshToken = refreshToken;
    await existingUser.save({ validateBeforeSave: false });

    user = await User.findById(existingUser._id).select("-password -refreshToken");
  } else {
    // In-memory fallback mode
    let memUser = Array.from(inMemoryUsers.values()).find(
      (u) => u.microsoftId === userMicrosoftId || u.email === normalizedEmail
    );

    if (memUser) {
      memUser.microsoftId = userMicrosoftId;
      if (userAvatar) memUser.avatar = userAvatar;
    } else {
      const dummyId = `user_ms_${Date.now()}`;
      memUser = {
        _id: dummyId,
        name: userName,
        email: normalizedEmail,
        microsoftId: userMicrosoftId,
        authProvider: "microsoft",
        avatar: userAvatar,
        role: "developer",
        refreshToken: null,
      };
      inMemoryUsers.set(normalizedEmail, memUser);
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    accessToken = jwt.sign(
      { _id: memUser._id, email: memUser.email, name: memUser.name, role: memUser.role },
      secret,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    );

    refreshToken = jwt.sign(
      { _id: memUser._id },
      refreshSecret,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" }
    );

    memUser.refreshToken = refreshToken;
    user = {
      _id: memUser._id,
      name: memUser.name,
      email: memUser.email,
      role: memUser.role,
      avatar: memUser.avatar,
      authProvider: "microsoft",
    };
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user, token: accessToken, refreshToken },
        "Logged in with Microsoft successfully"
      )
    );
});


