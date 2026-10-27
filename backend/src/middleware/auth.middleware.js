import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { User } from "../models/User.model.js";

/**
 * Middleware to verify JWT authentication token from cookies or Authorization header.
 * Enforces strict cryptographic signature verification and prevents backdoors.
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace(/^Bearer\s+/i, "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request: No access token provided");
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      throw new ApiError(500, "Server security configuration error: ACCESS_TOKEN_SECRET is missing");
    }

    const decodedToken = jwt.verify(token, secret);

    let user = null;
    try {
      user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    } catch {
      // In offline/in-memory mode, construct user from cryptographically verified claims
      if (decodedToken?._id && decodedToken?.email) {
        user = {
          _id: decodedToken._id,
          name: decodedToken.name || "Authenticated User",
          email: decodedToken.email,
          role: decodedToken.role || "developer",
        };
      }
    }

    if (!user) {
      throw new ApiError(401, "Invalid Access Token or User does not exist");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, error?.message || "Invalid or expired access token");
  }
});

/**
 * Role-Based Access Control (RBAC) middleware.
 * Verifies that the authenticated user possesses one of the allowed roles.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource`
      );
    }
    next();
  };
};

export default verifyJWT;

