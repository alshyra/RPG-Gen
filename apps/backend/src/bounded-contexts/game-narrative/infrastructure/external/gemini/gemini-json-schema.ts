/**
 * JSON Schema for Gemini structured output
 * This defines the expected response structure from Gemini AI
 *
 * Note: This is manually defined rather than auto-generated from Zod schemas
 * because it provides better control over the exact JSON Schema format that
 * Gemini expects, and to keep the schema shallow and Gemini-friendly.
 *
 * FLAT INSTRUCTION STRUCTURE: All properties at the same level (no nested "payload").
 * Gemini will return instructions directly like: { type: "roll", dices: "1d20+5", ... }
 * This avoids the need for normalization and reduces schema complexity.
 */

// Keep the schema intentionally shallow to avoid the GenerationConfig "nesting depth" limit
// imposed by the genai API. The fine-grained validation is performed locally using Zod
// (`gemini-schemas.ts`), so the schema here only enforces a basic, shallow JSON shape.
export const geminiResponseJsonSchema = {
  type: "object",
  properties: {
    narrative: {
      type: "string",
      description: "Narrative text describing the scene and events",
    },
    instructions: {
      type: "array",
      description: "Game instructions to execute",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Instruction type",
            enum: ["roll", "combat_start", "inventory", "hp", "xp", "spell"],
          },
          // Roll instruction fields
          dices: { type: "string", description: "Dice expression (e.g., 1d20+5)" },
          modifierLabel: { type: "string", description: "Semantic modifier label" },
          modifierValue: { type: "number", description: "Numeric modifier value" },
          description: { type: "string", description: "Action description" },
          advantage: { type: "string", enum: ["advantage", "disadvantage", "none"] },
          // Combat start fields
          combat_start: {
            type: "array",
            description: "List of enemies",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                hp: { type: "number" },
                attack_bonus: { type: "number" },
                damage_dice: { type: "string" },
                damage_bonus: { type: "number" },
              },
            },
          },
          // HP/XP fields
          hp: { type: "number", description: "HP change amount" },
          xp: { type: "number", description: "XP gained amount" },
          // Inventory/Spell common fields
          action: {
            type: "string",
            enum: ["add", "remove", "use", "learn", "cast", "forget"],
            description: "Action type",
          },
          name: { type: "string", description: "Item or spell name" },
          quantity: { type: "number", description: "Item quantity" },
        },
        required: ["type"],
        additionalProperties: true,
      },
    },
  },
  required: ["narrative"],
  additionalProperties: false,
};
