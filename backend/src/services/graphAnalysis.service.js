/**
 * Graph Analysis & Impact Propagation Engine using BFS.
 */

export const graphAnalysisService = {
  /**
   * Build directed graph from modules and their imports.
   */
  buildGraph(modules) {
    const nodes = [];
    const edges = [];
    const moduleMap = new Map();

    // Register all nodes
    modules.forEach((mod) => {
      const type = this.detectNodeType(mod.path, mod);
      const node = {
        id: mod.path,
        label: mod.path.split("/").pop(),
        path: mod.path,
        type,
        status: mod.status || "unaffected",
        metadata: {
          language: mod.path.endsWith(".ts") || mod.path.endsWith(".tsx") ? "typescript" : "javascript",
          additions: mod.additions || 0,
          deletions: mod.deletions || 0,
          functions: mod.functions?.map((f) => f.name) || [],
          exports: mod.exports || [],
        },
      };
      nodes.push(node);
      moduleMap.set(mod.path, mod);
    });

    // Build edges (Source imports Target, or Caller calls Callee)
    let edgeIndex = 1;
    modules.forEach((mod) => {
      (mod.imports || []).forEach((imp) => {
        // Find matching module path
        const targetPath = this.resolveImportTarget(mod.path, imp.source, Array.from(moduleMap.keys()));
        if (targetPath) {
          edges.push({
            id: `edge_${edgeIndex++}`,
            source: mod.path,
            target: targetPath,
            type: "imports",
            label: imp.specifiers?.[0] || "imports",
          });
        }
      });
    });

    return { nodes, edges };
  },

  /**
   * Run BFS to propagate downstream impact from changed files.
   */
  computeImpact(graph, changedFilePaths) {
    const { nodes, edges } = graph;
    const changedSet = new Set(changedFilePaths);

    // Build adjacency list for reverse dependency lookup: who imports/calls node?
    // Edge (A -> B means A imports B). If B changes, A is affected!
    const callersMap = new Map();
    edges.forEach((e) => {
      if (!callersMap.has(e.target)) {
        callersMap.set(e.target, []);
      }
      callersMap.get(e.target).push({ caller: e.source, edge: e });
    });

    const affectedFiles = [];
    const visited = new Set(changedSet);
    const queue = [];

    // Initialize BFS with changed files (distance 0)
    changedFilePaths.forEach((path) => {
      queue.push({ path, distance: 0 });
    });

    while (queue.length > 0) {
      const { path, distance } = queue.shift();
      const callers = callersMap.get(path) || [];

      callers.forEach(({ caller }) => {
        if (!visited.has(caller)) {
          visited.add(caller);
          const isDirect = distance === 0;
          const isTest = caller.includes(".test.") || caller.includes(".spec.") || caller.includes("/tests/");

          affectedFiles.push({
            path: caller,
            type: this.detectNodeType(caller),
            status: "affected",
            classification: isTest ? "test_coverage" : isDirect ? "direct" : "transitive",
            reason: isDirect
              ? `Direct consumer importing modified exports from ${path.split("/").pop()}.`
              : `Transitive ripple: dependent on upstream affected module ${path.split("/").pop()}.`,
            confidence: isDirect ? 0.96 : 0.88,
            distance: distance + 1,
          });

          // Enqueue for next transitive layer
          queue.push({ path: caller, distance: distance + 1 });
        }
      });
    }

    // Update node statuses in graph
    const updatedNodes = nodes.map((node) => {
      if (changedSet.has(node.path || node.id)) {
        return { ...node, status: "changed" };
      }
      const isAffected = affectedFiles.some((af) => af.path === (node.path || node.id));
      if (isAffected) {
        return { ...node, status: "affected" };
      }
      return { ...node, status: "unaffected" };
    });

    // Generate test recommendations
    const testRecommendations = this.generateTestRecommendations(changedFilePaths, affectedFiles, nodes);

    // Calculate risk level
    const riskLevel = this.calculateRisk(changedFilePaths, affectedFiles, testRecommendations);

    return {
      riskLevel,
      confidenceScore: 0.94,
      changedFilesCount: changedFilePaths.length,
      affectedFilesCount: affectedFiles.length,
      testRecommendationsCount: testRecommendations.length,
      affectedFiles,
      testRecommendations,
      graph: {
        nodes: updatedNodes,
        edges,
      },
    };
  },

  /**
   * Helper to detect node type from file path.
   */
  detectNodeType(filePath = "", mod = null) {
    const lower = filePath.toLowerCase();
    if (lower.includes(".test.") || lower.includes(".spec.") || lower.includes("/tests/")) return "test";
    if (lower.includes("controller")) return "controller";
    if (lower.includes("route")) return "route";
    if (lower.includes("middleware")) return "middleware";
    if (lower.includes("model") || (mod && mod.isModel)) return "model";
    if (lower.includes("service")) return "service";
    if (lower.includes("util") || lower.includes("helper")) return "module";
    return "file";
  },

  /**
   * Resolve an import source string to one of the repository file paths.
   */
  resolveImportTarget(currentPath, importSource, allPaths) {
    if (!importSource.startsWith(".")) return null; // External package

    const currentDir = currentPath.split("/").slice(0, -1).join("/");
    const cleanSource = importSource.replace(/^\.\//, "");

    for (const p of allPaths) {
      if (p.includes(cleanSource) && p !== currentPath) {
        return p;
      }
    }
    return null;
  },

  /**
   * Generate prioritized test suites from affected files.
   */
  generateTestRecommendations(changedFiles, affectedFiles, allNodes) {
    const tests = [];
    const allPaths = [...changedFiles, ...affectedFiles.map((a) => a.path)];

    allPaths.forEach((p) => {
      const baseName = p.split("/").pop().replace(/\.(js|ts|jsx|tsx)$/, "");
      // Look for corresponding test file
      const matchingTest = allNodes.find(
        (n) => n.path && n.path.includes(baseName) && (n.path.includes(".test.") || n.path.includes(".spec."))
      );

      if (matchingTest && !tests.some((t) => t.testFile === matchingTest.path)) {
        tests.push({
          id: `test_${tests.length + 1}`,
          name: matchingTest.label || matchingTest.path.split("/").pop(),
          testFile: matchingTest.path,
          priority: "high",
          command: `npm test -- ${matchingTest.path}`,
          targetType: "unit",
          estimatedDuration: "1.2s",
          reason: `Direct unit test suite covering modified module ${baseName}.`,
        });
      }
    });

    if (tests.length === 0) {
      tests.push({
        id: "test_fallback",
        name: "Repository Smoke Test Suite",
        testFile: "tests/integration/api.test.js",
        priority: "medium",
        command: "npm test -- tests/integration/api.test.js",
        targetType: "integration",
        estimatedDuration: "3.5s",
        reason: "Regression safety check across core API endpoints.",
      });
    }

    return tests;
  },

  /**
   * Calculate risk level based on blast radius and critical components.
   */
  calculateRisk(changedFiles, affectedFiles, tests) {
    const totalAffected = affectedFiles.length;
    const touchesCritical = changedFiles.some(
      (f) =>
        f.toLowerCase().includes("auth") ||
        f.toLowerCase().includes("payment") ||
        f.toLowerCase().includes("gateway")
    );

    if (totalAffected >= 6 || touchesCritical) {
      return "high";
    }
    if (totalAffected >= 2) {
      return "medium";
    }
    return "low";
  },
};

export default graphAnalysisService;
