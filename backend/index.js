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

// Strict security configuration check for production environments
if (process.env.NODE_ENV === "production") {
  if (!process.env.ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET.length < 32) {
    console.error("FATAL SECURITY ERROR: ACCESS_TOKEN_SECRET must be set and at least 32 characters long in production.");
    process.exit(1);
  }
  if (!process.env.REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET.length < 32) {
    console.error("FATAL SECURITY ERROR: REFRESH_TOKEN_SECRET must be set and at least 32 characters long in production.");
    process.exit(1);
  }
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
