import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import errorHandler from "./src/middleware/ErrorHandler.middleware.js";

// Routes
import authRouter from "./src/routes/auth.routes.js";
import repositoryRouter from "./src/routes/repository.routes.js";
import pullRequestRouter from "./src/routes/pullRequest.routes.js";
import analysisRouter from "./src/routes/analysis.routes.js";
import memoryRouter from "./src/routes/memory.routes.js";

const app = express();

// Disable Express fingerprinting header
app.disable("x-powered-by");

// Trust first proxy hop when behind reverse proxy / load balancer
app.set("trust proxy", 1);

// 1. HTTP Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // APIs return JSON; prevents CSP conflict with frontend apps
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// 2. Strict Cross-Origin Resource Sharing (CORS)
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "https://repo-memory.vercel.app",
];
const envOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser requests or matched origins, including Vercel preview domains
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// 3. Rate Limiting Protection (Brute-force and DoS Mitigation)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests from this IP address, please retry after 15 minutes",
    error: { code: "RATE_LIMIT_EXCEEDED" },
  },
});
app.use("/api/v1/", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login/register attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many authentication attempts, please retry after 15 minutes",
    error: { code: "AUTH_RATE_LIMIT_EXCEEDED" },
  },
});
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);

// 4. Body parsing with safe size limits
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// 5. NoSQL Injection Sanitization (strips $ and . prefixes from req.body/params/query)
app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: "RepoMemory Impact Analysis Engine",
  });
});

// Mount modular API routes under /api/v1/
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/repositories", repositoryRouter);
app.use("/api/v1/pull-requests", pullRequestRouter);
app.use("/api/v1/analyses", analysisRouter);
app.use("/api/v1/memory", memoryRouter);

// Centralized error handler
app.use(errorHandler);

export { app };
export default app;

