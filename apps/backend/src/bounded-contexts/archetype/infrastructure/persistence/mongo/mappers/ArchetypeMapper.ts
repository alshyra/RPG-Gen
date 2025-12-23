import { CharacterClass } from '../../../../domain/entities/CharacterClass.js';
import { ClassStats } from '../../../../domain/value-objects/ClassStats.js';
import { TalentTree } from '../../../../domain/value-objects/TalentTree.js';
import { TalentRank } from '../../../../domain/value-objects/TalentRank.js';
import { ArchetypeDocument } from '../schemas/ArchetypeDocument.js';
import { MainStat, parseArchetypeName } from '#shared/domain/index.js';

export class ArchetypeMapper {
  /**
   * MongoDB Document → Domain Entity
   */
  static toDomain(doc: ArchetypeDocument): CharacterClass {
    const stats = new ClassStats({
      hpBase: doc.stats.hpBase,
      hpGain: doc.stats.hpGain,
      pa: doc.stats.pa,
      pm: doc.stats.pm,
    });

    const talentTrees = doc.talentTrees.map(treeData => {
      const ranks = treeData.ranks.map(rankData =>
        new TalentRank({
          rank: rankData.rank,
          aptitudeId: rankData.aptitudeId,
          pointCost: rankData.pointCost,
        })
      );

      return new TalentTree({
        voieId: treeData.voieId,
        name: treeData.name,
        description: treeData.description,
        ranks,
      });
    });

    return new CharacterClass({
      name: parseArchetypeName(doc.name)!,
      displayName: doc.displayName,
      description: doc.description,
      stats,
      talentTrees,
      startingAptitudes: doc.startingAptitudes,
      mainStat: MainStat.fromString(doc.mainStat),
      color: doc.color,
      icon: doc.icon,
    });
  }

  /**
   * Domain Entity → MongoDB Document
   */
  static toPersistence(entity: CharacterClass): Partial<ArchetypeDocument> {
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
      mainStat: entity.mainStat?.value,  // ✅ Convertit MainStat VO → string
      color: entity.color,
      icon: entity.icon,
    };
  }
}