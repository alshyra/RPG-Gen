// GENERATED FROM backend/src/schemas - do not edit manually


export interface SkillDto {
  name?: string;
  proficient?: boolean;
  modifier?: number;
}
export type CreateSkillDto = Partial<SkillDto>;
export type UpdateSkillDto = Partial<CreateSkillDto>;
