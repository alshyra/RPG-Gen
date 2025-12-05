/**
 * JSON Schema for Gemini structured output
 * This defines the expected response structure from Gemini AI
 *
 * Note: This is manually defined rather than auto-generated from Zod schemas
 * because it provides better control over the exact JSON Schema format that
 * Gemini expects, including proper handling of oneOf discriminators and
 * detailed property descriptions.
 */

export const geminiResponseJsonSchema = {
  type: 'object',
  properties: {
    narrative: {
      type: 'string',
      description: 'Narrative text describing the scene and events',
    },
    instructions: {
      type: 'array',
      description: 'Game instructions to execute',
      items: {
        oneOf: [
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['roll'],
              },
              dices: {
                type: 'string',
                description: 'Dice expression (e.g., 1d20+5)',
              },
              modifierLabel: {
                type: 'string',
                description: 'Semantic modifier label (e.g., "wisdom (Perception)")',
              },
              modifierValue: {
                type: 'number',
                description: 'Numeric modifier to apply',
              },
              description: {
                type: 'string',
                description: 'Roll description',
              },
              advantage: {
                type: 'string',
                enum: ['advantage', 'disadvantage', 'none'],
                description: 'Advantage type',
              },
              meta: {
                type: 'object',
                properties: {
                  attackBonus: {
                    type: 'number',
                    description: 'Attack bonus to apply',
                  },
                  target: {
                    type: 'string',
                    description: 'Target name',
                  },
                  targetAc: {
                    type: 'number',
                    description: 'Target armor class',
                  },
                  damageDice: {
                    type: 'string',
                    description: 'Damage dice expression',
                  },
                  damageBonus: {
                    type: 'number',
                    description: 'Damage bonus to apply',
                  },
                  action: {
                    type: 'string',
                    description: 'Action type (e.g., attack, damage)',
                  },
                },
              },
            },
            required: ['type', 'dices'],
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['hp'],
              },
              hp: {
                type: 'number',
                description: 'Amount of HP change',
              },
            },
            required: ['type', 'hp'],
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['xp'],
              },
              xp: {
                type: 'number',
                description: 'Amount of XP gained',
              },
            },
            required: ['type', 'xp'],
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['spell'],
              },
              action: {
                type: 'string',
                enum: ['learn', 'cast', 'forget'],
                description: 'Spell action',
              },
              name: {
                type: 'string',
                description: 'Spell name',
              },
              level: {
                type: 'number',
                description: 'Spell level',
              },
              school: {
                type: 'string',
                description: 'Spell school',
              },
              description: {
                type: 'string',
                description: 'Spell description',
              },
            },
            required: ['type', 'action', 'name'],
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['inventory'],
              },
              action: {
                type: 'string',
                enum: ['add', 'remove', 'use'],
                description: 'Inventory action',
              },
              name: {
                type: 'string',
                description: 'Item name',
              },
              quantity: {
                type: 'number',
                description: 'Item quantity',
              },
            },
            required: ['type', 'action', 'name'],
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['combat_start'],
              },
              combat_start: {
                type: 'array',
                description: 'List of enemies',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Enemy name',
                    },
                    hp: {
                      type: 'number',
                      description: 'Enemy HP',
                    },
                    ac: {
                      type: 'number',
                      description: 'Enemy AC',
                    },
                    attack_bonus: {
                      type: 'number',
                      description: 'Enemy attack bonus',
                    },
                    damage_dice: {
                      type: 'string',
                      description: 'Enemy damage dice',
                    },
                    damage_bonus: {
                      type: 'number',
                      description: 'Enemy damage bonus',
                    },
                  },
                  required: ['name', 'hp', 'ac'],
                },
              },
            },
            required: ['type', 'combat_start'],
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['combat_end'],
              },
              combat_end: {
                type: 'object',
                properties: {
                  victory: {
                    type: 'boolean',
                    description: 'Combat outcome',
                  },
                  xp_gained: {
                    type: 'number',
                    description: 'XP gained from combat',
                  },
                  player_hp: {
                    type: 'number',
                    description: 'Player HP after combat',
                  },
                  enemies_defeated: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of defeated enemies',
                  },
                },
                required: ['victory', 'xp_gained', 'player_hp', 'enemies_defeated'],
              },
            },
            required: ['type', 'combat_end'],
          },
        ],
      },
    },
  },
  required: ['narrative'],
};
