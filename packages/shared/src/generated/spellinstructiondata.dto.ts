// GENERATED FROM backend - do not edit manually


export interface SpellInstructionDataDto {
  action: 'learn' | 'cast' | 'forget';
  name: string;
  level?: number;
  school?: string;
  description?: string;
}
