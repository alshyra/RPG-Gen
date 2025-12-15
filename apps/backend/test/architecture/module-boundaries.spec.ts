import test from "ava";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

/**
 * Architectural tests to enforce module boundaries
 * Prevents domain services from importing cross-domain dependencies
 */

const BACKEND_SRC = join(__dirname, "../../src");

// Define what each domain can import
const _ALLOWED_IMPORTS = {
  "domain/combat": [
    "@nestjs/",
    "mongoose",
    "../dice/",
    "./services/",
    "./dto/",
    "../../infra/mongo/combat/",
  ],
  "domain/character": [
    "@nestjs/",
    "mongoose",
    "./dto/",
    "./services/",
    "../../infra/mongo/character/",
  ],
  "domain/chat": ["@nestjs/", "mongoose", "@google/genai", "./dto/", "../../infra/mongo/chat/"],
};

function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "dist") {
      files.push(...getAllTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractImports(fileContent: string): string[] {
  const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(fileContent)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

test("domain/combat services should not import from other domains", t => {
  const combatServicesDir = join(BACKEND_SRC, "domain/combat");
  const files = getAllTsFiles(combatServicesDir);

  const violations: string[] = [];

  for (const file of files) {
    // Skip orchestrators and modules - they're allowed cross-domain imports
    if (file.includes("orchestrator") || file.includes("module")) continue;

    const content = readFileSync(file, "utf-8");
    const imports = extractImports(content);

    for (const imp of imports) {
      // Check if import is from another domain
      const isCrossDomain =
        imp.includes("../character/") ||
        imp.includes("../chat/") ||
        imp.includes("../spell-definition/") ||
        imp.includes("../classes/");

      if (isCrossDomain) {
        violations.push(`${file} imports ${imp}`);
      }
    }
  }

  if (violations.length > 0) {
    t.fail(`Found ${violations.length} cross-domain imports:\n${violations.join("\n")}`);
  } else {
    t.pass();
  }
});

test("domain/character services should not import from other domains", t => {
  const characterServicesDir = join(BACKEND_SRC, "domain/character");
  const files = getAllTsFiles(characterServicesDir);

  const violations: string[] = [];

  for (const file of files) {
    if (file.includes("module")) continue;

    const content = readFileSync(file, "utf-8");
    const imports = extractImports(content);

    for (const imp of imports) {
      const isCrossDomain =
        imp.includes("../combat/") ||
        imp.includes("../chat/") ||
        imp.includes("../spell-definition/");

      if (isCrossDomain) {
        violations.push(`${file} imports ${imp}`);
      }
    }
  }

  if (violations.length > 0) {
    t.fail(`Found ${violations.length} cross-domain imports:\n${violations.join("\n")}`);
  } else {
    t.pass();
  }
});

test("orchestrators can import from any domain", t => {
  // Orchestrators are ALLOWED to coordinate across domains
  // This test just verifies they exist and are properly separated
  const orchestratorsDir = join(BACKEND_SRC, "orchestrators");
  const files = getAllTsFiles(orchestratorsDir);

  t.true(files.length > 0, "Should have orchestrator files");
  t.pass("Orchestrators are allowed cross-domain imports");
});

test("DTOs should not have business logic imports", t => {
  const domains = ["combat", "character", "chat"];
  const violations: string[] = [];

  for (const domain of domains) {
    const dtoDir = join(BACKEND_SRC, "domain", domain, "dto");
    try {
      const files = getAllTsFiles(dtoDir);

      for (const file of files) {
        const content = readFileSync(file, "utf-8");
        const imports = extractImports(content);

        for (const imp of imports) {
          // DTOs should only import from class-validator, swagger, other DTOs
          const isServiceImport =
            imp.includes("../services/") ||
            imp.includes(".service") ||
            imp.includes("orchestrator");

          if (isServiceImport) {
            violations.push(`${file} imports service: ${imp}`);
          }
        }
      }
    } catch {
      // Directory might not exist, skip
    }
  }

  if (violations.length > 0) {
    t.fail(`Found ${violations.length} service imports in DTOs:\n${violations.join("\n")}`);
  } else {
    t.pass();
  }
});
