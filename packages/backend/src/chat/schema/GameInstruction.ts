import { Prop, Schema } from '@nestjs/mongoose';
import { CombatStartEntry } from './CombatStartEntry.js';
import { CombatEnd } from './CombatEnd.js';

@Schema({ _id: false })
export class GameInstruction {
  @Prop({
    required: false,
    type: String,
    enum: [
      'roll',
      'xp',
      'hp',
      'spell',
      'inventory',
      'combat_start',
      'combat_end',
    ],
  })
  type: 'roll' | 'xp' | 'hp' | 'spell' | 'inventory' | 'combat_start' | 'combat_end';

  // Roll instruction fields (flattened to top-level for DTO compatibility)
  @Prop({ required: false, type: String })
  dices?: string;

  @Prop({ required: false, type: Object })
  modifier?: string | number;

  @Prop({ required: false, type: String })
  description?: string;

  @Prop({
    required: false,
    type: String,
    enum: [
      'advantage',
      'disadvantage',
      'none',
    ],
  })
  advantage?: 'advantage' | 'disadvantage' | 'none';

  // Numeric instruction fields
  @Prop({ required: false, type: Number })
  hp?: number;

  @Prop({ required: false, type: Number })
  xp?: number;

  // Spell instruction fields
  // used both in spell and inventory instructions
  @Prop({
    required: false,
    type: String,
    enum: [
    // spell actions
      'learn',
      'cast',
      'forget',
      // inventory actions
      'add',
      'remove',
      'use',
    ],
  })
  action?: 'learn' | 'cast' | 'forget' | 'add' | 'remove' | 'use';

  @Prop({ required: false, type: String })
  name?: string;

  @Prop({ required: false, type: Number })
  level?: number;

  @Prop({ required: false, type: String })
  school?: string;

  @Prop({ required: false, type: Number })
  quantity?: number;

  // Combat instructions
  @Prop({ required: false, type: [CombatStartEntry] })
  combat_start?: CombatStartEntry[];

  @Prop({ required: false, type: CombatEnd })
  combat_end?: CombatEnd;
}
