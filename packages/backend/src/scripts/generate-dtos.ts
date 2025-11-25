import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Project, ClassDeclaration } from 'ts-morph';

// ----------------------------
// Script configuration
// ----------------------------
// Resolve repository root relative to this script location so it works regardless
// of the working directory when the script is executed.
const __filename = fileURLToPath(import.meta.url);
const __scriptDir = path.dirname(__filename);
const repoRoot = path.resolve(__scriptDir, '../../../..');
const schemasDir = path.join(repoRoot, 'packages', 'backend', 'src', 'schemas');
const outDir = path.join(repoRoot, 'packages', 'shared', 'src', 'generated');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const project = new Project({
  tsConfigFilePath: path.join(repoRoot, 'packages', 'backend', 'tsconfig.json'),
});

project.addSourceFilesAtPaths(path.join(schemasDir, '**', '*.ts'));
// Also include any hand-authored DTO files (e.g. dice.dto.ts) so we can copy/convert class-based DTOs
project.addSourceFilesAtPaths(path.join(repoRoot, 'packages', 'backend', 'src', '**', '*.dto.ts'));

// ----------------------------
// Utilities
// ----------------------------
const dtoNameFor = (className: string) => `${className}Dto`;

/** Normalizes some source typing quirks into more-friendly DTO types. */
function normalizeTypeText(typeText: string): string {
  // Convert Mongoose ObjectId -> string
  return typeText.replace(/MongooseSchema\.Types\.ObjectId/g, 'string');
}

/** Replace known schema class references (and their array forms) with DTO names. */
function mapTypeText(typeText: string, knownSchemaNames: Set<string>): string {
  const text = normalizeTypeText(typeText);
  // Replace plain class names with XDto (and leave other types intact)
  let out = text;
  knownSchemaNames.forEach((className) => {
    const dto = dtoNameFor(className);
    // Word boundary replace (safe) for the class name
    out = out.replace(new RegExp(`\\b${className}\\b`, 'g'), dto);
  });
  return out;
}

/** Read all source files and collect schema classes and type aliases. */
const sourceFiles = project.getSourceFiles();
const schemaClasses: ClassDeclaration[] = [];
const typeAliases: Array<{ name: string; text: string }> = [];

for (const file of sourceFiles) {
  // Collect classes annotated with @Schema
  for (const cls of file.getClasses()) {
    const hasSchemaDecorator = cls.getDecorators().some(d => d.getName() === 'Schema');
    if (hasSchemaDecorator) schemaClasses.push(cls);
  }

  // Only collect top-level aliases from the schemas directory
  if (file.getFilePath().includes(path.join('src', 'schemas'))) {
    for (const ta of file.getTypeAliases()) {
      const name = ta.getName();
      const text = ta.getText();
      const nodeText = ta.getTypeNode()?.getText() ?? '';
      // Keep simple string unions like Gender = 'male' | 'female'
      if (nodeText.includes('\'') || nodeText.includes('"') || nodeText.includes('|')) {
        typeAliases.push({ name, text });
      }
    }
  }
}

const knownSchemaNames = new Set(schemaClasses.map(s => s.getName() || '').filter(Boolean));

// Collect additional class-based DTOs present in the codebase (files like *.dto.ts)
const extraDtoClasses: ClassDeclaration[] = [];
for (const file of sourceFiles) {
  for (const cls of file.getClasses()) {
    const clsName = cls.getName();
    if (!clsName) continue;
    // If class name ends with Dto and is not already a schema class, treat it as an extra DTO
    if (clsName.endsWith('Dto') && !knownSchemaNames.has(clsName.replace(/Dto$/, ''))) {
      // Avoid duplicates
      extraDtoClasses.push(cls);
    }
  }
}

// ----------------------------
// Generation helpers
// ----------------------------
function propLineFor(propName: string, typeText: string, optional: boolean) {
  return `${propName}${optional ? '?' : ''}: ${typeText};`;
}

function isServerManaged(fieldName: string) {
  const serverFields = [
    '_id', 'createdAt', 'updatedAt', 'userId',
  ];
  return serverFields.includes(fieldName);
}

