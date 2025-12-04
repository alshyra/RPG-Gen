// GENERATED FROM OpenAPI spec - do not edit manually

export interface paths {
  '/api/auth/google': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Initiate Google OAuth login */
    get: operations['AuthController_googleAuth'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/google/callback': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Google OAuth callback */
    get: operations['AuthController_googleAuthRedirect'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/profile': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get current user profile */
    get: operations['AuthController_getProfile'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/logout': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Logout (client should clear token) */
    get: operations['AuthController_logout'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/chat/{characterId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Send prompt to Gemini (chat) */
    post: operations['ChatController_chat'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/chat/{characterId}/history': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get conversation history for a character */
    get: operations['ChatController_getHistory'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/characters': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get all characters for the current user */
    get: operations['CharacterController_findAll'];
    put?: never;
    /** Create a new character */
    post: operations['CharacterController_create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/characters/deceased': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get all deceased characters */
    get: operations['CharacterController_getDeceased'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/characters/{characterId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get a specific character by ID */
    get: operations['CharacterController_findOne'];
    /** Update a character */
    put: operations['CharacterController_update'];
    post?: never;
    /** Delete a character */
    delete: operations['CharacterController_delete'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/characters/{characterId}/kill': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Mark a character as deceased */
    post: operations['CharacterController_kill'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/characters/{characterId}/inventory': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Add an item to character's inventory */
    post: operations['CharacterController_addInventory'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/characters/{characterId}/inventory/equip': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Equip an item by definitionId (weapon only) */
    post: operations['CharacterController_equipInventory'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/characters/{characterId}/inventory/{itemId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /** Remove an item from character's inventory */
    delete: operations['CharacterController_removeInventory'];
    options?: never;
    head?: never;
    /** Update an item in character's inventory */
    patch: operations['CharacterController_updateInventory'];
    trace?: never;
  };
  '/api/characters/{characterId}/inspiration/grant': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Grant inspiration point(s) to a character */
    post: operations['CharacterController_grantInspiration'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/characters/{characterId}/inspiration/spend': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Spend an inspiration point */
    post: operations['CharacterController_spendInspiration'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/combat/{characterId}/start': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Initialize combat with enemies */
    post: operations['CombatController_startCombat'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/combat/{characterId}/attack': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Execute player attack in combat, determine if player hit his target */
    post: operations['CombatController_attack'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/combat/{characterId}/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get current combat status */
    get: operations['CombatController_getStatus'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/combat/{characterId}/end-turn': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** End current player activation and advance turn (triggers enemy actions) */
    post: operations['CombatController_endTurn'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/combat/{characterId}/flee': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Force end current combat (flee) */
    post: operations['CombatController_flee'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/dice': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Roll dice expression like 1d6+2, optionally with advantage/disadvantage for d20 */
    post: operations['DiceController_roll'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/image': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Generate image from prompt */
    post: operations['ImageController_generate'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/image/generate-avatar': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Generate character avatar from description */
    post: operations['ImageController_generateAvatar'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/health': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['HealthController_getHealth'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/rolls/{characterId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Submit resolved roll(s) (non-chat) for processing */
    post: operations['RollsController_submitRoll'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    AuthProfileDto: {
      /** @description Id de l'utilisateur */
      id: string;
      /** @description Email de l'utilisateur */
      email: string;
      /** @description Nom affiché de l'utilisateur */
      displayName: string;
      /** @description URL de la photo de profil de l'utilisateur */
      picture: string;
    };
    RollMetaDto: {
      /** @description Attack bonus to apply */
      attackBonus?: number;
      /** @description Target name */
      target?: string;
      /** @description Target armor class */
      targetAc?: number;
      /** @description Damage dice expression */
      damageDice?: string;
      /** @description Damage bonus to apply */
      damageBonus?: number;
      /** @description Action type (e.g., attack, damage) */
      action?: string;
    };
    RollInstructionMessageDto: {
      /**
             * @description Instruction type
             * @enum {string}
             */
      type: 'roll';
      /** @description Dice expression (e.g., 1d20+5) */
      dices: string;
      /** @description Semantic modifier label (e.g., "wisdom (Perception)") */
      modifierLabel?: string;
      /** @description Numeric modifier to apply to the roll (e.g., +3) */
      modifierValue?: number;
      /** @description Roll description */
      description?: string;
      /**
             * @description Advantage type
             * @enum {string}
             */
      advantage?: 'advantage' | 'disadvantage' | 'none';
      /** @description Optional metadata for combat rolls */
      meta?: components['schemas']['RollMetaDto'];
    };
    HpInstructionMessageDto: {
      /**
             * @description Instruction type
             * @enum {string}
             */
      type: 'hp';
      /** @description Amount of HP change */
      hp: number;
    };
    XpInstructionMessageDto: {
      /**
             * @description Instruction type
             * @enum {string}
             */
      type: 'xp';
      /** @description Amount of XP gained */
      xp: number;
    };
    SpellInstructionMessageDto: {
      /**
             * @description Instruction type
             * @enum {string}
             */
      type: 'spell';
      /**
             * @description Spell action
             * @enum {string}
             */
      action: 'learn' | 'cast' | 'forget';
      /** @description Spell name */
      name: string;
      /** @description Spell level */
      level?: number;
      /** @description Spell school */
      school?: string;
      /** @description Spell description */
      description?: string;
    };
    InventoryInstructionMessageDto: {
      /**
             * @description Instruction type
             * @enum {string}
             */
      type: 'inventory';
      /**
             * @description Inventory action
             * @enum {string}
             */
      action: 'add' | 'remove' | 'use';
      /** @description Item name */
      name: string;
      /** @description Quantity */
      quantity?: number;
      /** @description Item description */
      description?: string;
    };
    CombatStartEntryDto: {
      /** @description Enemy name */
      name: string;
      /** @description Enemy HP */
      hp: number;
      /** @description Enemy AC */
      ac: number;
      /** @description Attack bonus (optional) */
      attack_bonus?: number;
      /** @description Damage dice (optional) */
      damage_dice?: string;
      /** @description Damage bonus (optional) */
      damage_bonus?: number;
    };
    CombatStartInstructionMessageDto: {
      /**
             * @description Instruction type
             * @enum {string}
             */
      type: 'combat_start';
      /** @description Combat start entries */
      combat_start: components['schemas']['CombatStartEntryDto'][];
    };
    ChatMessageDto: {
      /**
             * @description Message role
             * @enum {string}
             */
      role: 'user' | 'assistant' | 'system';
      /** @description Narrative text (for assistant messages) */
      narrative: string;
      /** @description Game instructions (for assistant messages) */
      instructions?: (components['schemas']['RollInstructionMessageDto'] | components['schemas']['HpInstructionMessageDto'] | components['schemas']['XpInstructionMessageDto'] | components['schemas']['SpellInstructionMessageDto'] | components['schemas']['InventoryInstructionMessageDto'] | components['schemas']['CombatStartInstructionMessageDto'])[];
    };
    CreateCharacterBodyDto: {
      /** @description Game world (e.g., dnd, vtm) */
      world: string;
    };
    RaceResponseDto: {
      /** @description Race ID */
      id?: string;
      /** @description Race name */
      name?: string;
      /** @description Ability score modifiers */
      mods: Record<string, number>;
    };
    AbilityScoresResponseDto: {
      /** @description Strength score */
      Str?: number;
      /** @description Dexterity score */
      Dex?: number;
      /** @description Constitution score */
      Con?: number;
      /** @description Intelligence score */
      Int?: number;
      /** @description Wisdom score */
      Wis?: number;
      /** @description Charisma score */
      Cha?: number;
    };
    CharacterClassResponseDto: {
      /** @description Class name */
      name?: string;
      /** @description Class level */
      level?: number;
    };
    SkillResponseDto: {
      /** @description Skill name */
      name?: string;
      /** @description Is proficient in this skill */
      proficient?: boolean;
      /** @description Skill modifier */
      modifier?: number;
    };
    InventoryItemDto: {
      /** @description Item ID */
      _id?: string;
      /** @description Definition ID */
      definitionId?: string;
      /** @description Item name */
      name?: string;
      /** @description Quantity */
      qty?: number;
      /** @description Item description */
      description?: string;
      /** @description Is equipped */
      equipped?: boolean;
      /** @description Arbitrary item meta */
      meta?: components['schemas']['WeaponMeta'] | components['schemas']['ArmorMeta'] | components['schemas']['ConsumableMeta'] | components['schemas']['PackMeta'] | components['schemas']['ToolMeta'];
    };
    SpellResponseDto: {
      /** @description Spell name */
      name: string;
      /** @description Spell level */
      level?: number;
      /** @description Spell description */
      description?: string;
      /** @description Spell metadata */
      meta?: Record<string, unknown>;
    };
    CharacterResponseDto: {
      /** @description Unique character ID (UUID) */
      characterId: string;
      /** @description Character name */
      name?: string;
      /** @description Physical description of the character */
      physicalDescription?: string;
      /** @description Character race */
      race?: components['schemas']['RaceResponseDto'];
      /** @description Ability scores */
      scores?: components['schemas']['AbilityScoresResponseDto'];
      /** @description Current hit points */
      hp?: number;
      /** @description Maximum hit points */
      hpMax?: number;
      /** @description Total experience points */
      totalXp?: number;
      /** @description Character classes */
      classes?: components['schemas']['CharacterClassResponseDto'][];
      /** @description Character skills */
      skills?: components['schemas']['SkillResponseDto'][];
      /** @description Game world (e.g., dnd, vtm) */
      world: string;
      /** @description Character portrait URL or base64 */
      portrait: string;
      /** @description Character gender */
      gender?: string;
      /** @description Proficiency bonus */
      proficiency?: number;
      /** @description Inspiration points */
      inspirationPoints?: number;
      /** @description Whether character is deceased */
      isDeceased: boolean;
      /** @description Date of death (ISO string) */
      diedAt?: string;
      /** @description Location where character died */
      deathLocation?: string;
      /**
             * @description Character state
             * @enum {string}
             */
      state: 'draft' | 'created';
      /** @description Character inventory */
      inventory?: components['schemas']['InventoryItemDto'][];
      /** @description Character spells */
      spells?: components['schemas']['SpellResponseDto'][];
    };
    DeceasedCharacterResponseDto: {
      /** @description Unique character ID (UUID) */
      characterId: string;
      /** @description Character name */
      name?: string;
      /** @description Physical description of the character */
      physicalDescription?: string;
      /** @description Character race */
      race?: components['schemas']['RaceResponseDto'];
      /** @description Ability scores */
      scores?: components['schemas']['AbilityScoresResponseDto'];
      /** @description Current hit points */
      hp?: number;
      /** @description Maximum hit points */
      hpMax?: number;
      /** @description Total experience points */
      totalXp?: number;
      /** @description Character classes */
      classes?: components['schemas']['CharacterClassResponseDto'][];
      /** @description Character skills */
      skills?: components['schemas']['SkillResponseDto'][];
      /** @description Game world (e.g., dnd, vtm) */
      world: string;
      /** @description Character portrait URL or base64 */
      portrait: string;
      /** @description Character gender */
      gender?: string;
      /** @description Proficiency bonus */
      proficiency?: number;
      /** @description Inspiration points */
      inspirationPoints?: number;
      /** @description Whether character is deceased */
      isDeceased: boolean;
      /** @description Date of death (ISO string) */
      diedAt?: string;
      /** @description Location where character died */
      deathLocation?: string;
      /**
             * @description Character state
             * @enum {string}
             */
      state: 'draft' | 'created';
      /** @description Character inventory */
      inventory?: components['schemas']['InventoryItemDto'][];
      /** @description Character spells */
      spells?: components['schemas']['SpellResponseDto'][];
    };
    UpdateCharacterRequestDto: {
      /** @description Character name */
      name?: string;
      /** @description Physical description of the character */
      physicalDescription?: string;
      /** @description Character race */
      race?: components['schemas']['RaceResponseDto'];
      /** @description Ability scores */
      scores?: components['schemas']['AbilityScoresResponseDto'];
      /** @description Current hit points */
      hp?: number;
      /** @description Maximum hit points */
      hpMax?: number;
      /** @description Total experience points */
      totalXp?: number;
      /** @description Character classes */
      classes?: components['schemas']['CharacterClassResponseDto'][];
      /** @description Character skills */
      skills?: components['schemas']['SkillResponseDto'][];
      /** @description Game world (e.g., dnd, vtm) */
      world?: string;
      /** @description Character portrait URL or base64 */
      portrait?: string;
      /** @description Character gender */
      gender?: string;
      /** @description Proficiency bonus */
      proficiency?: number;
      /** @description Inspiration points */
      inspirationPoints?: number;
      /**
             * @description Character state
             * @enum {string}
             */
      state?: 'draft' | 'created';
      /** @description Character inventory */
      inventory?: components['schemas']['InventoryItemDto'][];
      /** @description Character spells */
      spells?: components['schemas']['SpellResponseDto'][];
    };
    KillCharacterBodyDto: {
      /** @description Location where character died */
      deathLocation?: string;
    };
    WeaponMeta: {
      /**
             * @description Type discriminator for weapons
             * @enum {string}
             */
      type?: 'weapon';
      /** @description Item cost (gold pieces or formatted string) */
      cost?: Record<string, never>;
      /** @description Item weight in pounds */
      weight?: Record<string, never>;
      /** @description Whether this is a starter item */
      starter?: boolean;
      /** @description Weapon class (e.g., Simple Melee, Martial Ranged) */
      class?: string;
      /** @description Damage expression (e.g., 1d6 bludgeoning) */
      damage?: string;
      /** @description Weapon properties (e.g., Finesse, Thrown) */
      properties?: string[];
    };
    ArmorMeta: {
      /**
             * @description Type discriminator for armor
             * @enum {string}
             */
      type?: 'armor';
      /** @description Item cost (gold pieces or formatted string) */
      cost?: Record<string, never>;
      /** @description Item weight in pounds */
      weight?: Record<string, never>;
      /** @description Whether this is a starter item */
      starter?: boolean;
      /** @description Armor class (Light, Medium, Heavy, Shield) */
      class?: string;
      /** @description AC value (e.g., 11 + Dex modifier) */
      ac?: string;
      /** @description Strength requirement (e.g., Str 13) */
      strength?: string;
      /** @description Stealth effect (e.g., Disadvantage) */
      stealth?: string;
    };
    ConsumableMeta: {
      /**
             * @description Type discriminator for consumables
             * @enum {string}
             */
      type?: 'consumable';
      /** @description Item cost (gold pieces or formatted string) */
      cost?: Record<string, never>;
      /** @description Item weight in pounds */
      weight?: Record<string, never>;
      /** @description Whether this is a starter item */
      starter?: boolean;
      /** @description Whether the item can be used directly */
      usable?: boolean;
    };
    PackMeta: {
      /**
             * @description Type discriminator for packs
             * @enum {string}
             */
      type?: 'pack';
      /** @description Item cost (gold pieces or formatted string) */
      cost?: Record<string, never>;
      /** @description Item weight in pounds */
      weight?: Record<string, never>;
      /** @description Whether this is a starter item */
      starter?: boolean;
    };
    ToolMeta: {
      /**
             * @description Type discriminator for tools
             * @enum {string}
             */
      type?: 'tool';
      /** @description Item cost (gold pieces or formatted string) */
      cost?: Record<string, never>;
      /** @description Item weight in pounds */
      weight?: Record<string, never>;
      /** @description Whether this is a starter item */
      starter?: boolean;
    };
    GenericMeta: {
      /** @description Item type discriminator */
      type?: string;
      /** @description Item cost (gold pieces or formatted string) */
      cost?: Record<string, never>;
      /** @description Item weight in pounds */
      weight?: Record<string, never>;
      /** @description Whether this is a starter item */
      starter?: boolean;
    };
    CreateInventoryItemDto: {
      /** @description Inventory item id (UUID). If provided, attempt to merge with existing item */
      _id?: string;
      /** @description Canonical definition id for this item */
      definitionId: string;
      /** @description Name for this inventory item */
      name?: string;
      /** @description Quantity for this item */
      qty?: number;
      /** @description Item description / notes */
      description?: string;
      /** @description If true this item is equipped */
      equipped?: boolean;
      /** @description Arbitrary item meta */
      meta?: components['schemas']['WeaponMeta'] | components['schemas']['ArmorMeta'] | components['schemas']['ConsumableMeta'] | components['schemas']['PackMeta'] | components['schemas']['ToolMeta'] | components['schemas']['GenericMeta'];
    };
    EquipInventoryDto: {
      /**
             * @description Definition id of the item to equip
             * @example weapon-rapier
             */
      definitionId: string;
    };
    RemoveInventoryBodyDto: {
      /** @description Quantity to remove (-1 = remove all) */
      qty?: number;
    };
    GrantInspirationBodyDto: {
      /**
             * @description Amount of inspiration to grant (1-5)
             * @default 1
             */
      amount: number;
    };
    InspirationResponseDto: {
      /** @description Operation success status */
      ok: boolean;
      /** @description Updated inspiration points count */
      inspirationPoints: number;
      /** @description Updated character */
      character: components['schemas']['CharacterResponseDto'];
    };
    CombatStartRequestDto: {
      /** @description Array of enemies to initialize combat with */
      combat_start: components['schemas']['CombatStartEntryDto'][];
    };
    CombatantDto: {
      /** @description ID of the combatant (player character or enemy) */
      id: string;
      /** @description Combatant name */
      name: string;
      /** @description Initiative order value */
      initiative: number;
      /** @description Whether combatant is player character */
      isPlayer: boolean;
      /** @description Current hit points (enemies only) */
      hp?: number;
      /** @description Maximum hit points (enemies only) */
      hpMax?: number;
      /** @description Armor class (enemies only) */
      ac?: number;
      /** @description Enemy attack bonus (enemies only) */
      attackBonus?: number;
      /** @description Enemy damage dice expression (enemies only), e.g. "1d6" */
      damageDice?: string;
      /** @description Enemy damage bonus (enemies only) */
      damageBonus?: number;
    };
    CombatStateDto: {
      /** @description Character ID */
      characterId: string;
      /** @description Whether currently in combat */
      inCombat: boolean;
      /** @description Active enemies */
      enemies: components['schemas']['CombatantDto'][];
      /** @description Player state */
      player: components['schemas']['CombatantDto'];
      /** @description Turn order for combat */
      turnOrder: components['schemas']['CombatantDto'][];
      /** @description Index of current turn in turnOrder */
      currentTurnIndex: number;
      /** @description Current round number */
      roundNumber: number;
      /** @description Narrative summary of current combat */
      narrative?: string;
      /** @description Valid targets available to player */
      validTargets?: string[];
      /**
             * @description Current combat phase
             * @enum {string}
             */
      phase?: 'PLAYER_TURN' | 'AWAITING_DAMAGE_ROLL' | 'ENEMY_TURN' | 'COMBAT_ENDED';
      /** @description Action token for idempotent action submission */
      actionToken?: string;
      /** @description Expected DTO type for the next action (e.g., AttackRequestDto, DiceThrowDto) */
      expectedDto?: string;
      /** @description Remaining standard actions for current activation */
      actionRemaining?: number;
      /** @description Maximum standard actions per activation */
      actionMax?: number;
      /** @description Remaining bonus actions for current activation */
      bonusActionRemaining?: number;
      /** @description Maximum bonus actions per activation */
      bonusActionMax?: number;
    };
    AttackRequestDto: {
      /** @description Target ID to attack */
      targetId: string;
    };
    DiceResultDto: {
      /** @description Individual dice roll results */
      rolls: number[];
      /** @description Modifier applied to the total */
      modifierValue: number;
      /** @description Total result (sum of rolls + modifier) */
      total: number;
    };
    CombatDiceResultDto: {
      /** @description Individual dice roll results */
      rolls: number[];
      /** @description Modifier applied to the total */
      modifierValue: number;
      /** @description Total result (sum of rolls + modifier) */
      total: number;
      /** @description Total damage dealt by the roll */
      damageTotal?: number;
      /** @description Whether this damage roll was a critical hit */
      isCrit?: boolean;
    };
    AttackResponseDto: {
      /** @description Result of the hit roll for frontend display purposes. */
      diceResult?: components['schemas']['DiceResultDto'];
      /** @description Damage roll result (includes isCrit and damageTotal), present when an attack hits. */
      damageDiceResult?: components['schemas']['CombatDiceResultDto'];
      /** @description Total numeric damage applied to the target (includes damage bonus, doubled on crit if applicable). */
      damageTotal?: number;
      /** @description Whether the hit was a critical strike. */
      isCrit?: boolean;
      /** @description Returns the state of the combat */
      combatState: components['schemas']['CombatStateDto'];
    };
    CombatEndDto: {
      /** @description Victory state */
      victory: boolean;
      /** @description XP gained */
      xp_gained: number;
      /** @description Player's HP at the end */
      player_hp: number;
      /** @description Enemies that were defeated */
      enemies_defeated: string[];
      /** @description Flee indicator */
      fled?: boolean;
      /** @description Narrative summary */
      narrative: string;
    };
    CombatEndResultDto: {
      /** @description Combat end information */
      combat_end: components['schemas']['CombatEndDto'];
    };
    CombatEndResponseDto: {
      /** @description Whether the operation succeeded */
      success: boolean;
      /** @description Human readable message */
      message: string;
      /** @description Optional instructions returned after ending combat */
      instructions?: components['schemas']['CombatEndResultDto'][];
    };
    DiceRequestDto: {
      expr: string;
      advantage?: string;
    };
    ImageRequestDto: {
      /** @description API token (optional) */
      token?: string;
      /** @description Image prompt */
      prompt: string;
      /** @description Model to use */
      model?: string;
    };
    CharacterIdBodyDto: {
      /** @description UUID of the character */
      characterId: string;
    };
    AvatarResponseDto: {
      /** @description Generated avatar image URL or base64 data */
      imageUrl: string;
    };
    SubmitRollDto: {
      /** @description Resolved instructions array */
      instructions: components['schemas']['RollInstructionMessageDto'][];
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  AuthController_googleAuth: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  AuthController_googleAuthRedirect: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  AuthController_getProfile: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description List of characters */
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['AuthProfileDto'];
        };
      };
    };
  };
  AuthController_logout: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  ChatController_chat: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ChatMessageDto'];
      };
    };
    responses: {
      /** @description Chat message (assistant) with narrative and instructions */
      201: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['ChatMessageDto'];
        };
      };
      /** @description Invalid request */
      400: {
        headers: Record<string, unknown>;
        content?: never;
      };
      /** @description Chat processing failed */
      500: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  ChatController_getHistory: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Conversation history */
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['ChatMessageDto'][];
        };
      };
      /** @description Invalid request */
      400: {
        headers: Record<string, unknown>;
        content?: never;
      };
      /** @description History retrieval failed */
      500: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  CharacterController_findAll: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description List of characters */
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CharacterResponseDto'][];
        };
      };
    };
  };
  CharacterController_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateCharacterBodyDto'];
      };
    };
    responses: {
      /** @description Character created successfully */
      201: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CharacterResponseDto'];
        };
      };
    };
  };
  CharacterController_getDeceased: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description List of deceased characters */
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['DeceasedCharacterResponseDto'][];
        };
      };
    };
  };
  CharacterController_findOne: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Character found */
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CharacterResponseDto'];
        };
      };
      /** @description Character not found */
      404: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  CharacterController_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description ID of the character to update */
        characterId: string;
      };
      cookie?: never;
    };
    /** @description Fields to update */
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateCharacterRequestDto'];
      };
    };
    responses: {
      /** @description Character updated */
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CharacterResponseDto'];
        };
      };
      /** @description Character not found */
      404: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  CharacterController_delete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Character deleted */
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': Record<string, never>;
        };
      };
      /** @description Character not found */
      404: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  CharacterController_kill: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['KillCharacterBodyDto'];
      };
    };
    responses: {
      /** @description Character marked as deceased */
      201: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CharacterResponseDto'];
        };
      };
      /** @description Character not found */
      404: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  CharacterController_addInventory: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateInventoryItemDto'];
      };
    };
    responses: {
      /** @description Item added to inventory */
      201: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CharacterResponseDto'];
        };
      };
      /** @description Character not found */
      404: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  CharacterController_equipInventory: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['EquipInventoryDto'];
      };
    };
    responses: {
      /** @description Character updated with equipped item */
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CharacterResponseDto'];
        };
      };
    };
  };
  CharacterController_removeInventory: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
        itemId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RemoveInventoryBodyDto'];
      };
    };
    responses: {
      /** @description Item removed from inventory */
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CharacterResponseDto'];
        };
      };
      /** @description Character or item not found */
      404: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  CharacterController_updateInventory: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
        itemId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateInventoryItemDto'];
      };
    };
    responses: {
      /** @description Inventory item updated */
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CharacterResponseDto'];
        };
      };
      /** @description Character or item not found */
      404: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  CharacterController_grantInspiration: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['GrantInspirationBodyDto'];
      };
    };
    responses: {
      /** @description Inspiration granted */
      201: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['InspirationResponseDto'];
        };
      };
      /** @description Invalid amount */
      400: {
        headers: Record<string, unknown>;
        content?: never;
      };
      /** @description Character not found */
      404: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  CharacterController_spendInspiration: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Inspiration spent */
      201: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['InspirationResponseDto'];
        };
      };
      /** @description No inspiration points available */
      400: {
        headers: Record<string, unknown>;
        content?: never;
      };
      /** @description Character not found */
      404: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  CombatController_startCombat: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CombatStartRequestDto'];
      };
    };
    responses: {
      201: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CombatStateDto'];
        };
      };
    };
  };
  CombatController_attack: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AttackRequestDto'];
      };
    };
    responses: {
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['AttackResponseDto'];
        };
      };
    };
  };
  CombatController_getStatus: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CombatStateDto'];
        };
      };
    };
  };
  CombatController_endTurn: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Returns result of enemy actions and new player turn state */
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CombatStateDto'];
        };
      };
    };
  };
  CombatController_flee: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['CombatEndResponseDto'];
        };
      };
    };
  };
  DiceController_roll: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DiceRequestDto'];
      };
    };
    responses: {
      /** @description Dice throw result */
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['DiceResultDto'];
        };
      };
      /** @description Invalid dice expression */
      400: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  ImageController_generate: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ImageRequestDto'];
      };
    };
    responses: {
      /** @description Image generation not implemented */
      400: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  ImageController_generateAvatar: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CharacterIdBodyDto'];
      };
    };
    responses: {
      /** @description Avatar generated successfully */
      201: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['AvatarResponseDto'];
        };
      };
      /** @description Invalid request or avatar generation failed */
      400: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  HealthController_getHealth: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: Record<string, unknown>;
        content?: never;
      };
    };
  };
  RollsController_submitRoll: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        characterId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['SubmitRollDto'];
      };
    };
    responses: {
      200: {
        headers: Record<string, unknown>;
        content: {
          'application/json': components['schemas']['RollInstructionMessageDto'][];
        };
      };
    };
  };
}
