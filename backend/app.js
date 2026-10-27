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

// Root endpoint - API directory & Web Status
app.get("/", (req, res) => {
  if (req.accepts("html")) {
    return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RepoMemory Impact API Engine</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #030712;
      color: #f3f4f6;
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: rgba(17, 24, 39, 0.85);
      border: 1px solid rgba(79, 70, 229, 0.3);
      backdrop-filter: blur(16px);
      border-radius: 1.25rem;
      padding: 2.5rem;
      max-width: 32rem;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.15);
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      margin-bottom: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .dot {
      width: 0.5rem;
      height: 0.5rem;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin-bottom: 0.75rem;
      background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #9ca3af;
      font-size: 0.925rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 0.75rem;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.6);
    }
    .btn-secondary {
      background: rgba(31, 41, 55, 0.7);
      border: 1px solid rgba(75, 85, 99, 0.4);
      color: #e5e7eb;
    }
    .btn-secondary:hover {
      background: rgba(55, 65, 81, 0.8);
    }
    .footer {
      margin-top: 2rem;
      font-size: 0.75rem;
      color: #6b7280;
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="dot"></span>
      Backend Engine Live & Operational
    </div>
    <h1>RepoMemory Impact API</h1>
    <p>The AST change-impact analysis engine and architectural memory platform is running actively.</p>
    <div class="btn-group">
      <a href="https://repo-memory.vercel.app" class="btn btn-primary">
        Open Frontend Application ➔
      </a>
      <a href="/api/v1/health" class="btn btn-secondary">
        Inspect System Health (/api/v1/health)
      </a>
    </div>
    <div class="footer">
      Node.js ES Modules • Express • MongoDB Atlas
    </div>
  </div>
</body>
</html>`);
  }

  res.status(200).json({
    service: "RepoMemory Impact Analysis Engine",
    status: "online",
    version: "1.0.0",
    frontend: "https://repo-memory.vercel.app",
    healthCheck: "/api/v1/health",
    apiPrefix: "/api/v1",
  });
});

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

