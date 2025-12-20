import { Prop } from "@nestjs/mongoose";

/**
 * Race bonuses applied to character stats
 */
export class RaceBonuses {
  @Prop({ default: 0 })
  vigor?: number;

  @Prop({ default: 0 })
  finesse?: number;

  @Prop({ default: 0 })
  mind?: number;

  @Prop({ default: 0 })
  survival?: number;
}
