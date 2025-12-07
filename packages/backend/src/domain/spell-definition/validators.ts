import { z } from 'zod';

// Zod schema for incoming raw JSON spells. This accepts a loose shape, coerces
// string levels like "2" -> number 2 and normalizes meta.attackType to one of
// the allowed literal union values or undefined.
export const spellSchema = z.object({
  definitionId: z.string()
    .optional(),
  name: z.string()
    .optional(),
  // allow numbers or numeric strings
  level: z.preprocess((v) => {
    if (typeof v === 'string' && /^[0-9]+$/.test(v)) return Number(v);
    return v;
  }, z.number()
    .int()
    .nonnegative()
    .optional()),
  school: z.string()
    .optional(),
  castingTime: z.string()
    .optional(),
  range: z.string()
    .optional(),
  components: z.string()
    .optional(),
  duration: z.string()
    .optional(),
  ritual: z.boolean()
    .optional(),
  description: z.string()
    .optional(),
  meta: z
    .object({
      damageDice: z.string()
        .optional(),
      damageType: z.string()
        .optional(),
      saveType: z.string()
        .optional(),
      // gracefully coerce unknown values into undefined rather than failing
      attackType: z.preprocess((v) => {
        if (typeof v !== 'string') return undefined;
        const allowed = ['melee', 'ranged', 'spell'];
        return allowed.includes(v) ? v : undefined;
      }, z.enum(['melee', 'ranged', 'spell'])
        .optional()),
      school: z.string()
        .optional(),
      areaOfEffect: z.string()
        .optional(),
      scaling: z.string()
        .optional(),
    })
    .optional(),
})
  .passthrough();

export const spellsArraySchema = z.array(spellSchema);

export type RawSpell = z.infer<typeof spellSchema>;

export default spellSchema;
