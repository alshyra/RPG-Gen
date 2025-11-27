import test from 'ava';
import { parseGameResponse } from '../src/external/game-parser.util.js';

test('should extract roll instruction from narrative text', (t) => {
  const input = `Tu inspires profondément et te laisses glisser sous la surface froide. 
    L'eau te glace les bones, mais tu avances silencieusement, te propulsant avec tes mains et tes pieds. 
    Ta vision est trouble, mais tu aperçois la rive à quelques mètres. Avant de pouvoir atteindre la rive, 
    tu sens une douleur vive à la jambe. Tu te retournes instinctivement et aperçois une forme sombre et sinueuse 
    qui s'éloigne dans les profondeurs. Tu comprends que tu as été mordu par quelque chose. 
    La panique te gagne alors que le sang se répand dans l'eau. Que fais-tu ?

    \`\`\`json {"roll": {"dices": "1d20", "modifier": "constitution"}} \`\`\``;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].roll);
  t.is(result.instructions[0].roll?.dices, '1d20');
  t.is(result.instructions[0].roll?.modifier, 'constitution');
});

test('should extract multiple instructions', (t) => {
  const input = `Vous êtes blessés. {"hp": -5} Vous gagnez aussi de l'expérience. {"xp": 100}`;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 2);
  t.is(result.instructions[0].hp, -5);
  t.is(result.instructions[1].xp, 100);
});

test('should handle nested objects in roll description', (t) => {
  const input = `You need to roll. {"roll": {"dices": "2d6", "modifier": "strength", "description": "A roll with modifier"}}`;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.is(result.instructions[0].roll?.dices, '2d6');
  t.is(result.instructions[0].roll?.modifier, 'strength');
  t.is(result.instructions[0].roll?.description, 'A roll with modifier');
});

test('should ignore malformed JSON', (t) => {
  const input = `Some text with broken {json: here} and valid {"xp": 50}`;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.is(result.instructions[0].xp, 50);
});

test('should extract JSON with actual newlines in markdown code block', (t) => {
  const input = `Tu quittes l'auberge et te fonds dans la nuit.
\`\`\`json
{
"roll": {"dices": "1d20", "modifier": "dexterity"}
}
\`\`\`
La rue est sombre.`;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].roll);
  t.is(result.instructions[0].roll?.dices, '1d20');
  t.is(result.instructions[0].roll?.modifier, 'dexterity');
});

test('should extract JSON with escaped newlines (\\n)', (t) => {
  const input = 'Tu quittes l\'auberge.\\n\\n```json\\n{\\n"roll": {"dices": "1d20", "modifier": "dexterity"}\\n}\\n```\\n\\nLa rue est sombre.';

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].roll);
  t.is(result.instructions[0].roll?.dices, '1d20');
  t.is(result.instructions[0].roll?.modifier, 'dexterity');
});

test('should normalize localized modifier strings (French) to canonical form', (t) => {
  const input = 'Un monstre apparaît. {"roll": {"dices": "1d20", "modifier": "Sagesse (Perception)"}} Que fais-tu ?';

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].roll);
  t.is(result.instructions[0].roll?.dices, '1d20');
  // Modifier should be normalized to the skill name only
  t.is(result.instructions[0].roll?.modifier, 'Perception');
});
test('should handle complex narrative with multiple paragraphs and JSON', (t) => {
  const input = `Tu quittes l'auberge et te fonds dans la nuit parisienne. La rue Saint-Denis est un dédale de ruelles étroites et sombres, éclairées par de rares lanternes tremblotantes. L'air est lourd de l'odeur de la misère et de la débauche. Tu te faufiles entre les prostituées racoleuses, les ivrognes titubants et les mendiants faméliques.

Le "Cabaret de l'Enfer" se dresse devant toi, une façade lugubre ornée de gargouilles grimaçantes et d'une porte en forme de gueule béante. Une faible lumière rouge filtre à travers les fenêtres occultées. Le bruit de musiques discordantes et de rires gras s'échappe du bâtiment.

Pour observer les allées et venues discrètement, tu dois trouver une position avantageuse et ne pas te faire remarquer. Fais un jet de Discrétion.

\`\`\`json
{
"roll": {"dices": "1d20", "modifier": "dexterity"}
}
\`\`\``;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].roll);
  t.is(result.instructions[0].roll?.dices, '1d20');
  t.is(result.instructions[0].roll?.modifier, 'dexterity');
});

