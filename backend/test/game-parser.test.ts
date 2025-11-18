import test from 'ava';
import { parseGameResponse } from '../src/external/game-parser.util';

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
  
  // Narrative should not contain the JSON block
  t.false(result.narrative.includes('```json'));
  t.false(result.narrative.includes('{"roll"'));
  t.true(result.narrative.includes('Tu inspires profondément'));
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

test('should clean whitespace from narrative', (t) => {
  const input = `Text   with    multiple     spaces {"roll": {"dices": "1d20"}}   more    text`;

  const result = parseGameResponse(input);

  t.is(result.narrative, 'Text with multiple spaces more text');
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
  
  // Narrative should be clean
  t.true(result.narrative.includes('Tu quittes'));
  t.true(result.narrative.includes('La rue est sombre'));
  t.false(result.narrative.includes('```'));
});

test('should extract JSON with escaped newlines (\\n)', (t) => {
  const input = 'Tu quittes l\'auberge.\\n\\n```json\\n{\\n"roll": {"dices": "1d20", "modifier": "dexterity"}\\n}\\n```\\n\\nLa rue est sombre.';

  const result = parseGameResponse(input);

  t.is(result.instructions.length, 1);
  t.truthy(result.instructions[0].roll);
  t.is(result.instructions[0].roll?.dices, '1d20');
  t.is(result.instructions[0].roll?.modifier, 'dexterity');
  
  // Narrative should be clean
  t.false(result.narrative.includes('```'));
  t.false(result.narrative.includes('roll'));
  t.false(result.narrative.includes('{'));
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
  
  // Narrative should contain the story but not the JSON
  t.true(result.narrative.includes('Tu quittes l\'auberge'));
  t.true(result.narrative.includes('Cabaret'));
  t.true(result.narrative.includes('Discrétion'));
  t.false(result.narrative.includes('```'));
  t.false(result.narrative.includes('"roll"'));
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
  
  // Narrative should not contain the JSON block
  t.false(result.narrative.includes('```json'));
  t.false(result.narrative.includes('{"spell"'));
  t.true(result.narrative.includes('Tu apprends'));
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
  
  // Narrative should not contain the JSON block
  t.false(result.narrative.includes('```json'));
  t.false(result.narrative.includes('{"inventory"'));
  t.true(result.narrative.includes('Tu trouves'));
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
