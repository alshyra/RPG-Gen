import { SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Character } from './Character.js';
export { AbilityScores } from './AbilityScores.js';
export { CharacterClass } from './CharacterClass.js';
export { Item } from './Item.js';
export { Race } from './Race.js';
export { Skill } from './Skill.js';
export { Spell } from './Spell.js';
export { Character } from './Character.js';

export type CharacterDocument = Character & Document;

export const CharacterSchema = SchemaFactory.createForClass(Character);

// Index for efficient querying
CharacterSchema.index({
  userId: 1,
  characterId: 1,
});
CharacterSchema.index({
  userId: 1,
  isDeceased: 1,
});