test('should extract spell instruction (learn)', (t) => {
  const input = `Tu apprends un nouveau sort puissant.
  
  \`\`\`json
  {"spell": {"action": "learn", "name": "Boule de feu", "level": 3, "school": "Évocation"}}
  \`\`\``;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].spell);
  t.is(result.instructions[0].spell?.action, 'learn');
  t.is(result.instructions[0].spell?.name, 'Boule de feu');
  t.is(result.instructions[0].spell?.level, 3);
  t.is(result.instructions[0].spell?.school, 'Évocation');
});

test('should extract spell instruction (cast)', (t) => {
  const input = `Tu lances le sort avec succès! {"spell": {"action": "cast", "name": "Boule de feu"}}`;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].spell);
  t.is(result.instructions[0].spell?.action, 'cast');
  t.is(result.instructions[0].spell?.name, 'Boule de feu');
});

test('should extract inventory instruction (add)', (t) => {
  const input = `Tu trouves une potion dans le coffre.
  
  \`\`\`json
  {"inventory": {"action": "add", "name": "Potion de soin", "quantity": 1, "description": "Restaure 2d4+2 PV"}}
  \`\`\``;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].inventory);
  t.is(result.instructions[0].inventory?.action, 'add');
  t.is(result.instructions[0].inventory?.name, 'Potion de soin');
  t.is(result.instructions[0].inventory?.quantity, 1);
});

test('should extract inventory instruction (use)', (t) => {
  const input = `Tu bois la potion et te sens mieux. {"inventory": {"action": "use", "name": "Potion de soin"}}`;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].inventory);
  t.is(result.instructions[0].inventory?.action, 'use');
  t.is(result.instructions[0].inventory?.name, 'Potion de soin');
});

test('should extract multiple mixed instructions', (t) => {
  const input = `Tu defeats the goblin and finds treasure! {"xp": 50} {"inventory": {"action": "add", "name": "Gold coins", "quantity": 25}} {"spell": {"action": "learn", "name": "Magic Missile", "level": 1}}`;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 3);
  t.is(result.instructions[0].xp, 50);
  t.is(result.instructions[1].inventory?.action, 'add');
  t.is(result.instructions[1].inventory?.name, 'Gold coins');
  t.is(result.instructions[1].inventory?.quantity, 25);
  t.is(result.instructions[2].spell?.action, 'learn');
  t.is(result.instructions[2].spell?.name, 'Magic Missile');
  t.is(result.instructions[2].spell?.level, 1);
});

test('should extract combat_start instruction', (t) => {
  const input = `Un groupe de gobelins vous attaque!

  \`\`\`json
  {"combat_start": [{"name": "Goblin 1", "hp": 7, "ac": 13}, {"name": "Goblin 2", "hp": 7, "ac": 13}]}
  \`\`\``;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].combat_start);
  t.is(result.instructions[0].combat_start.length, 2);
  t.is(result.instructions[0].combat_start[0].name, 'Goblin 1');
  t.is(result.instructions[0].combat_start[0].hp, 7);
  t.is(result.instructions[0].combat_start[0].ac, 13);
  t.is(result.instructions[0].combat_start[1].name, 'Goblin 2');
});

test('should extract combat_end instruction', (t) => {
  const input = `Victoire! {"combat_end": {"victory": true, "xp_gained": 100, "player_hp": 15, "enemies_defeated": ["Goblin 1", "Goblin 2"]}}`;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].combat_end);
  t.is(result.instructions[0].combat_end.victory, true);
  t.is(result.instructions[0].combat_end.xp_gained, 100);
  t.is(result.instructions[0].combat_end.player_hp, 15);
  t.deepEqual(result.instructions[0].combat_end.enemies_defeated, [
    'Goblin 1',
    'Goblin 2',
  ]);
});

test('should extract combat_start with attack stats', (t) => {
  const input = `Un orc furieux vous barre la route!
  {"combat_start": [{"name": "Orc", "hp": 15, "ac": 13, "attack_bonus": 5, "damage_dice": "1d12", "damage_bonus": 3}]}`;

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].combat_start);
  const orc = result.instructions[0].combat_start[0];
  t.is(orc.name, 'Orc');
  t.is(orc.hp, 15);
  t.is(orc.ac, 13);
  t.is(orc.attack_bonus, 5);
  t.is(orc.damage_dice, '1d12');
  t.is(orc.damage_bonus, 3);
});
