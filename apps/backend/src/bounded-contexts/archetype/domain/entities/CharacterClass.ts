import { ArchetypeName, MainStat, CharacterStats } from '#shared/domain/index.js';
import { ClassStats } from '../value-objects/ClassStats.js';
import { TalentTree } from '../value-objects/TalentTree.js';

export interface CharacterClassProps {
  name: ArchetypeName;
  displayName?: string;
  description?: string;
  stats: ClassStats;
  talentTrees: TalentTree[];
  startingAptitudes: string[];
  mainStat: MainStat;
  color?: string;
  icon?: string;
}

export class CharacterClass {
  private readonly _name: ArchetypeName;
  private readonly _displayName?: string;
  private readonly _description?: string;
  private readonly _stats: ClassStats;
  private readonly _talentTrees: TalentTree[];
  private readonly _startingAptitudes: string[];
  private readonly _mainStat: MainStat;
  private readonly _color?: string;
  private readonly _icon?: string;

  constructor(props: CharacterClassProps) {
    if (props.talentTrees.length !== 3) {
      throw new Error('Character class must have exactly 3 talent trees');
    }

    this._name = props.name;
    this._displayName = props.displayName;
    this._description = props.description;
    this._stats = props.stats;
    this._talentTrees = props.talentTrees;
    this._startingAptitudes = props.startingAptitudes;
    this._mainStat = props.mainStat;
    this._color = props.color;
    this._icon = props.icon;
  }

  get name(): ArchetypeName { return this._name; }
  get displayName(): string { return this._displayName || this._name; }
  get description(): string | undefined { return this._description; }
  get stats(): ClassStats { return this._stats; }
  get talentTrees(): readonly TalentTree[] { return this._talentTrees; }
  get startingAptitudes(): readonly string[] { return this._startingAptitudes; }
  get mainStat(): MainStat { return this._mainStat; }
  get color(): string | undefined { return this._color; }
  get icon(): string | undefined { return this._icon; }

  /**
   * Calcule les HP initiaux en tenant compte du bonus de vigueur
   */
  calculateInitialHp(stats: CharacterStats): number {
    const baseHp = this._stats.hpBase;
    const vigorBonus = Math.floor(stats.vigor / 2);
    return baseHp + vigorBonus;
  }

  /**
   * Récupère le bonus de la stat principale
   */
  getMainStatBonus(stats: CharacterStats): number {
    return this._mainStat ? this._mainStat.calculateBonus(stats) : 0;
  }

  /**
   * Calcule HP à un niveau donné
   */
  calculateHpAtLevel(level: number, vigorBonus: number = 0): number {
    return this._stats.calculateHpAtLevel(level, vigorBonus);
  }

  /**
   * Récupère un arbre de talents par voieId
   */
  getTalentTree(voieId: string): TalentTree | null {
    return this._talentTrees.find(tree => tree.voieId === voieId) || null;
  }

  /**
   * Liste toutes les aptitudes disponibles (starting + talent trees)
   */
  getAllAvailableAptitudes(): string[] {
    const aptitudes = [...this._startingAptitudes];
    for (const tree of this._talentTrees) {
      aptitudes.push(...tree.getAllAptitudeIds());
    }
    return aptitudes;
  }

  toJSON() {
    return {
      name: this._name,
      displayName: this._displayName,
      description: this._description,
      stats: this._stats.toJSON(),
      talentTrees: this._talentTrees.map(t => t.toJSON()),
      startingAptitudes: this._startingAptitudes,
      mainStat: this._mainStat?.toJSON(),
      color: this._color,
      icon: this._icon,
    };
  }
}
