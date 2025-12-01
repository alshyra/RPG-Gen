import {
  existsSync, mkdirSync, writeFileSync, readFileSync, renameSync,
} from 'fs';
import openapiTS, { astToString } from 'openapi-typescript';
import {
  dirname, join,
} from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OPENAPI_URL = process.env.OPENAPI_URL || 'http://localhost:3001/docs-json';

interface OpenApiDocument { components?: { schemas?: Record<string, unknown> } }

const generateAliasesFile = (document: OpenApiDocument) => {
  const schemaNames = document.components?.schemas ? Object.keys(document.components.schemas) : [];
  const aliasLines = schemaNames.sort()
    .map(name => `export type ${name} = import('./api-types').components['schemas']['${name}'];`);

  const indexLines = [
    '// GENERATED FROM OpenAPI spec - do not edit manually',
    'export * from \'./api-types\'',
    '',
    '// Auto-generated type aliases from OpenAPI components.schemas',
    ...aliasLines,
  ];

  return indexLines.join('\n');
};

const fetchOpenApiSpec = async (url: string) => {
  console.log(`🚀 Fetching OpenAPI spec from ${url}...`);
  // Support local file paths (file:// or absolute path)
  try {
    if (url.startsWith('file://')) {
      const path = url.replace('file://', '');
      const data = readFileSync(path, 'utf8');
      return JSON.parse(data) as OpenApiDocument;
    }
    if (existsSync(url)) {
      const data = readFileSync(url, 'utf8');
      return JSON.parse(data) as OpenApiDocument;
    }
  } catch {
    // Not a local file, fall through to fetch
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const document = await response.json();
  return document as OpenApiDocument;
};

const ensureSharedDir = (sharedDir: string) => {
  if (!existsSync(sharedDir)) {
    mkdirSync(sharedDir, { recursive: true });
  }
};

const writeOpenApiSpecFile = (document: OpenApiDocument, specPath: string) => {
  writeFileSync(specPath, JSON.stringify(document, null, 2), 'utf8');
  console.log(`📄 OpenAPI spec written to ${specPath}`);
};

const generateAndWriteTypes = async (document: OpenApiDocument, typesPath: string) => {
  console.log('🔧 Generating TypeScript types from OpenAPI spec...');
  const ast = await openapiTS(JSON.stringify(document));
  const contents = astToString(ast);
  const header = '// GENERATED FROM OpenAPI spec - do not edit manually\n\n';
  // Write to tmp file, then rename to ensure atomic replace
  const tmpTypesPath = `${typesPath}.tmp`;
  writeFileSync(tmpTypesPath, header + contents, 'utf8');
  renameSync(tmpTypesPath, typesPath);
  console.log(`✅ TypeScript types written to ${typesPath}`);
};

const generateAndWriteIndex = (document: OpenApiDocument, sharedDir: string, indexPath: string) => {
  console.log('🔧 Generating shared index with type aliases...');
  const indexContent = generateAliasesFile(document);
  // Write to tmp file, then rename to ensure atomic replace
  const tmpIndexPath = `${indexPath}.tmp`;
  writeFileSync(tmpIndexPath, indexContent, 'utf8');
  renameSync(tmpIndexPath, indexPath);
  console.log(`✅ Shared index written to ${indexPath}`);
};

const writeTypesForDocument = async (document: OpenApiDocument) => {
  // Define output paths
  const repoRoot = join(__dirname, '../../../..');
  const sharedDir = join(repoRoot, 'packages', 'shared', 'src');
  const specPath = join(sharedDir, 'openapi.json');
  const typesPath = join(sharedDir, 'api-types.ts');

  // Ensure directories exist
  ensureSharedDir(sharedDir);

  // Write spec, types and index
  writeOpenApiSpecFile(document, specPath);
  await generateAndWriteTypes(document, typesPath);
  generateAndWriteIndex(document, sharedDir, join(sharedDir, 'index.ts'));
};

const generateOpenApiTypes = async () => {
  try {
    const document = await fetchOpenApiSpec(OPENAPI_URL);
    await writeTypesForDocument(document);

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
