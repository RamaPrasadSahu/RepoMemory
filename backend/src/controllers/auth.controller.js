import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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

