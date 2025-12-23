import { CharacterClass } from '../../../domain/class/entities/CharacterClass.js';
import { ClassStats } from '../../../domain/class/value-objects/ClassStats.js';
import { TalentTree } from '../../../domain/class/value-objects/TalentTree.js';
import { ClassDocument } from '../mongo/schemas/ClassDocument.js';

/**
 * Mapper for CharacterClass entity ↔ ClassDocument
 * 
 * @infrastructure game-data
 */
export class ClassMapper {
  /**
   * Map MongoDB document to domain entity
   */
  static toDomain(doc: ClassDocument): CharacterClass {
    const stats = new ClassStats({
      hpBase: doc.stats.hpBase,
      hpGain: doc.stats.hpGain,
      pa: doc.stats.pa,
      pm: doc.stats.pm,
    });

    const talentTrees = doc.talentTrees.map(tree => new TalentTree({
      voieId: tree.voieId,
      name: tree.name,
      description: tree.description,
      ranks: tree.ranks,
    }));

    return new CharacterClass({
      name: doc.name,
      displayName: doc.displayName,
      description: doc.description,
      stats,
      mainStat: doc.mainStat,
      proficiencies: doc.proficiencies,
      startingAptitudes: doc.startingAptitudes,
      talentTrees,
      color: doc.color,
      icon: doc.icon,
    });
  }

  /**
   * Map domain entity to MongoDB document data
   */
  static toPersistence(entity: CharacterClass): Partial<ClassDocument> {
    return {
      name: entity.name,
      displayName: entity.displayName,
      description: entity.description,
      stats: {
        hpBase: entity.stats.hpBase,
        hpGain: entity.stats.hpGain,
        pa: entity.stats.pa,
        pm: entity.stats.pm,
      },
      talentTrees: entity.talentTrees.map(tree => ({
        voieId: tree.voieId,
        name: tree.name,
        description: tree.description,
        ranks: tree.ranks.map(rank => ({
          rank: rank.rank,
          aptitudeId: rank.aptitudeId,
          pointCost: rank.pointCost,
        })),
      })),
      startingAptitudes: [...entity.startingAptitudes],
      proficiencies: [...entity.proficiencies],
      mainStat: entity.mainStat,
      color: entity.color,
      icon: entity.icon,
    };
  }
}
