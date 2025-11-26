/**
 * Script to generate TypeScript types from OpenAPI spec
 *
 * This script fetches the OpenAPI spec from the running backend server
 * and generates TypeScript types using openapi-typescript.
 *
 * Usage:
 *   npm run generate:openapi
 *
 * Prerequisites:
 *   - Backend server must be running at http://localhost:3001
 *   - Alternatively, set OPENAPI_URL environment variable
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import openapiTS, { astToString } from 'openapi-typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OPENAPI_URL = process.env.OPENAPI_URL || 'http://localhost:3001/docs-json';

const generateOpenApiTypes = async () => {
  console.log(`🚀 Fetching OpenAPI spec from ${OPENAPI_URL}...`);

  try {
    const response = await fetch(OPENAPI_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const document = await response.json();

    // Define output paths
    const repoRoot = join(__dirname, '../../../..');
    const sharedDir = join(repoRoot, 'packages', 'shared', 'src');
    const specPath = join(sharedDir, 'openapi.json');
    const typesPath = join(sharedDir, 'api-types.ts');

    // Ensure directories exist
    if (!existsSync(sharedDir)) {
      mkdirSync(sharedDir, { recursive: true });
    }

    // Write the OpenAPI spec
    writeFileSync(specPath, JSON.stringify(document, null, 2), 'utf8');
    console.log(`📄 OpenAPI spec written to ${specPath}`);

    // Generate TypeScript types
    console.log('🔧 Generating TypeScript types from OpenAPI spec...');
    const ast = await openapiTS(document);
    const contents = astToString(ast);

    // Add header and write types
    const header = '// GENERATED FROM OpenAPI spec - do not edit manually\n\n';
    writeFileSync(typesPath, header + contents, 'utf8');
    console.log(`✅ TypeScript types written to ${typesPath}`);

    console.log('🎉 Done!');
  } catch (error) {
    const isConnectionError = error
      && typeof error === 'object'
      && 'code' in error
      && error.code === 'ECONNREFUSED';
    if (isConnectionError) {
      console.error('❌ Error: Could not connect to the backend server.');
      console.error('   Make sure the backend is running at:', OPENAPI_URL.replace('/docs-json', ''));
      console.error('   You can start it with: npm run start:backend');
    } else {
      console.error('❌ Error generating OpenAPI types:', error);
    }
    process.exit(1);
  }
};

generateOpenApiTypes();
