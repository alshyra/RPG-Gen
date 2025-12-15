import test from "ava";
import { LevelUpService } from "../../src/domain/character/levelup.service.js";

function makeMockCharacterService(initialCharacter) {
  return {
    findByCharacterId: async () => initialCharacter,
    update: async (_userId, _characterId, updates) => Object.assign(initialCharacter, updates),
    toCharacterDto: char => char, // Mock toCharacterDto to return the character as-is
  };
}

function makeMockSpellDefService(spellsByLevel) {
  return {
    findByLevel: async level => spellsByLevel[level] || [],
    findByDefinitionId: async id => {
      const all: any[] = (Object.values(spellsByLevel) as any[]).reduce(
        (acc: any[], cur) => acc.concat(cur || []),
        [],
      );
      const found = all.find(s => s.definitionId === id);
      return found ?? null;
    },
    findByName: async () => null,
  };
}

test("getOptionsForClass returns next level and available spells", async t => {
  const character = {
    characterId: "c1",
    classes: [
      {
        name: "Wizard",
        level: 1,
      },
    ],
    spells: [],
    scores: {
      Str: 12,
      Dex: 12,
      Con: 12,
      Int: 14,
      Wis: 10,
      Cha: 8,
    },
    proficiency: 2,
  };

  const spellDefs = {
    2: [
      {
        name: "Magic Missile",
        level: 2,
        definitionId: "spell-2-magic-missile",
      },
    ],
  };

  const mockCharService = makeMockCharacterService(character);
  const mockSpellService = makeMockSpellDefService(spellDefs);

  const service = new LevelUpService(mockCharService as any, mockSpellService as any);

  const options = await service.getOptionsForClass(character as any, "Wizard");

  t.is(options.currentLevel, 1);
  t.is(options.nextLevel, 2);
  t.truthy(Array.isArray(options.unlockedSpells));
  t.is(options.unlockedSpells.length, 1);
  t.is(options.unlockedSpells[0].name, "Magic Missile");
});

test("applyLevelUp increments class level and adds spells and ASI", async t => {
  const character = {
    characterId: "c2",
    classes: [
      {
        name: "Cleric",
        level: 1,
      },
    ],
    spells: [],
    scores: {
      Str: 10,
      Dex: 10,
      Con: 10,
      Int: 10,
      Wis: 12,
      Cha: 10,
    },
    proficiency: 2,
    userId: "u1",
  };

  const spellDefs = {
    2: [
      {
        name: "Healing Word",
        level: 2,
        definitionId: "spell-2-healing-word",
      },
    ],
  };

  const mockCharService = makeMockCharacterService(character);
  const mockSpellService = makeMockSpellDefService(spellDefs);
  const service = new LevelUpService(mockCharService as any, mockSpellService as any);

  const updated = await service.applyLevelUp("u1", "c2", "Cleric", {
    newSpellIds: ["spell-2-healing-word"],
    abilityIncreases: [
      {
        ability: "Wis",
        inc: 1,
      },
    ],
  });

  t.is(updated.classes?.[0].level, 2);
  t.truthy(updated.spells && updated.spells.find(s => s.definitionId === "spell-2-healing-word"));
  t.truthy(updated.scores);
  t.is(updated.scores!.Wis, 13);
});
