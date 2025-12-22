import test from "ava";
import { CharacterEntity } from "../../../src/domain/character/entities/CharacterEntity.js";
import { CharacterStatsVO } from "../../../src/domain/character/value-objects/CharacterStatsVO.js";

// ===========================
// Factory Methods
// ===========================

test("CharacterEntity.createDraft - creates draft character", t => {
  const character = CharacterEntity.createDraft({
    characterId: "test-id",
    userId: "user-123",
  });

  t.is(character.id, "test-id");
  t.is(character.userId, "user-123");
  t.is(character.state, "draft");
  t.true(character.isDraft);
  t.false(character.isComplete);
  t.is(character.level, 1);
  t.is(character.totalXp, 0);
  t.is(character.inspirationPoints, 1);
  t.is(character.talentPoints, 0);
  t.false(character.isDeceased);
});

test("CharacterEntity.createDraft - creates with default resources", t => {
  const character = CharacterEntity.createDraft({
    characterId: "test-id",
  });

  t.is(character.hp, 10);
  t.is(character.hpMax, 10);
  t.is(character.pa, 6);
  t.is(character.paMax, 6);
  t.is(character.pm, 4);
  t.is(character.pmMax, 4);
});

// ===========================
// Complete Draft
// ===========================

test("CharacterEntity.completeDraft - completes draft successfully", t => {
  const character = CharacterEntity.createDraft({
    characterId: "test-id",
  });

  const stats = new CharacterStatsVO({
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

  t.is(character.state, "created");
  t.is(character.name, "Test Hero");
  t.is(character.className, "guerrier");
  t.is(character.raceId, "humain");
  t.truthy(character.stats);
  t.is(character.stats?.vigor, 4);
});

test("CharacterEntity.completeDraft - throws if not draft", t => {
  const character = CharacterEntity.createDraft({
    characterId: "test-id",
  });

  const stats = new CharacterStatsVO({
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

  t.throws(() => {
    character.completeDraft({
      name: "Test Hero 2",
      className: "rogue",
      raceId: "nain",
      stats,
    });
  }, { message: "Can only complete a draft character" });
});

// ===========================
// Level Up
// ===========================

test("CharacterEntity.levelUp - increases level and grants talent point", t => {
  const character = createCompleteCharacter();

  const initialLevel = character.level;
  const initialTalentPoints = character.talentPoints;

  character.levelUp();

  t.is(character.level, initialLevel + 1);
  t.is(character.talentPoints, initialTalentPoints + 1);
});

test("CharacterEntity.levelUp - throws if not complete", t => {
  const character = CharacterEntity.createDraft({
    characterId: "test-id",
  });

  t.throws(() => {
    character.levelUp();
  }, { message: "Cannot level up a draft character" });
});

// ===========================
// Damage and Healing
// ===========================

test("CharacterEntity.takeDamage - reduces HP", t => {
  const character = createCompleteCharacter();
  const initialHp = character.hp;

  character.takeDamage(5);

  t.is(character.hp, initialHp - 5);
});

test("CharacterEntity.takeDamage - marks as deceased when HP reaches 0", t => {
  const character = createCompleteCharacter();

  character.takeDamage(character.hp);

  t.true(character.isDeceased);
  t.truthy(character.diedAt);
});

test("CharacterEntity.takeDamage - throws on negative damage", t => {
  const character = createCompleteCharacter();

  t.throws(() => {
    character.takeDamage(-5);
  }, { message: "Damage cannot be negative" });
});

test("CharacterEntity.heal - increases HP capped at max", t => {
  const character = createCompleteCharacter();
  character.takeDamage(10);
  const afterDamageHp = character.hp;

  character.heal(5);

  t.is(character.hp, afterDamageHp + 5);
});

test("CharacterEntity.heal - does not exceed max HP", t => {
  const character = createCompleteCharacter();
  character.takeDamage(5);

  character.heal(100);

  t.is(character.hp, character.hpMax);
});

// ===========================
// Experience
// ===========================

test("CharacterEntity.addExperience - adds XP", t => {
  const character = createCompleteCharacter();
  const initialXp = character.totalXp;

  const result = character.addExperience(50);

  t.is(character.totalXp, initialXp + 50);
  t.false(result.leveledUp);
});

test("CharacterEntity.addExperience - throws on negative XP", t => {
  const character = createCompleteCharacter();

  t.throws(() => {
    character.addExperience(-10);
  }, { message: "XP amount cannot be negative" });
});

// ===========================
// Action Points
// ===========================

test("CharacterEntity.spendActionPoints - spends PA", t => {
  const character = createCompleteCharacter();
  const initialPa = character.pa;

  character.spendActionPoints(2);

  t.is(character.pa, initialPa - 2);
});

test("CharacterEntity.spendActionPoints - throws on insufficient PA", t => {
  const character = createCompleteCharacter();

  t.throws(() => {
    character.spendActionPoints(character.pa + 1);
  }, { message: "Insufficient resources" });
});

test("CharacterEntity.spendMovementPoints - spends PM", t => {
  const character = createCompleteCharacter();
  const initialPm = character.pm;

  character.spendMovementPoints(2);

  t.is(character.pm, initialPm - 2);
});

test("CharacterEntity.restoreResources - restores PA and PM", t => {
  const character = createCompleteCharacter();
  character.spendActionPoints(3);
  character.spendMovementPoints(2);

  character.restoreResources();

  t.is(character.pa, character.paMax);
  t.is(character.pm, character.pmMax);
});

// ===========================
// Talent Ranks
// ===========================

test("CharacterEntity.unlockTalentRank - unlocks first rank", t => {
  const character = createCompleteCharacter();
  character.setTalentPoints(1);

  character.unlockTalentRank("voie_protection", 1);

  t.is(character.unlockedRanks.length, 1);
  t.is(character.unlockedRanks[0].voieId, "voie_protection");
  t.is(character.unlockedRanks[0].rank, 1);
  t.is(character.talentPoints, 0);
});

test("CharacterEntity.unlockTalentRank - throws without talent points", t => {
  const character = createCompleteCharacter();

  t.throws(() => {
    character.unlockTalentRank("voie_protection", 1);
  }, { message: "No talent points available" });
});

test("CharacterEntity.unlockTalentRank - throws if not starting at rank 1", t => {
  const character = createCompleteCharacter();
  character.setTalentPoints(1);

  t.throws(() => {
    character.unlockTalentRank("voie_protection", 2);
  }, { message: "Must start at rank 1 for a new voie" });
});

// ===========================
// Inventory
// ===========================

test("CharacterEntity.addInventoryItem - adds new item", t => {
  const character = createCompleteCharacter();

  character.addInventoryItem({
    _id: "item-1",
    name: "Sword",
    definitionId: "sword-basic",
    qty: 1,
    equipped: false,
  });

  t.is(character.inventory.length, 1);
  t.is(character.inventory[0].name, "Sword");
});

test("CharacterEntity.addInventoryItem - stacks existing items", t => {
  const character = createCompleteCharacter();

  character.addInventoryItem({
    _id: "item-1",
    name: "Potion",
    definitionId: "potion-health",
    qty: 1,
    equipped: false,
  });

  character.addInventoryItem({
    _id: "item-2",
    name: "Potion",
    definitionId: "potion-health",
    qty: 2,
    equipped: false,
  });

  t.is(character.inventory.length, 1);
  t.is(character.inventory[0].qty, 3);
});

test("CharacterEntity.removeInventoryItem - removes item", t => {
  const character = createCompleteCharacter();
  character.addInventoryItem({
    _id: "item-1",
    name: "Sword",
    definitionId: "sword-basic",
    qty: 1,
    equipped: false,
  });

  character.removeInventoryItem("sword-basic");

  t.is(character.inventory.length, 0);
});

test("CharacterEntity.equipItem - equips item", t => {
  const character = createCompleteCharacter();
  character.addInventoryItem({
    _id: "item-1",
    name: "Sword",
    definitionId: "sword-basic",
    qty: 1,
    equipped: false,
  });

  character.equipItem("sword-basic");

  t.true(character.inventory[0].equipped);
});

// ===========================
// Aptitudes
// ===========================

test("CharacterEntity.addAptitude - adds aptitude", t => {
  const character = createCompleteCharacter();

  character.addAptitude("apt-fireball");

  t.is(character.aptitudes.length, 1);
  t.is(character.aptitudes[0].aptitudeId, "apt-fireball");
  t.is(character.aptitudes[0].currentCooldown, 0);
});

test("CharacterEntity.addAptitude - throws if already learned", t => {
  const character = createCompleteCharacter();
  character.addAptitude("apt-fireball");

  t.throws(() => {
    character.addAptitude("apt-fireball");
  }, { message: "Aptitude already learned" });
});

test("CharacterEntity.removeAptitude - removes aptitude", t => {
  const character = createCompleteCharacter();
  character.addAptitude("apt-fireball");

  character.removeAptitude("apt-fireball");

  t.is(character.aptitudes.length, 0);
});

// ===========================
// Helper Functions
// ===========================

function createCompleteCharacter(): CharacterEntity {
  const character = CharacterEntity.createDraft({
    characterId: "test-id",
    userId: "user-123",
  });

  const stats = new CharacterStatsVO({
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
