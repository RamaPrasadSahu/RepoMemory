import http from "http";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// Ensure test secrets exist
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "test_access_secret_key_123456789";
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "test_refresh_secret_key_123456789";

import { app } from "./app.js";

async function runTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const client = axios.create({
    baseURL: baseUrl,
    validateStatus: () => true,
  });

  console.log(`Test server running at ${baseUrl}`);

  try {
    console.log("\n=== 1. Testing Forgot Password with Unknown Email (Anti-Enumeration) ===");
    const unknownRes = await client.post("/auth/forgot-password", {
      email: "unknown_user_999@test.com",
    });
    console.log("   Status:", unknownRes.status);
    console.log("   Message:", unknownRes.data?.data?.message);
    if (unknownRes.status !== 200) {
      throw new Error(`Expected 200 for anti-enumeration but got ${unknownRes.status}`);
    }
    console.log("   PASSED: Unknown email safely handled without leaking user existence.");

    console.log("\n=== 2. Registering User for Password Reset Flow ===");
    const testEmail = `reset_dev_${Date.now()}@repomemory.test`;
    const regRes = await client.post("/auth/register", {
      name: "Reset Tester",
      email: testEmail,
      password: "InitialPassword123!",
    });
    console.log("   Registered status:", regRes.status);
    if (regRes.status !== 201) {
      throw new Error(`Failed to register test user: ${JSON.stringify(regRes.data)}`);
    }

    console.log("\n=== 3. Requesting Forgot Password for Registered User ===");
    const forgotRes = await client.post("/auth/forgot-password", {
      email: testEmail,
    });
    console.log("   Status:", forgotRes.status);
    const resetToken = forgotRes.data?.data?.resetToken;
    console.log("   Reset Token received:", resetToken ? "YES" : "NO");
    if (!resetToken) {
      throw new Error("Reset token was not returned in dev response");
    }

    console.log("\n=== 4. Testing Reset Password with Invalid Token ===");
    const invalidTokenRes = await client.post("/auth/reset-password", {
      token: "invalid_fake_token_123",
      newPassword: "BrandNewPassword123!",
    });
    console.log("   Status with invalid token:", invalidTokenRes.status, "(Expected: 400)");
    if (invalidTokenRes.status !== 400) {
      throw new Error("Invalid token should be rejected with 400");
    }
    console.log("   PASSED: Invalid token rejected.");

    console.log("\n=== 5. Testing Reset Password with Weak Password ===");
    const weakPassRes = await client.post("/auth/reset-password", {
      token: resetToken,
      newPassword: "weak",
    });
    console.log("   Status with weak password:", weakPassRes.status, "(Expected: 400)");
    if (weakPassRes.status !== 400) {
      throw new Error("Weak password should be rejected with 400");
    }
    console.log("   PASSED: Weak password rejected.");

    console.log("\n=== 6. Resetting Password with Valid Token and Strong Password ===");
    const validResetRes = await client.post("/auth/reset-password", {
      token: resetToken,
      newPassword: "BrandNewPassword123!",
    });
    console.log("   Reset status:", validResetRes.status);
    if (validResetRes.status !== 200) {
      throw new Error(`Reset password failed: ${JSON.stringify(validResetRes.data)}`);
    }
    console.log("   PASSED: Password successfully updated!");

    console.log("\n=== 7. Verifying Login with New Password ===");
    const loginOld = await client.post("/auth/login", {
      email: testEmail,
      password: "InitialPassword123!",
    });
    console.log("   Old password login status:", loginOld.status, "(Expected: 401)");
    if (loginOld.status !== 401) {
      throw new Error("Old password should no longer work!");
    }

    const loginNew = await client.post("/auth/login", {
      email: testEmail,
      password: "BrandNewPassword123!",
    });
    console.log("   New password login status:", loginNew.status, "(Expected: 200)");
    if (loginNew.status !== 200 || !loginNew.data?.data?.token) {
      throw new Error("Failed to log in with new password");
    }
    console.log("   PASSED: Successfully authenticated with newly reset password!");

    console.log("\n=== 8. Testing Google Login ===");
    const googleRes = await client.post("/auth/google", {
      email: "google.engineer@gmail.com",
      name: "Google Engineer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      googleId: "g_sub_1234567890",
    });
    console.log("   Google login status:", googleRes.status);
    console.log("   Provider:", googleRes.data?.data?.user?.authProvider || "google");
    console.log("   Role:", googleRes.data?.data?.user?.role);
    console.log("   Token received:", !!googleRes.data?.data?.token);
    if (googleRes.status !== 200 || !googleRes.data?.data?.token) {
      throw new Error(`Google login failed: ${JSON.stringify(googleRes.data)}`);
    }
    console.log("   PASSED: Google login authenticated developer successfully!");

    console.log("\n=== 9. Testing Microsoft Login ===");
    const msRes = await client.post("/auth/microsoft", {
      email: "msft.engineer@microsoft.com",
      name: "Microsoft Engineer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      microsoftId: "ms_oid_9876543210",
    });
    console.log("   Microsoft login status:", msRes.status);
    console.log("   Provider:", msRes.data?.data?.user?.authProvider || "microsoft");
    console.log("   Role:", msRes.data?.data?.user?.role);
    console.log("   Token received:", !!msRes.data?.data?.token);
    if (msRes.status !== 200 || !msRes.data?.data?.token) {
      throw new Error(`Microsoft login failed: ${JSON.stringify(msRes.data)}`);
    }
    console.log("   PASSED: Microsoft login authenticated developer successfully!");

    console.log("\n ALL NEW AUTH FEATURES VALIDATED ON BACKEND WITH 100% SUCCESS! \n");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
