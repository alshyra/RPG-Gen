/**
 * JSON Schema for Gemini structured output
 * This defines the expected response structure from Gemini AI
 *
 * Note: This is manually defined rather than auto-generated from Zod schemas
 * because it provides better control over the exact JSON Schema format that
 * Gemini expects, including proper handling of oneOf discriminators and
 * detailed property descriptions.
 */

// Keep the schema intentionally shallow to avoid the GenerationConfig "nesting depth" limit
// imposed by the genai API. The fine-grained validation is performed locally using Zod
// (`gemini-schemas.ts`), so the schema here only enforces a basic, shallow JSON shape
// that helps the model return valid JSON without creating a too-deep GenerationConfig.
export const geminiResponseJsonSchema = {
  type: 'object',
  properties: {
    narrative: {
      type: 'string',
      description: 'Narrative text describing the scene and events',
    },
    // Keep 'instructions' shallow: each item must be an object with required 'type'.
    // Full instruction structure is validated later using Zod on the response.
    instructions: {
      type: 'array',
      description: 'Game instructions to execute',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          // allow a small free-form payload for the instruction; keep it shallow
          payload: {
            type: 'object',
            additionalProperties: true,
          },
        },
        required: ['type'],
        additionalProperties: true,
      },
    },
  },
  required: ['narrative'],
};
