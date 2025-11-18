import path from "path";
import fs from "fs";
import { Project, ClassDeclaration, SyntaxKind } from "ts-morph";

const repoRoot = path.resolve(__dirname, "..", "..");
const schemasDir = path.join(repoRoot, "backend", "src", "schemas");
const outDir = path.join(repoRoot, "packages", "shared", "src", "generated");

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const project = new Project({
  tsConfigFilePath: path.join(repoRoot, "backend", "tsconfig.json"),
});

// Add schema files
project.addSourceFilesAtPaths(path.join(schemasDir, "**", "*.ts"));

const normalizeTypeText = (typeText: string) => {
  // Replace Mongoose ObjectId with string
  typeText = typeText.replace(/MongooseSchema\.Types\.ObjectId/g, "string");
  // Basic Record conversion: Record<string, number> -> Record<string, number>
  // We'll keep complex type text; nested types will be normalized later
  return typeText;
};

const isSchemaClass = (cls: ClassDeclaration) =>
  cls.getDecorators().some((d) => d.getName() === "Schema");

const dtoNameForClass = (name: string) => `${name}Dto`;

function getReferencedClassName(typeText: string) {
  // handle simple array form: SomeType[], or Array<SomeType>
  const arrayMatch = typeText.match(/^(.+)\[\]$/);
  if (arrayMatch) return arrayMatch[1];
  const genericMatch = typeText.match(/^Array<(.+)>$/);
  if (genericMatch) return genericMatch[1];
  return typeText;
}

function mapType(typeText: string, knownSchemaNames: Set<string>) {
  typeText = normalizeTypeText(typeText);
  // Replace known schema class names with their DTO equivalents
  knownSchemaNames.forEach((name) => {
    const regex = new RegExp(`\\b${name}\\b`, "g");
    typeText = typeText.replace(regex, dtoNameForClass(name));
    // also apply to array forms (SomeType[])
    const dtoArrayRegex = new RegExp(`${dtoNameForClass(name)}\\[]`, "g");
    typeText = typeText.replace(dtoArrayRegex, `${dtoNameForClass(name)}[]`);
  });
  return typeText;
}

const sourceFiles = project.getSourceFiles();
const schemaClasses: ClassDeclaration[] = [];
sourceFiles.forEach((file) => {
  file.getClasses().forEach((cls) => {
    if (isSchemaClass(cls)) schemaClasses.push(cls);
  });
});

// Collect top-level TypeAlias declarations (like Gender = 'male' | 'female')
const typeAliases: { name: string; text: string }[] = [];
sourceFiles.forEach((file) => {
  // Only collect type aliases from the schemas directory
  if (!file.getFilePath().includes(path.join("src", "schemas"))) return;
  file.getTypeAliases().forEach((ta) => {
    const name = ta.getName();
    const text = ta.getText();
    const typeNodeText = ta.getTypeNode()?.getText() || "";
    // Only keep simple union/string aliases (like Gender = "male" | "female")
    if (typeNodeText.includes("'") || typeNodeText.includes('"') || typeNodeText.includes("|")) {
      typeAliases.push({ name, text });
    }
  });
});

// Collect names to map nested classes
const knownSchemaNames = new Set(schemaClasses.map((c) => c.getName() || ""));

