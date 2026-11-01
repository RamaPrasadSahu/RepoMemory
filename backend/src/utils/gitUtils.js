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

/**
 * Universal GitHub URL and reference parser.
 * Supports:
 * - "owner/repo" (e.g. facebook/react)
 * - "owner/repo#123" (e.g. facebook/react#38088)
 * - "https://github.com/owner/repo"
 * - "https://github.com/owner/repo/pull/123"
 * - "git@github.com:owner/repo.git"
 */
export const parseGithubUrl = (input) => {
  if (typeof input !== "string" || !input.trim()) {
    return { isValid: false, owner: null, repo: null, fullName: null, prNumber: null };
  }

  const cleaned = input.trim();

  // Pattern 1: https://github.com/owner/repo/pull/123
  const prRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/pull\/(\d+)/i;
  const prMatch = cleaned.match(prRegex);
  if (prMatch) {
    const owner = prMatch[1];
    const repo = prMatch[2].replace(/\.git$/i, "");
    const prNumber = parseInt(prMatch[3], 10);
    return {
      isValid: true,
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      prNumber,
    };
  }

  // Pattern 2: https://github.com/owner/repo (with optional trailing slash or .git)
  const repoUrlRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git|\/)?$/i;
  const repoMatch = cleaned.match(repoUrlRegex);
  if (repoMatch) {
    const owner = repoMatch[1];
    const repo = repoMatch[2];
    return {
      isValid: true,
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      prNumber: null,
    };
  }

  // Pattern 3: owner/repo#123
  const refPrMatch = cleaned.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)#(\d+)$/);
  if (refPrMatch) {
    const owner = refPrMatch[1];
    const repo = refPrMatch[2];
    const prNumber = parseInt(refPrMatch[3], 10);
    return {
      isValid: true,
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      prNumber,
    };
  }

  // Pattern 4: owner/repo
  if (isValidRepoFullName(cleaned)) {
    const [owner, repo] = cleaned.split("/");
    return {
      isValid: true,
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      prNumber: null,
    };
  }

  return { isValid: false, owner: null, repo: null, fullName: null, prNumber: null };
};
