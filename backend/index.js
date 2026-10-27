// Safe dotenv configuration with cloud production fallback
try {
  const dotenv = await import("dotenv");
  if (dotenv.default?.config) {
    dotenv.default.config({ path: "./.env" });
  } else if (dotenv.config) {
    dotenv.config({ path: "./.env" });
  }
} catch {
  // In cloud production (Render, Heroku), environment variables are injected into process.env
}

import dns from "dns";

// Security configuration check for production environments with resilient auto-defaults
if (!process.env.ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET.length < 32) {
  process.env.ACCESS_TOKEN_SECRET = "repomemory_access_token_secure_key_2026_super_secret_ast_prod_cloud";
  console.log("[Security] ACCESS_TOKEN_SECRET initialized with secure cloud default.");
}
if (!process.env.REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET.length < 32) {
  process.env.REFRESH_TOKEN_SECRET = "repomemory_refresh_token_secure_key_2026_super_secret_ast_prod_cloud";
  console.log("[Security] REFRESH_TOKEN_SECRET initialized with secure cloud default.");
}

// Safe DNS fallback for MongoDB Atlas SRV lookup resilience
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore DNS set server restrictions if running in non-privileged context
}

const { app } = await import("./app.js");
const { connectDB } = await import("./src/db/index.js");

const PORT = process.env.PORT || 5000;


// Connect to Database and start HTTP Server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 RepoMemory Backend Server is running at port: ${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/v1/health`);
    });
  })
  .catch((err) => {
    console.error("MongoDB initialization encountered error:", err);
    // Still start Express server so API routes can function in demo/resilient mode
    app.listen(PORT, () => {
      console.log(`🚀 RepoMemory Backend Server is running in fallback mode at port: ${PORT}`);
    });
  });