schemaClasses.forEach((cls) => {
  const name = cls.getName();
  if (!name) return;
  const interfaceName = dtoNameForClass(name);
  const props: string[] = [];

  cls.getProperties().forEach((prop) => {
    const propName = prop.getName();
    // Determine optionality: has ? or decorator with required false or default
    const hasQuestion = prop.hasQuestionToken();
    const decorators = prop.getDecorators();
    let required = undefined as boolean | undefined;
    decorators.forEach((d) => {
      const args = d
        .getArguments()
        .map((a) => a.getText())
        .join(" ");
      if (args.includes("required: false")) required = false;
      if (args.includes("required: true")) required = true;
    });
    const optional = hasQuestion || required === false;
    // fallback to type node text
    const typeNode = prop.getTypeNode();
    let typeText = typeNode ? typeNode.getText() : prop.getType().getText();
    typeText = mapType(typeText, knownSchemaNames);

    props.push(`${propName}${optional ? "?" : ""}: ${typeText};`);
  });

  const outPath = path.join(outDir, `${name.toLowerCase()}.dto.ts`);
  const header = [`// GENERATED FROM backend/src/schemas - do not edit manually`, ``];
  const imports: string[] = [];
  // Add imports for nested DTOs used in this interface
  knownSchemaNames.forEach((k) => {
    if (k === name) return;
    const dtoName = dtoNameForClass(k);
    const usageRegex = new RegExp(`\\b${dtoName}\\b`);
    if (props.join(" ").match(usageRegex)) {
      imports.push(`import { ${dtoName} } from './${k.toLowerCase()}.dto';`);
    }
  });
  // If the generated interface references any type alias (e.g. Gender), import it
  typeAliases.forEach((t) => {
    const usageRegex = new RegExp(`\\b${t.name}\\b`);
    if (props.join(" ").match(usageRegex)) {
      imports.push(`import { ${t.name} } from './types.dto';`);
    }
  });

  let fileContent = [
    ...header,
    ...imports,
    ``,
    `export interface ${interfaceName} {`,
    ...props.map((p) => `  ${p}`),
    `}`,
    ``,
  ].join("\n");

  // Add helper Create / Update types:
  // Heuristic: omit typical server-managed fields when building CreateXxxDto
  const serverManagedFields = ["_id", "id", "createdAt", "updatedAt", "userId", "characterId"];
  const presentFields = props.map((p) => p.split(/[?:]/)[0].trim());
  const fieldsToOmit = serverManagedFields.filter((f) => presentFields.includes(f));
  if (fieldsToOmit.length > 0) {
    const omitUnion = fieldsToOmit.map((f) => `'${f}'`).join(" | ");
    const baseName = interfaceName.replace(/Dto$/, "");
    fileContent += `export type Create${baseName}Dto = Omit<${interfaceName}, ${omitUnion}>;\n`;
    fileContent += `export type Update${baseName}Dto = Partial<Create${baseName}Dto>;\n`;
  } else {
    // Fallback to Partial if no standard server-managed fields found
    const baseName = interfaceName.replace(/Dto$/, "");
    fileContent += `export type Create${baseName}Dto = Partial<${interfaceName}>;\n`;
    fileContent += `export type Update${baseName}Dto = Partial<Create${baseName}Dto>;\n`;
  }

  fs.writeFileSync(outPath, fileContent, { encoding: "utf8" });
  console.log(`Wrote ${outPath}`);
  // Create a GenderDto type alias when generating CharacterDto
  if (interfaceName === "CharacterDto") {
    fs.appendFileSync(outPath, "\nexport type GenderDto = CharacterDto['gender'];\n", {
      encoding: "utf8",
    });
  }
});

// Generate a barrel index.ts exporting all created dtos
const indexPath = path.join(outDir, "index.ts");
const barrelExports: string[] = [];
knownSchemaNames.forEach((name) => {
  barrelExports.push(`export * from './${name.toLowerCase()}.dto';`);
});
fs.writeFileSync(indexPath, barrelExports.join("\n") + "\n", { encoding: "utf8" });
console.log(`Wrote ${indexPath}`);

// Write shared type aliases (e.g., Gender)
const typesPath = path.join(outDir, "types.dto.ts");
if (typeAliases.length > 0) {
  const content = [
    "// GENERATED FROM backend/src/schemas - shared simple types",
    "",
    ...typeAliases.map((t) => t.text),
    "",
  ].join("\n");
  fs.writeFileSync(typesPath, content, { encoding: "utf8" });
  console.log(`Wrote ${typesPath}`);
}
