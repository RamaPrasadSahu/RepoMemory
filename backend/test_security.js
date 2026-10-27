import axios from "axios";

async function testSecurity() {
  const client = axios.create({ 
    baseURL: "http://localhost:5000/api/v1", 
    validateStatus: () => true 
  });

  console.log("=== 1. Testing Role Escalation Defense ===");
  const res = await client.post("/auth/register", {
    name: "Attacker",
    email: `attacker_${Date.now()}@security.test`,
    password: "Password123!",
    role: "admin",
  });
  console.log("   Attempted Role: admin | Assigned Role:", res.data?.data?.user?.role);
  if (res.data?.data?.user?.role !== "developer") {
    throw new Error("Privilege escalation succeeded! Attacker became admin.");
  }
  console.log("   PASSED: Role escalation prevented! Defaulted securely to 'developer'.");

  console.log("\n=== 2. Testing Refresh Token Rotation ===");
  const refreshToken = res.data?.data?.refreshToken;
  const refreshRes = await client.post("/auth/refresh-token", { refreshToken });
  console.log("   Refresh status:", refreshRes.status, "| New Access Token:", !!refreshRes.data?.data?.token);
  if (refreshRes.status !== 200 || !refreshRes.data?.data?.token) {
    throw new Error("Refresh token rotation failed");
  }
  console.log("   PASSED: Refresh token verified and rotated successfully.");

  console.log("\n=== 3. Testing NoSQL Query Operator Injection ===");
  const nosqlRes = await client.post("/auth/login", {
    email: { "$ne": null },
    password: { "$ne": null },
  });
  console.log("   NoSQL Injection login attempt status:", nosqlRes.status, "(Expected: 400 Bad Request)");
  if (nosqlRes.status !== 400) {
    throw new Error("NoSQL operator injection was not rejected with 400");
  }
  console.log("   PASSED: Object-based NoSQL injection cleanly blocked.");

  console.log("\n=== 4. Testing X-Demo-User Backdoor Removal ===");
  const backdoorRes = await client.post(
    "/repositories/repo_101/qa",
    { question: "Where is auth?" },
    { headers: { "X-Demo-User": "1" } }
  );
  console.log("   Request with X-Demo-User header status:", backdoorRes.status, "(Expected: 401 Unauthorized)");
  if (backdoorRes.status !== 401) {
    throw new Error("Backdoor still functional! Expected 401 Unauthorized.");
  }
  console.log("   PASSED: Backdoor header completely neutralized.");

  console.log("\n=== 5. Testing Protected Read Endpoints (Information Disclosure Defense) ===");
  const unauthRepos = await client.get("/repositories");
  const unauthAnalyses = await client.get("/analyses/analysis_101");
  const unauthMemory = await client.get("/repositories/repo_101/memory");
  console.log("   Unauthenticated GET /repositories status:", unauthRepos.status, "(Expected: 401)");
  console.log("   Unauthenticated GET /analyses/analysis_101 status:", unauthAnalyses.status, "(Expected: 401)");
  console.log("   Unauthenticated GET /memory status:", unauthMemory.status, "(Expected: 401)");
  if (unauthRepos.status !== 401 || unauthAnalyses.status !== 401 || unauthMemory.status !== 401) {
    throw new Error("Information disclosure: Unauthenticated read endpoints did not return 401");
  }
  console.log("   PASSED: All proprietary AST analyses and repository records are strictly protected.");

  console.log("\n=== 6. Testing BOLA Object-Level Authorization Defense ===");
  const authHeaders = { headers: { Authorization: `Bearer ${refreshRes.data?.data?.token}` } };
  const bolaRepoRes = await client.delete("/repositories/repo_101", authHeaders);
  console.log("   Non-owner attempt to delete system repo status:", bolaRepoRes.status, "(Expected: 403 Forbidden)");
  if (bolaRepoRes.status !== 403) {
    throw new Error(`BOLA vulnerability: Non-owner developer was not rejected with 403 (got ${bolaRepoRes.status})`);
  }
  console.log("   PASSED: BOLA object-level authorization strictly blocks cross-user deletions.");

  console.log("\n ALL ADVANCED SECURITY VERIFICATIONS PASSED WITH 100% SUCCESS! ");
}

testSecurity().catch(err => {
  console.error("Security Test Failure:", err.message);
  process.exit(1);
});
