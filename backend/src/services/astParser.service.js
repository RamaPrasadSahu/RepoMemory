import * as babelParser from "@babel/parser";
import _traverse from "@babel/traverse";

// Handle ESM/CJS interop for @babel/traverse
const traverse = _traverse.default || _traverse;

/**
 * Service to parse JS/TS source code and extract imports, exports, functions, and routes.
 */
export const astParserService = {
  /**
   * Parse code string into Babel AST.
   */
  parseToAST(codeString, filename = "file.js") {
    // Defense-in-depth: limit input size to 500KB to prevent AST parser ReDoS and call stack explosion
    if (typeof codeString !== "string" || codeString.length > 500000) {
      console.warn(`[AST Parser] Input for ${filename} exceeds safe parsing threshold (500KB) or is invalid`);
      return null;
    }

    try {
      const isTypeScript = filename.endsWith(".ts") || filename.endsWith(".tsx");
      const isJSX = filename.endsWith(".jsx") || filename.endsWith(".tsx");

      const plugins = [
        "asyncGenerators",
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "dynamicImport",
        "exportDefaultFrom",
        "exportNamespaceFrom",
        "objectRestSpread",
        "optionalCatchBinding",
        "optionalChaining",
        "nullishCoalescingOperator",
      ];

      if (isJSX) plugins.push("jsx");
      if (isTypeScript) plugins.push("typescript");

      return babelParser.parse(codeString, {
        sourceType: "module",
        plugins,
        errorRecovery: true,
      });
    } catch (err) {
      console.warn(`[AST Parser] Failed to parse ${filename}: ${err.message}`);
      return null;
    }
  },

  /**
   * Extract comprehensive module metadata from code.
   */
  extractModuleInfo(codeString, filePath = "file.js") {
    const ast = this.parseToAST(codeString, filePath);
    if (!ast) {
      return {
        path: filePath,
        imports: [],
        exports: [],
        functions: [],
        calls: [],
        routes: [],
        isModel: false,
        lineCount: codeString.split("\n").length,
      };
    }

    const imports = [];
    const exports = [];
    const functions = [];
    const calls = [];
    const routes = [];
    let isModel = false;

    try {
      traverse(ast, {
        // Extract Imports
        ImportDeclaration(pathNode) {
          const source = pathNode.node.source.value;
          const specifiers = pathNode.node.specifiers.map((s) => s.local.name);
          imports.push({
            source,
            specifiers,
            line: pathNode.node.loc?.start.line || 1,
          });
        },

        // Extract CommonJS require
        CallExpression(pathNode) {
          const callee = pathNode.node.callee;
          if (callee.type === "Identifier" && callee.name === "require") {
            const arg = pathNode.node.arguments[0];
            if (arg && arg.type === "StringLiteral") {
              imports.push({
                source: arg.value,
                specifiers: ["*"],
                line: pathNode.node.loc?.start.line || 1,
              });
            }
          }

          // Check for Express route patterns: router.get(), app.post(), etc.
          if (
            callee.type === "MemberExpression" &&
            callee.property &&
            callee.property.type === "Identifier"
          ) {
            const methodName = callee.property.name;
            if (["get", "post", "put", "delete", "patch", "use"].includes(methodName)) {
              const firstArg = pathNode.node.arguments[0];
              if (firstArg && firstArg.type === "StringLiteral") {
                routes.push({
                  method: methodName.toUpperCase(),
                  path: firstArg.value,
                  line: pathNode.node.loc?.start.line || 1,
                });
              }
            }
          }

          // Track generic function invocations
          if (callee.type === "Identifier") {
            calls.push({
              name: callee.name,
              line: pathNode.node.loc?.start.line || 1,
            });
          }
        },

        // Extract Function Declarations
        FunctionDeclaration(pathNode) {
          if (pathNode.node.id) {
            functions.push({
              name: pathNode.node.id.name,
              params: pathNode.node.params.map((p) => p.name || "param"),
              startLine: pathNode.node.loc?.start.line || 1,
              endLine: pathNode.node.loc?.end.line || 1,
            });
          }
        },

        // Extract Named Exports
        ExportNamedDeclaration(pathNode) {
          if (pathNode.node.declaration) {
            const decl = pathNode.node.declaration;
            if (decl.type === "FunctionDeclaration" && decl.id) {
              exports.push(decl.id.name);
            } else if (decl.type === "VariableDeclaration") {
              decl.declarations.forEach((d) => {
                if (d.id && d.id.type === "Identifier") {
                  exports.push(d.id.name);
                }
              });
            }
          }
        },

        // Extract Default Exports
        ExportDefaultDeclaration(pathNode) {
          const decl = pathNode.node.declaration;
          if (decl.type === "Identifier") {
            exports.push(`default (${decl.name})`);
          } else {
            exports.push("default");
          }
        },

        // Detect Mongoose Schema
        NewExpression(pathNode) {
          const callee = pathNode.node.callee;
          if (
            callee.type === "MemberExpression" &&
            callee.property &&
            callee.property.name === "Schema"
          ) {
            isModel = true;
          }
        },
      });
    } catch (traverseErr) {
      console.warn(`[AST Traverse] Partial error in ${filePath}: ${traverseErr.message}`);
    }

    return {
      path: filePath,
      imports,
      exports,
      functions,
      calls,
      routes,
      isModel,
      lineCount: codeString.split("\n").length,
    };
  },
};

export default astParserService;
