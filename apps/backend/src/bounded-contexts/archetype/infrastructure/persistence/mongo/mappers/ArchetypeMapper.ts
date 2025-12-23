import { Archetype } from '../../../../domain/entities/Archetype.js';
import { ArchetypeStats } from '../../../../domain/value-objects/ArchetypeStats.js';
import { TalentTree } from '../../../../domain/value-objects/TalentTree.js';
import { TalentRank } from '../../../../domain/value-objects/TalentRank.js';
import { ArchetypeDocument } from '../schemas/ArchetypeDocument.js';
import { MainStat, parseArchetypeName } from '#shared';

export class ArchetypeMapper {
  /**
   * MongoDB Document → Domain Entity
   */
  static toDomain(doc: ArchetypeDocument): Archetype {
    const stats = new ArchetypeStats({
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

    return new Archetype({
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
  static toPersistence(entity: Archetype): Partial<ArchetypeDocument> {
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