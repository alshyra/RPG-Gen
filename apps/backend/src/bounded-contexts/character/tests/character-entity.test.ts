import { CharacterEntity } from "../domain/entities/CharacterEntity.js";
import { CharacterStats } from "../domain/value-objects/CharacterStats.js";

// ===========================
// Factory Methods
// ===========================

describe('CharacterEntity', () => {
  describe('createDraft', () => {
    test("creates draft character", () => {
      const character = CharacterEntity.createDraft({
        characterId: "test-id",
        userId: "user-123",
      });

      expect(character.id).toBe("test-id");
      expect(character.userId).toBe("user-123");
      expect(character.state).toBe("draft");
      expect(character.isDraft).toBe(true);
      expect(character.isComplete).toBe(false);
      expect(character.level).toBe(1);
      expect(character.totalXp).toBe(0);
      expect(character.inspirationPoints).toBe(1);
      expect(character.talentPoints).toBe(0);
      expect(character.isDeceased).toBe(false);
    });

    test("creates with default resources", () => {
      const character = CharacterEntity.createDraft({
        characterId: "test-id",
      });

      expect(character.hp).toBe(10);
      expect(character.hpMax).toBe(10);
      expect(character.pa).toBe(6);
      expect(character.paMax).toBe(6);
      expect(character.pm).toBe(4);
      expect(character.pmMax).toBe(4);
    });
  });

  // ===========================
  // Complete Draft
  // ===========================

  describe('completeDraft', () => {
    test("completes draft successfully", () => {
      const character = CharacterEntity.createDraft({
        characterId: "test-id",
      });

      const stats = new CharacterStats({
        vigor: 4,
        finesse: 2,
        mind: 2,
        survival: 2,
      });

      character.completeDraft({
        name: "Test Hero",
        className: "guerrier",
        raceId: "humain",
        stats,
        physicalDescription: "A brave warrior",
        gender: "male",
      });

      expect(character.state).toBe("created");
      expect(character.name).toBe("Test Hero");
      expect(character.className).toBe("guerrier");
      expect(character.raceId).toBe("humain");
      expect(character.stats).toBeTruthy();
      expect(character.stats?.vigor).toBe(4);
    });

    test("throws if not draft", () => {
      const character = CharacterEntity.createDraft({
        characterId: "test-id",
      });

      const stats = new CharacterStats({
        vigor: 4,
        finesse: 2,
        mind: 2,
        survival: 2,
      });

      character.completeDraft({
        name: "Test Hero",
        className: "guerrier",
        raceId: "humain",
        stats,
      });

      expect(() => {
        character.completeDraft({
          name: "Test Hero 2",
          className: "rogue",
          raceId: "nain",
          stats,
        });
      }).toThrow("Can only complete a draft character");
    });
  });

  // ===========================
  // Level Up
  // ===========================

  describe('levelUp', () => {
    test("increases level and grants talent point", () => {
      const character = createCompleteCharacter();

      const initialLevel = character.level;
      const initialTalentPoints = character.talentPoints;

      character.levelUp();

      expect(character.level).toBe(initialLevel + 1);
      expect(character.talentPoints).toBe(initialTalentPoints + 1);
    });

    test("throws if not complete", () => {
      const character = CharacterEntity.createDraft({
        characterId: "test-id",
      });

      expect(() => {
        character.levelUp();
      }).toThrow("Cannot level up a draft character");
    });
  });

  // ===========================
  // Damage and Healing
  // ===========================

  describe('takeDamage', () => {
    test("reduces HP", () => {
      const character = createCompleteCharacter();
      const initialHp = character.hp;

      character.takeDamage(5);

      expect(character.hp).toBe(initialHp - 5);
    });

    test("marks as deceased when HP reaches 0", () => {
      const character = createCompleteCharacter();

      character.takeDamage(character.hp);

      expect(character.isDeceased).toBe(true);
      expect(character.diedAt).toBeTruthy();
    });

    test("throws on negative damage", () => {
      const character = createCompleteCharacter();

      expect(() => {
        character.takeDamage(-5);
      }).toThrow("Damage cannot be negative");
    });
  });

  describe('heal', () => {
    test("increases HP capped at max", () => {
      const character = createCompleteCharacter();
      character.takeDamage(10);
      const afterDamageHp = character.hp;

      character.heal(5);

      expect(character.hp).toBe(afterDamageHp + 5);
    });

    test("does not exceed max HP", () => {
      const character = createCompleteCharacter();
      character.takeDamage(5);

      character.heal(100);

      expect(character.hp).toBe(character.hpMax);
    });
  });

  // ===========================
  // Experience
  // ===========================

  describe('addExperience', () => {
    test("adds XP", () => {
      const character = createCompleteCharacter();
      const initialXp = character.totalXp;

      const result = character.addExperience(50);

      expect(character.totalXp).toBe(initialXp + 50);
      expect(result.leveledUp).toBe(false);
    });

    test("throws on negative XP", () => {
      const character = createCompleteCharacter();

      expect(() => {
        character.addExperience(-10);
      }).toThrow("XP amount cannot be negative");
    });
  });

  // ===========================
  // Action Points
  // ===========================

  describe('spendActionPoints', () => {
    test("spends PA", () => {
      const character = createCompleteCharacter();
      const initialPa = character.pa;

      character.spendActionPoints(2);

      expect(character.pa).toBe(initialPa - 2);
    });

    test("throws on insufficient PA", () => {
      const character = createCompleteCharacter();

      expect(() => {
        character.spendActionPoints(character.pa + 1);
      }).toThrow("Insufficient resources");
    });
  });

  describe('spendMovementPoints', () => {
    test("spends PM", () => {
      const character = createCompleteCharacter();
      const initialPm = character.pm;

      character.spendMovementPoints(2);

      expect(character.pm).toBe(initialPm - 2);
    });
  });

  describe('restoreResources', () => {
    test("restores PA and PM", () => {
      const character = createCompleteCharacter();
      character.spendActionPoints(3);
      character.spendMovementPoints(2);

      character.restoreResources();

      expect(character.pa).toBe(character.paMax);
      expect(character.pm).toBe(character.pmMax);
    });
  });

  // ===========================
  // Talent Ranks
  // ===========================

  describe('unlockTalentRank', () => {
    test("unlocks first rank", () => {
      const character = createCompleteCharacter();
      character.setTalentPoints(1);

      character.unlockTalentRank("voie_protection", 1);

      expect(character.talentProgress.length).toBe(1);
      expect(character.talentProgress[0].voieId).toBe("voie_protection");
      expect(character.talentProgress[0].rank).toBe(1);
      expect(character.talentPoints).toBe(0);
    });

    test("throws without talent points", () => {
      const character = createCompleteCharacter();

      expect(() => {
        character.unlockTalentRank("voie_protection", 1);
      }).toThrow("No talent points available");
    });

    test("throws if not starting at rank 1", () => {
      const character = createCompleteCharacter();
      character.setTalentPoints(1);

      expect(() => {
        character.unlockTalentRank("voie_protection", 2);
      }).toThrow("Must start at rank 1 for a new voie");
    });
  });

  // ===========================
  // Inventory
  // ===========================

  describe('inventory', () => {
    test("addInventoryItem - adds new item", () => {
      const character = createCompleteCharacter();

      character.addInventoryItem({
        name: "Sword",
        definitionId: "sword-basic",
        qty: 1,
        equipped: false,
      });

      expect(character.inventory.length).toBe(1);
      expect(character.inventory[0].name).toBe("Sword");
    });

    test("addInventoryItem - stacks existing items", () => {
      const character = createCompleteCharacter();

      character.addInventoryItem({
        name: "Potion",
        definitionId: "potion-health",
        qty: 1,
        equipped: false,
      });

      character.addInventoryItem({
        name: "Potion",
        definitionId: "potion-health",
        qty: 2,
        equipped: false,
      });

      expect(character.inventory.length).toBe(1);
      expect(character.inventory[0].qty).toBe(3);
    });

    test("removeInventoryItem - removes item", () => {
      const character = createCompleteCharacter();
      character.addInventoryItem({
        name: "Sword",
        definitionId: "sword-basic",
        qty: 1,
        equipped: false,
      });

      character.removeInventoryItem("sword-basic");

      expect(character.inventory.length).toBe(0);
    });

    test("equipItem - equips item", () => {
      const character = createCompleteCharacter();
      character.addInventoryItem({
        name: "Sword",
        definitionId: "sword-basic",
        qty: 1,
        equipped: false,
      });

      character.equipItem("sword-basic");

      expect(character.inventory[0].equipped).toBe(true);
    });
  });

  // ===========================
  // Aptitudes
  // ===========================

  describe('aptitudes', () => {
    test("addAptitude - adds aptitude", () => {
      const character = createCompleteCharacter();

      character.addAptitude("apt-fireball");

      expect(character.aptitudes.length).toBe(1);
      expect(character.aptitudes[0].aptitudeId).toBe("apt-fireball");
      expect(character.aptitudes[0].currentCooldown).toBe(0);
    });

    test("addAptitude - throws if already learned", () => {
      const character = createCompleteCharacter();
      character.addAptitude("apt-fireball");

      expect(() => {
        character.addAptitude("apt-fireball");
      }).toThrow("Aptitude already learned");
    });

    test("removeAptitude - removes aptitude", () => {
      const character = createCompleteCharacter();
      character.addAptitude("apt-fireball");

      character.removeAptitude("apt-fireball");

      expect(character.aptitudes.length).toBe(0);
    });
  });
});

// ===========================
// Helper Functions
// ===========================

function createCompleteCharacter(): CharacterEntity {
  const character = CharacterEntity.createDraft({
    characterId: "test-id",
    userId: "user-123",
  });

  const stats = new CharacterStats({
    vigor: 4,
    finesse: 2,
    mind: 2,
    survival: 2,
  });

  character.completeDraft({
    name: "Test Hero",
    className: "guerrier",
    raceId: "humain",
    stats,
  });

  return character;
}
