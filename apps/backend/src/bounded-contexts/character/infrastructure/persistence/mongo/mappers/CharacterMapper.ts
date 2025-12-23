import {
  CharacterEntity,
  CharacterProps,
  type CharacterState,
  type InventoryItem,
  type CharacterAptitude,
} from "../../../../domain/entities/CharacterEntity.js";
import { CharacterStats } from "../../../../domain/value-objects/CharacterStats.js";
import { ResourcePool } from "../../../../domain/value-objects/ResourcePool.js";
import { TalentProgress } from "../../../../domain/value-objects/TalentRank.js";
import { CharacterDocument, type TalentProgress, type CharacterAptitude as MongoCharacterAptitude } from "../schemas/CharacterDocument.js";
import type { Item } from "../../../../../item/infrastructure/persistence/mongo/schemas/Item.js";
import { ClassName, RaceId } from "#shared/domain/index.js";

/**
 * Mapper for converting between CharacterDocument (MongoDB) and CharacterEntity (Domain).
 */
export class CharacterMapper {
  /**
   * Convert domain entity to persistence format.
   */
  static toPersistence(entity: CharacterEntity): Partial<CharacterDocument> {
    const props = entity.toProps();

    return {
      characterId: props.characterId,
      userId: props.userId ? (props.userId as unknown as CharacterDocument["userId"]) : undefined,
      name: props.name,
      physicalDescription: props.physicalDescription,
      portrait: props.portrait,
      gender: props.gender,
      state: props.state,
      className: props.className,
      raceId: props.raceId,
      level: props.level,
      stats: props.stats
        ? {
            vigor: props.stats.vigor,
            finesse: props.stats.finesse,
            mind: props.stats.mind,
            survival: props.stats.survival,
          }
        : undefined,
      hp: props.hp.current,
      hpMax: props.hp.max,
      pa: props.pa.current,
      paMax: props.pa.max,
      pm: props.pm.current,
      pmMax: props.pm.max,
      totalXp: props.totalXp,
      inspirationPoints: props.inspirationPoints,
      talentPoints: props.talentPoints,
      talentProgress: props.talentProgress.map(rank => ({
        voieId: rank.voieId,
        rank: rank.rank,
      })),
      aptitudes: props.aptitudes.map(apt => ({
        aptitudeId: apt.aptitudeId,
        currentCooldown: apt.currentCooldown,
      })),
      inventory: props.inventory.map(item => ({
        _id: item._id,
        name: item.name,
        definitionId: item.definitionId,
        qty: item.qty,
        description: item.description ?? "",
        equipped: item.equipped,
        meta: item.meta ?? {},
      })) as Item[],
      isDeceased: props.isDeceased,
      diedAt: props.diedAt,
      deathLocation: props.deathLocation,
    };
  }

  /**
   * Convert MongoDB document to domain entity.
   */
  static toDomain(doc: CharacterDocument): CharacterEntity {
    const stats = doc.stats
      ? new CharacterStats({
          vigor: doc.stats.vigor ?? 0,
          finesse: doc.stats.finesse ?? 0,
          mind: doc.stats.mind ?? 0,
          survival: doc.stats.survival ?? 0,
        })
      : undefined;

    const hp = new ResourcePool(doc.hp ?? 10, doc.hpMax ?? 10);
    const pa = new ResourcePool(doc.pa ?? 6, doc.paMax ?? 6);
    const pm = new ResourcePool(doc.pm ?? 4, doc.pmMax ?? 4);

    const talentProgress = (doc.talentProgress || []).map(
      (r: TalentProgress) => new TalentProgress(r.voieId, r.rank),
    );

    const aptitudes: CharacterAptitude[] = (doc.aptitudes || []).map(
      (a: MongoCharacterAptitude) => ({
        aptitudeId: a.aptitudeId,
        currentCooldown: a.currentCooldown,
      }),
    );

    const inventory: InventoryItem[] = (doc.inventory || []).map((item: Item) => ({
      _id: item._id,
      name: item.name,
      definitionId: item.definitionId,
      qty: item.qty,
      description: item.description,
      equipped: item.equipped,
      meta: item.meta as Record<string, unknown>,
    }));

    const props: CharacterProps = {
      characterId: doc.characterId,
      userId: doc.userId?.toString(),
      name: doc.name,
      physicalDescription: doc.physicalDescription,
      portrait: doc.portrait,
      gender: doc.gender,
      state: doc.state as CharacterState,
      className: doc.className as ClassName | undefined,
      raceId: doc.raceId as RaceId | undefined,
      level: doc.level ?? 1,
      stats,
      hp,
      pa,
      pm,
      totalXp: doc.totalXp ?? 0,
      inspirationPoints: doc.inspirationPoints ?? 1,
      talentPoints: doc.talentPoints ?? 0,
      talentProgress: talentProgress,
      aptitudes,
      inventory,
      isDeceased: doc.isDeceased ?? false,
      diedAt: doc.diedAt,
      deathLocation: doc.deathLocation,
    };

    return CharacterEntity.reconstitute(props);
  }

  /**
   * Convert multiple documents to domain entities.
   */
  static toDomainMany(docs: CharacterDocument[]): CharacterEntity[] {
    return docs.map(doc => CharacterMapper.toDomain(doc));
  }
}
