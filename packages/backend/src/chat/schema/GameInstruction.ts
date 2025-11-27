import { Prop, Schema } from '@nestjs/mongoose';
import { RollInstruction } from './RollInstruction.js';
import { SpellInstruction } from './SpellInstruction.js';
import { InventoryInstruction } from './InventoryInstruction.js';
import { CombatStartEntry } from './CombatStartEntry.js';
import { CombatEnd } from './CombatEnd.js';

@Schema({ _id: false })
export class GameInstruction {
  @Prop({ required: false, type: String, enum: [
    'roll',
    'xp',
    'hp',
    'spell',
    'inventory',
    'combat_start',
    'combat_end',
  ] })
  type?: string;

  @Prop({ required: false, type: RollInstruction })
  roll?: RollInstruction;

  @Prop({ required: false, type: Number })
  hp?: number;

  @Prop({ required: false, type: Number })
  xp?: number;

  @Prop({ required: false, type: SpellInstruction })
  spell?: SpellInstruction;

  @Prop({ required: false, type: InventoryInstruction })
  inventory?: InventoryInstruction;

  @Prop({ required: false, type: [CombatStartEntry] })
  combat_start?: CombatStartEntry[];

  @Prop({ required: false, type: CombatEnd })
  combat_end?: CombatEnd;
}
