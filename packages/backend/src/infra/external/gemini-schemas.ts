import { z } from 'zod';

/**
 * Zod schemas for Gemini structured output
 * These schemas define the expected structure for AI-generated game instructions
 */

// Roll metadata schema - matching RollMetaDto
export const rollMetaSchema = z.object({
  attackBonus: z.number()
    .optional()
    .describe('Attack bonus to apply'),
  target: z.string()
    .optional()
    .describe('Target name'),
  targetAc: z.number()
    .optional()
    .describe('Target armor class'),
  damageDice: z.string()
    .optional()
    .describe('Damage dice expression'),
  damageBonus: z.number()
    .optional()
    .describe('Damage bonus to apply'),
  action: z.string()
    .optional()
    .describe('Action type (e.g., attack, damage)'),
});

// Roll instruction schema
export const rollInstructionSchema = z.object({
  type: z.literal('roll'),
  dices: z.string()
    .describe('Dice expression (e.g., 1d20+5)'),
  modifierLabel: z.string()
    .optional()
    .describe('Semantic modifier label (e.g., "wisdom (Perception)")'),
  modifierValue: z.number()
    .optional()
    .describe('Numeric modifier to apply to the roll (e.g., +3)'),
  description: z.string()
    .optional()
    .describe('Roll description'),
  advantage: z.enum(['advantage', 'disadvantage', 'none'])
    .optional()
    .describe('Advantage type'),
  meta: rollMetaSchema.optional()
    .describe('Optional metadata for combat rolls'),
});

// HP instruction schema
export const hpInstructionSchema = z.object({
  type: z.literal('hp'),
  hp: z.number()
    .describe('Amount of HP change'),
});

// XP instruction schema
export const xpInstructionSchema = z.object({
  type: z.literal('xp'),
  xp: z.number()
    .describe('Amount of XP gained'),
});

// Spell instruction schema
export const spellInstructionSchema = z.object({
  type: z.literal('spell'),
  action: z.enum(['learn', 'cast', 'forget'])
    .describe('Spell action'),
  name: z.string()
    .describe('Spell name'),
  level: z.number()
    .optional()
    .describe('Spell level'),
  school: z.string()
    .optional()
    .describe('Spell school'),
  description: z.string()
    .optional()
    .describe('Spell description'),
});

// Inventory instruction schema
export const inventoryInstructionSchema = z.object({
  type: z.literal('inventory'),
  action: z.enum(['add', 'remove', 'use'])
    .describe('Inventory action'),
  name: z.string()
    .describe('Item name'),
  quantity: z.number()
    .optional()
    .describe('Item quantity'),
});

// Combat start instruction schema
export const combatStartInstructionSchema = z.object({
  type: z.literal('combat_start'),
  combat_start: z.array(z.object({
    name: z.string()
      .describe('Enemy name'),
    hp: z.number()
      .describe('Enemy HP'),
    ac: z.number()
      .describe('Enemy AC'),
    attack_bonus: z.number()
      .optional()
      .describe('Enemy attack bonus'),
    damage_dice: z.string()
      .optional()
      .describe('Enemy damage dice'),
    damage_bonus: z.number()
      .optional()
      .describe('Enemy damage bonus'),
  }))
    .describe('List of enemies'),
});

// Combat end instruction schema (for recognizing combat end from system)
export const combatEndInstructionSchema = z.object({
  type: z.literal('combat_end'),
  combat_end: z.object({
    victory: z.boolean()
      .describe('Combat outcome'),
    xp_gained: z.number()
      .describe('XP gained from combat'),
    player_hp: z.number()
      .describe('Player HP after combat'),
    enemies_defeated: z.array(z.string())
      .describe('List of defeated enemies'),
  }),
});

// Combined game instruction schema (union of all instruction types)
export const gameInstructionSchema = z.discriminatedUnion('type', [
  rollInstructionSchema,
  hpInstructionSchema,
  xpInstructionSchema,
  spellInstructionSchema,
  inventoryInstructionSchema,
  combatStartInstructionSchema,
  combatEndInstructionSchema,
]);

// AI Response schema - the complete structure Gemini should return
export const aiResponseSchema = z.object({
  narrative: z.string()
    .describe('Narrative text describing the scene and events'),
  instructions: z.array(gameInstructionSchema)
    .optional()
    .describe('Game instructions to execute'),
});

export type AIResponseSchemaType = z.infer<typeof aiResponseSchema>;
export type GameInstructionSchemaType = z.infer<typeof gameInstructionSchema>;