// ----------------------------
// Generate DTO files per schema class
// ----------------------------
for (const cls of schemaClasses) {
  const name = cls.getName();
  if (!name) continue;

  const interfaceName = dtoNameFor(name);

  // Collect all property metadata (we need both for public DTO and for Create/Update heuristics)
  const allProps: Array<{ name: string; optional: boolean; typeText: string }> = [];

  for (const prop of cls.getProperties()) {
    const propName = prop.getName();
    const hasQuestion = prop.hasQuestionToken();

    // Decorator args may contain 'required: false' or 'required: true'
    let requiredFromDecorator: boolean | undefined;
    for (const d of prop.getDecorators()) {
      const args = d.getArguments().map(a => a.getText()).join(' ');
      if (args.includes('required: false')) requiredFromDecorator = false;
      if (args.includes('required: true')) requiredFromDecorator = true;
    }

    const optional = hasQuestion || requiredFromDecorator === false;

    // prefer explicit type node text if available (keeps generics/arrays intact)
    const tNode = prop.getTypeNode();
    const rawTypeText = tNode ? tNode.getText() : prop.getType().getText();
    const normalizedType = mapTypeText(rawTypeText, knownSchemaNames);

    allProps.push({ name: propName, optional, typeText: normalizedType });
  }

  // Public props exclude server-managed fields
  const publicProps = allProps.filter(p => !isServerManaged(p.name));
  const propLines = publicProps.map(p => propLineFor(p.name, p.typeText, p.optional));

  // Build file content
  const outPath = path.join(outDir, `${name.toLowerCase()}.dto.ts`);
  const header = [
    '// GENERATED FROM backend/src/schemas - do not edit manually', '',
  ];

  // Determine imports for nested DTOs
  const imports: string[] = [];
  for (const candidate of knownSchemaNames) {
    if (candidate === name) continue;
    const dto = dtoNameFor(candidate);
    if (propLines.join(' ').includes(dto)) {
      imports.push(`import { ${dto} } from './${candidate.toLowerCase()}.dto';`);
    }
  }

  // Add type alias imports (e.g., Gender) if referenced
  for (const ta of typeAliases) {
    if (propLines.join(' ').includes(ta.name)) imports.push(`import { ${ta.name} } from './types.dto';`);
  }

  let fileContent = [
    ...header, ...imports, '', `export interface ${interfaceName} {`, ...propLines.map(p => `  ${p}`), '}', '',
  ].join('\n');

  // Create helper Create/Update types using server-managed field heuristic
  const presentNames = allProps.map(p => p.name);
  const fieldsToOmit = [
    '_id', 'createdAt', 'updatedAt', 'userId',
  ].filter(f => presentNames.includes(f));
  const baseName = interfaceName.replace(/Dto$/, '');
  if (fieldsToOmit.length > 0) {
    const union = fieldsToOmit.map(f => `'${f}'`).join(' | ');
    fileContent += `export type Create${baseName}Dto = Omit<${interfaceName}, ${union}>;\n`;
    fileContent += `export type Update${baseName}Dto = Partial<Create${baseName}Dto>;\n`;
  } else {
    fileContent += `export type Create${baseName}Dto = Partial<${interfaceName}>;\n`;
    fileContent += `export type Update${baseName}Dto = Partial<Create${baseName}Dto>;\n`;
  }

  fs.writeFileSync(outPath, fileContent, { encoding: 'utf8' });
  console.log(`Wrote ${outPath}`);

  // Provide a small convenience alias for CharacterDto.gender
  if (interfaceName === 'CharacterDto') {
    fs.appendFileSync(outPath, `\nexport type GenderDto = CharacterDto['gender'];\n`, { encoding: 'utf8' });
  }
}

// ----------------------------
// Also process extra class-based DTOs (simple conversion: class -> interface)
// ----------------------------
for (const cls of extraDtoClasses) {
  const name = cls.getName();
  if (!name) continue;

  const interfaceName = name; // class already ends with Dto
  const props = cls.getProperties().map((p) => {
    const propName = p.getName();
    const optional = p.hasQuestionToken();
    const tNode = p.getTypeNode();
    const raw = tNode ? tNode.getText() : p.getType().getText();
    const normalized = mapTypeText(raw, knownSchemaNames);
    return propLineFor(propName, normalized, optional);
  });

  // Build file content for this DTO
  const base = interfaceName.replace(/Dto$/, '');
  const outPath = path.join(outDir, `${base.toLowerCase()}.dto.ts`);
  const header = [
    '// GENERATED FROM backend - do not edit manually', '',
  ];
  // imports: check known schema/alias usage
  const imports: string[] = [];
  for (const candidate of Array.from(knownSchemaNames)) {
    const dto = dtoNameFor(candidate);
    if (props.join(' ').includes(dto)) imports.push(`import { ${dto} } from './${candidate.toLowerCase()}.dto';`);
  }
  for (const ta of typeAliases) if (props.join(' ').includes(ta.name)) imports.push(`import { ${ta.name} } from './types.dto';`);

  const fileContent = [
    ...header, ...imports, '', `export interface ${interfaceName} {`, ...props.map(p => `  ${p}`), '}', '',
  ].join('\n');
  fs.writeFileSync(outPath, fileContent, { encoding: 'utf8' });
  console.log(`Wrote extra DTO ${outPath}`);
  // make sure this DTO is exported in the barrel below
  knownSchemaNames.add(interfaceName.replace(/Dto$/, ''));
}

// ----------------------------
// Barrel index and shared type aliases
// ----------------------------
const indexPath = path.join(outDir, 'index.ts');
const barrelExports = Array.from(knownSchemaNames).map(n => `export * from './${n.toLowerCase()}.dto';`);
fs.writeFileSync(indexPath, barrelExports.join('\n') + '\n', { encoding: 'utf8' });
console.log(`Wrote ${indexPath}`);

const typesPath = path.join(outDir, 'types.dto.ts');
if (typeAliases.length > 0) {
  const content = [
    '// GENERATED FROM backend/src/schemas - shared simple types', '', ...typeAliases.map(t => t.text), '',
  ].join('\n');
  fs.writeFileSync(typesPath, content, { encoding: 'utf8' });
  console.log(`Wrote ${typesPath}`);
}
