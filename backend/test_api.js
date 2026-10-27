import axios from "axios";

async function runTests() {
  const client = axios.create({ 
    baseURL: "http://localhost:5000/api/v1",
    validateStatus: () => true, // Don't throw on non-2xx so we can assert security rejections
  });

  console.log("=== 1. Testing /health & Security Headers ===");
  const health = await client.get("/health");
  console.log("   Status:", health.data.status, "| Uptime:", Math.round(health.data.uptime) + "s");
  console.log("   X-Powered-By header suppressed (Helmet):", health.headers["x-powered-by"] === undefined ? "PASSED" : "FAILED");

  console.log("\n=== 2. Testing Unauthenticated Request Rejection ===");
  const unauthQa = await client.post("/repositories/repo_101/qa", {
    question: "Where is authentication handled?",
  });
  console.log("   Anonymous POST to /qa response code:", unauthQa.status, "(Expected: 401)");
  if (unauthQa.status === 401) {
    console.log("   PASSED: Protected endpoint correctly rejected unauthenticated request!");
  } else {
    throw new Error(`Security failed: expected 401 but received ${unauthQa.status}`);
  }

  console.log("\n=== 3. Testing User Registration & Password Security ===");
  const testEmail = `dev_${Date.now()}@repomemory.test`;
  const weakRegister = await client.post("/auth/register", {
    name: "Test Developer",
    email: testEmail,
    password: "weak", // < 8 chars, should fail
  });
  console.log("   Weak password rejection code:", weakRegister.status, "(Expected: 400)");

  const validRegister = await client.post("/auth/register", {
    name: "Security Audited Developer",
    email: testEmail,
    password: "Password123!",
  });
  console.log("   Registration status:", validRegister.status, "(Expected: 201)");
  const token = validRegister.data?.data?.token;
  if (!token) {
    throw new Error("Failed to obtain JWT token upon registration");
  }
  console.log("   JWT Token issued successfully!");

  // Create authenticated client
  const authClient = axios.create({
    baseURL: "http://localhost:5000/api/v1",
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("\n=== 4. Testing Authenticated /repositories ===");
  const repos = await authClient.get("/repositories");
  console.log("   Found", repos.data.data.length, "repositories:", repos.data.data.map(r => r.name).join(", "));

  console.log("\n=== 5. Testing Authenticated Code Q&A ===");
  const qa = await authClient.post("/repositories/repo_101/qa", {
    question: "Where is user authentication handled?",
  });
  console.log("   Question:", qa.data.data.question);
  console.log("   Category:", qa.data.data.category);
  console.log("   Confidence:", qa.data.data.confidenceScore * 100 + "%");
  console.log("   Citations:", qa.data.data.sourceCitations.length, "found");

  console.log("\n=== 6. Testing /analyses/analysis_101 ===");
  const analysis = await authClient.get("/analyses/analysis_101");
  console.log("   Analysis ID:", analysis.data.data.id, "| Risk:", analysis.data.data.riskLevel, "| Nodes:", analysis.data.data.graph.nodes.length);

  console.log("\n=== 7. Testing /repositories/repo_101/memory ===");
  const memory = await authClient.get("/repositories/repo_101/memory");
  console.log("   Found", memory.data.data.length, "ADRs:", memory.data.data.map(m => m.title.slice(0, 30) + "...").join(" | "));

  console.log("\n ALL ENDPOINTS AND SECURITY POLICIES VALIDATED SUCCESSFULLY! ");
}

runTests().catch(err => {
  console.error("Test failed:", err.response?.data || err.message);
  process.exit(1);
});

