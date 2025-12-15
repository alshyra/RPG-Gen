export default {
  _id: {
    $oid: '693ea9264be1d9f72ec94e7c',
  },
  userId: {
    $oid: '691779c7757aa68db1bde87f',
  },
  characterId: '09987fba-4ae5-4c1c-ba7b-c338524f3141',
  messages: [
    {
      role: 'assistant',
      narrative:
        "Le sol froid et rocailleux se fait sentir sous tes pieds alors que tu es poussée dans une arène rudimentaire. Des torches vacillantes éclairent faiblement les murs de pierre, révélant des marques de griffes et des taches sombres. Une odeur âcre de terre et de sang flotte dans l'air. Au centre de l'arène, un gobelin chétif, armé d'une dague rouillée, te fait face avec un sourire édenté et menaçant. Le combat est inévitable.",
      instructions: [
        {
          type: 'combat_start',
          combat_start: [
            {
              name: 'Goblin-1',
              hp: 7,
              ac: 10,
              attack_bonus: 0,
              damage_dice: '1d4',
              damage_bonus: 0,
            },
          ],
        },
      ],
    },
  ],
  lastUpdated: {
    $date: '2025-12-14T12:10:14.049Z',
  },
  createdAt: {
    $date: '2025-12-14T12:10:14.056Z',
  },
  updatedAt: {
    $date: '2025-12-14T12:10:14.056Z',
  },
  __v: 0,
};
