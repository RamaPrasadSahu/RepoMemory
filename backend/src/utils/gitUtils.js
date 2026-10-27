import path from "path";

/**
 * Strict validator for GitHub repository full name (e.g. "owner/repo").
 * Allows only alphanumeric characters, dots, hyphens, and underscores.
 */
export const isValidRepoFullName = (fullName) => {
  if (typeof fullName !== "string") return false;
  const regex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
  return regex.test(fullName.trim());
};

/**
 * Strict validator for Git branch names.
 * Disallows control characters, spaces, shell metacharacters, and path traversal tokens.
 */
export const isValidBranchName = (branch) => {
  if (typeof branch !== "string") return false;
  const trimmed = branch.trim();
  if (trimmed.length === 0 || trimmed.length > 255) return false;
  // Disallow shell characters like `;`, `&`, `|`, `$`, `` ` ``, `<`, `>`, `\n`, `..`
  const regex = /^[a-zA-Z0-9/_.-]+$/;
  return regex.test(trimmed) && !trimmed.includes("..");
};

/**
 * Safely resolve a subpath within a base directory, preventing directory traversal.
 */
export const safeResolvePath = (baseDir, relativePath) => {
  const normalized = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, "");
  const resolved = path.resolve(baseDir, normalized);
  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new Error("Path traversal attempt detected");
  }
  return resolved;
};
