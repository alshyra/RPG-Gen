// GENERATED FROM OpenAPI spec - do not edit manually

export interface paths {
    "/api/auth/google": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Initiate Google OAuth login */
        get: operations["AuthController_googleAuth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/google/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Google OAuth callback */
        get: operations["AuthController_googleAuthRedirect"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get current user profile */
        get: operations["AuthController_getProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Logout (client should clear token) */
        get: operations["AuthController_logout"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/chat/{characterId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Send a chat message and get AI response */
        post: operations["NarrativeController_sendMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/chat/{characterId}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get narrative history with a character */
        get: operations["NarrativeController_getNarrativeHistory"];
        put?: never;
        post?: never;
        /** Clear narrative history */
        delete: operations["NarrativeController_clearNarrative"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/chat/{characterId}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get recent messages from narrative */
        get: operations["NarrativeController_getRecentMessages"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/dice": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Roll dice expression like 1d6+2, optionally with advantage/disadvantage for d20 */
        post: operations["DiceController_roll"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/combat/{characterId}/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Initialize combat with enemies */
        post: operations["CombatController_startCombat"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/combat/{characterId}/action": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Execute any combat action (attack, dash, disengage, spell, class feature) */
        post: operations["CombatController_action"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/combat/{characterId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get current combat status */
        get: operations["CombatController_getStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/combat/{characterId}/end-turn": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** End current player activation and advance turn (triggers enemy actions) */
        post: operations["CombatController_endTurn"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/combat/{characterId}/flee": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Force end current combat (flee) */
        post: operations["CombatController_flee"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/combat/{characterId}/move": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Execute combatant movement on the grid */
        post: operations["CombatController_move"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/characters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all characters for the current user */
        get: operations["CharacterController_findAll"];
        put?: never;
        /** Create a new character */
        post: operations["CharacterController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/characters/drafts/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all draft (unfinished) characters for the current user */
        get: operations["CharacterController_findDrafts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/characters/created/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all finished characters for the current user */
        get: operations["CharacterController_findCreated"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/characters/{characterId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a specific character by ID */
        get: operations["CharacterController_findOne"];
        /** Update a character */
        put: operations["CharacterController_update"];
        post?: never;
        /** Delete a character */
        delete: operations["CharacterController_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/characters/{characterId}/kill": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mark a character as deceased */
        post: operations["CharacterController_kill"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/characters/deceased": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all deceased characters */
        get: operations["CharacterController_getDeceased"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/character/avatar/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate character avatar from description */
        post: operations["CharacterAvatarController_generateAvatar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/characters/{characterId}/inventory": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add an item to character's inventory */
        post: operations["CharacterInventoryController_addItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/characters/{characterId}/inventory/equip": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Equip an item by definitionId (weapon only) */
        post: operations["CharacterInventoryController_equipItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/characters/{characterId}/inventory/{itemId}": {
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
        delete: operations["CharacterInventoryController_removeItem"];
        options?: never;
        head?: never;
        /** Update an item in character's inventory */
        patch: operations["CharacterInventoryController_updateItem"];
        trace?: never;
    };
    "/api/characters/{characterId}/inspiration/grant": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Grant inspiration point(s) to a character */
        post: operations["CharacterInspirationController_grant"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/characters/{characterId}/inspiration/spend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Spend an inspiration point */
        post: operations["CharacterInspirationController_spend"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/classes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all available character classes */
        get: operations["ClassesController_getAllClasses"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/classes/{className}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a class by name */
        get: operations["ClassesController_getClass"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/classes/{className}/talent-trees": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get talent trees (voies) for a class */
        get: operations["ClassesController_getTalentTrees"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/classes/{className}/starting-aptitudes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get starting aptitudes for a class */
        get: operations["ClassesController_getStartingAptitudes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/game-data/races": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all available races */
        get: operations["RacesController_getAllRaces"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/game-data/races/{raceId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a race by ID */
        get: operations["RacesController_getRace"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/aptitudes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all available aptitudes */
        get: operations["AptitudesController_getAllAptitudes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/aptitudes/by-ids": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get multiple aptitudes by IDs */
        get: operations["AptitudesController_getByIds"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/aptitudes/{aptitudeId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get an aptitude by ID */
        get: operations["AptitudesController_getAptitude"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all item definitions */
        get: operations["ItemsController_getAllItems"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/items/weapons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all weapon definitions */
        get: operations["ItemsController_getWeapons"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/items/armors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all armor definitions */
        get: operations["ItemsController_getArmors"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/items/consumables": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all consumable definitions */
        get: operations["ItemsController_getConsumables"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/items/starters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all starter items */
        get: operations["ItemsController_getStarterItems"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/items/by-ids": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get multiple items by IDs */
        get: operations["ItemsController_getByIds"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/items/{definitionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get an item by definition ID */
        get: operations["ItemsController_getItem"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HealthController_check"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health/liveness": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HealthController_liveness"];
        put?: never;
        post?: never;
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
            /** @example 507f1f77bcf86cd799439011 */
            id: string;
            /** @example user@example.com */
            email: string;
            /** @example John Doe */
            displayName?: string;
            /** @example https://... */
            picture: string;
        };
        ChatMessageRequestDto: {
            /**
             * @description Message text from user
             * @example I want to attack the goblin
             */
            message: string;
        };
        NarrativeResponseDto: {
            /** @description Narrative narrative content */
            narrative: string;
            /** @description Game instructions */
            instructions: string[];
        };
        ConversationResponseDto: {
            /** @description User ID */
            userId: string;
            /** @description Character ID */
            characterId: string;
            /** @description Session ID */
            sessionId: string;
            /** @description Messages */
            messages: components["schemas"]["NarrativeResponseDto"][];
        };
        DiceRequestDto: {
            expr: string;
            advantage?: string;
        };
        DiceResultDto: {
            /** @description Individual dice roll results */
            rolls: number[];
            /** @description Modifier applied to the total */
            modifierValue: number;
            /** @description Total result (sum of rolls + modifier) */
            total: number;
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
        CombatStartRequestDto: {
            /** @description Array of enemies to initialize combat with */
            combat_start: components["schemas"]["CombatStartEntryDto"][];
        };
        TacticalStats: {
            /** @description Vigor stat */
            vigor: number;
            /** @description Finesse stat */
            finesse: number;
            /** @description Mind stat */
            mind: number;
            /** @description Survival stat */
            survival: number;
        };
        CombatantDto: {
            /** @description ID of the combatant (player character or enemy) */
            id: string;
            /** @description Combatant name */
            name: string;
            /** @description Initiative order value (finesse-based) */
            initiative: number;
            /** @description Whether combatant is player character */
            isPlayer: boolean;
            /** @description Current hit points */
            hp?: number;
            /** @description Maximum hit points */
            hpMax?: number;
            /** @description Current action points (PA) */
            pa?: number;
            /** @description Maximum action points (PA) */
            paMax?: number;
            /** @description Current movement points (PM) */
            pm?: number;
            /** @description Maximum movement points (PM) */
            pmMax?: number;
            /** @description Combatant level (1-20) */
            level?: number;
            /** @description Class name (guerrier, rogue, mage) */
            className?: string;
            /** @description Base power for attacks (used in damage formula) */
            basePower?: number;
            /** @description Which attribute scales damage (vigor, finesse, mind, survival) */
            scalingAttribute?: string;
            /** @description Combat stats (vigor, finesse, mind, survival) */
            stats?: components["schemas"]["TacticalStats"];
            /** @description Combat side (player or enemy) */
            side?: string;
            /** @description Grid position for tactical combat */
            position?: Record<string, never>;
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
        };
        CombatStateDto: {
            /** @description Character ID */
            characterId: string;
            /** @description Whether currently in combat */
            inCombat: boolean;
            /** @description Active enemies */
            enemies: components["schemas"]["CombatantDto"][];
            /** @description Player state */
            player: components["schemas"]["CombatantDto"];
            /** @description Turn order for combat */
            turnOrder: components["schemas"]["CombatantDto"][];
            /** @description Index of current turn in turnOrder */
            currentTurnIndex: number;
            /** @description Current round number */
            roundNumber: number;
            /** @description Narrative summary of current combat */
            narrative?: string;
            /** @description Active status effects (stunned, burning, etc.) */
            activeEffects?: string[];
            /** @description Combat end result, populated when combat ends (inCombat=false) */
            combatEnd?: components["schemas"]["CombatEndDto"];
        };
        CombatActionRequestDto: {
            /** @description Aptitude ID to use (including basic attack, dash, etc.) */
            aptitudeId: string;
            /** @description Target combatant ID (for aptitudes targeting enemies) */
            targetId?: string;
        };
        CombatDiceResultDto: {
            /** @description Individual dice roll results */
            rolls: number[];
            /** @description Modifier applied to the total */
            modifierValue: number;
            /** @description Total result (sum of rolls + modifier) */
            total: number;
            /** @description Total damage dealt */
            damageTotal: number;
            /** @description Whether this was a critical hit */
            isCrit: boolean;
        };
        CombatActionResponseDto: {
            /** @description Whether the action was successful */
            success: boolean;
            /**
             * @description Cost of the action
             * @enum {string}
             */
            cost: "action" | "bonus-action" | "reaction" | "free";
            /** @description Whether attack/spell hit (if applicable) */
            hit?: boolean;
            /** @description Damage dealt (if applicable) */
            damage?: number;
            /** @description Healing restored (if applicable) */
            healing?: number;
            /** @description Description of action result */
            description?: string;
            /** @description Error message if action failed */
            errorMessage?: string;
            /** @description Dice roll result (for attacks) */
            diceResult?: components["schemas"]["DiceResultDto"];
            /** @description Damage dice result details */
            damageDiceResult?: components["schemas"]["CombatDiceResultDto"];
            /** @description Total damage dealt (convenience field) */
            damageTotal?: number;
            /** @description Whether the attack was a critical hit */
            isCrit?: boolean;
            /** @description Narrative text (e.g., for combat end) */
            narrative?: string;
        };
        EnemyAttackLogDto: {
            /**
             * @description ID of the attacking enemy
             * @example goblin-1
             */
            attackerId: string;
            /**
             * @description Name of the attacking enemy
             * @example Goblin
             */
            attackerName: string;
            /**
             * @description ID of the target (player characterId)
             * @example char-123
             */
            targetId: string;
            /**
             * @description Whether the attack hit the target
             * @example true
             */
            hit: boolean;
            /** @description Attack roll result */
            attackRoll?: components["schemas"]["DiceResultDto"];
            /** @description Damage roll result (only present if hit) */
            damageRoll?: components["schemas"]["CombatDiceResultDto"];
            /**
             * @description Total damage dealt (0 if miss)
             * @example 5
             */
            damageTotal?: number;
            /**
             * @description Whether the attack was a critical hit
             * @example false
             */
            isCrit?: boolean;
        };
        EndPlayerTurnResponseDto: {
            /**
             * @description The current round number after enemy turn
             * @example 2
             */
            roundNumber: number;
            /** @description List of enemy attack logs in execution order */
            attackLogs: components["schemas"]["EnemyAttackLogDto"][];
            /**
             * @description Total damage dealt to the player this turn
             * @example 12
             */
            totalDamageToPlayer: number;
            /**
             * @description Whether the player was defeated this turn
             * @example false
             */
            playerDefeated?: boolean;
            /** @description Updated combat state after all enemy actions */
            combatState: components["schemas"]["CombatStateDto"];
        };
        CombatEndResultDto: {
            /** @description Combat end information */
            combat_end: components["schemas"]["CombatEndDto"];
        };
        CombatEndResponseDto: {
            /** @description Whether the operation succeeded */
            success: boolean;
            /** @description Human readable message */
            message: string;
            /** @description Optional instructions returned after ending combat */
            instructions?: components["schemas"]["CombatEndResultDto"][];
        };
        GridPositionDto: {
            /** @description X coordinate on combat grid */
            x: number;
            /** @description Y coordinate on combat grid */
            y: number;
        };
        MovementRequestDto: {
            /** @description ID of the combatant to move */
            combatantId: string;
            /** @description Path of grid positions to traverse */
            path: components["schemas"]["GridPositionDto"][];
        };
        MovementEventDto: {
            /**
             * @description Event type
             * @enum {string}
             */
            type: "move" | "opportunity-attack" | "reaction" | "movement-interrupted";
            /** @description Actor combatant ID */
            actorId: string;
            /** @description Target combatant ID (for attacks) */
            targetId?: string;
            /** @description Damage dealt (if applicable) */
            damage?: number;
            /** @description Whether attack hit */
            hit?: boolean;
            /** @description Description of event */
            description?: string;
        };
        MovementResponseDto: {
            /** @description Whether movement was successful */
            success: boolean;
            /** @description Final position after movement */
            finalPosition: components["schemas"]["GridPositionDto"];
            /** @description Ordered list of events that occurred during movement */
            events: components["schemas"]["MovementEventDto"][];
            /** @description Remaining movement speed after this action */
            remainingMovement: number;
            /** @description Error message if movement failed */
            errorMessage?: string;
        };
        RaceResponseDto: {
            /**
             * @description Race ID (unique identifier)
             * @example humain
             */
            id: string;
            /**
             * @description Display name
             * @example Humain
             */
            name: string;
            /**
             * @description Trait name
             * @example Polyvalent
             */
            trait: string;
            /** @description Trait effect details */
            traitEffect: components["schemas"]["TraitEffectResponseDto"];
            /** @description Stat bonuses */
            bonuses: components["schemas"]["RaceBonusesResponseDto"];
            /**
             * @description Description for AI
             * @example Polyvalent, gagne +1 PA au premier tour.
             */
            descriptionForAi?: string;
            /**
             * @description UI color (hex)
             * @example #3b82f6
             */
            color: string;
            /**
             * @description Icon emoji
             * @example 👤
             */
            icon: string;
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
            definitionId: string;
            /** @description Item name */
            name: string;
            /** @description Quantity */
            qty?: number;
            /** @description Item description */
            description?: string;
            /** @description Is equipped */
            equipped: boolean;
            /** @description Arbitrary item meta */
            meta: components["schemas"]["WeaponMeta"] | components["schemas"]["ArmorMeta"] | components["schemas"]["ConsumableMeta"] | components["schemas"]["PackMeta"] | components["schemas"]["ToolMeta"];
        };
        AptitudeScalingDto: {
            /** @description Stat used for scaling (vigor, finesse, mind, survival) */
            attribute?: string;
            /** @description Scaling divisor (e.g., 5 = +1 every 5 levels) */
            scalingDivisor: number;
        };
        AptitudeResponseDto: {
            /**
             * @description Aptitude ID (unique identifier)
             * @example frappe_simple
             */
            id: string;
            /**
             * @description Display name
             * @example Frappe simple
             */
            name: string;
            /**
             * @description Description
             * @example Une attaque basique
             */
            description?: string;
            /**
             * @description Action points cost
             * @example 2
             */
            paCost: number;
            /**
             * @description Cooldown in turns
             * @example 0
             */
            cooldown?: number;
            /** @description Targeting information */
            targeting: components["schemas"]["AptitudeTargetingResponseDto"];
            /** @description Effects list */
            effects?: components["schemas"]["AptitudeEffectResponseDto"][];
            /**
             * @description Icon emoji
             * @example ⚔️
             */
            icon?: string;
        };
        TalentRankDto: {
            /**
             * @description Rank number (1-5)
             * @example 1
             */
            rank: number;
            /**
             * @description Aptitude ID to unlock at this rank
             * @example frappe_puissante
             */
            aptitudeId: string;
            /**
             * @description Talent points cost to unlock this rank
             * @example 1
             */
            pointCost: number;
        };
        VoieProgressDto: {
            /** @description Talent tree ID */
            voieId: string;
            /** @description Talent tree display name (e.g., 'Voie de l'Ombre') */
            voieName: string;
            /** @description Parent class name (guerrier, rogue, mage) */
            className: string;
            /** @description Current rank unlocked (0-5, where 0 = not started) */
            currentRank: number;
            /** @description Talent points required to unlock next rank */
            requiredTalentPoints?: number;
            /** @description IDs of aptitudes unlocked in this voie */
            unlockedAptitudes?: string[];
            /** @description All available ranks in this voie with their aptitudes */
            ranks: components["schemas"]["TalentRankDto"][];
        };
        DraftCharacterResponseDto: {
            /** @description Unique character ID (UUID) */
            characterId: string;
            /** @description Character name */
            name?: string;
            /** @description Physical description of the character */
            physicalDescription?: string;
            /** @description Character race (new system) */
            race?: components["schemas"]["RaceResponseDto"];
            /** @description Current hit points */
            hp?: number;
            /** @description Maximum hit points */
            hpMax?: number;
            /** @description Total experience points */
            totalXp?: number;
            /** @description Character skills */
            skills?: components["schemas"]["SkillResponseDto"][];
            /** @description Character portrait URL or base64 */
            portrait?: string;
            /** @description Character gender */
            gender?: string;
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
            state: "draft" | "created";
            /** @description Character inventory */
            inventory?: components["schemas"]["InventoryItemDto"][];
            /** @description Character aptitudes (learned abilities) */
            aptitudes?: components["schemas"]["AptitudeResponseDto"][];
            /**
             * @description Character class (guerrier, rogue, mage)
             * @enum {string}
             */
            className?: "guerrier" | "rogue" | "mage";
            /** @description Character level (1-20) */
            level?: number;
            /**
             * @description Race ID (humain, nain, elfe, dark_elfe, orc)
             * @enum {string}
             */
            raceId?: "humain" | "nain" | "elfe" | "dark_elfe" | "orc";
            /** @description Tactical stats (vigor, finesse, mind, survival) */
            stats?: components["schemas"]["TacticalStats"];
            /** @description Current action points */
            pa?: number;
            /** @description Maximum action points */
            paMax?: number;
            /** @description Current movement points */
            pm?: number;
            /** @description Maximum movement points */
            pmMax?: number;
            /** @description Unspent talent points */
            talentPoints?: number;
            /** @description Talent tree progression */
            voies?: components["schemas"]["VoieProgressDto"][];
        };
        CharacterResponseDto: {
            /** @description Unique character ID (UUID) */
            characterId: string;
            /** @description Character name */
            name?: string;
            /** @description Physical description of the character */
            physicalDescription?: string;
            /** @description Character race (new system) */
            race?: components["schemas"]["RaceResponseDto"];
            /** @description Current hit points */
            hp?: number;
            /** @description Maximum hit points */
            hpMax?: number;
            /** @description Total experience points */
            totalXp?: number;
            /** @description Character skills */
            skills?: components["schemas"]["SkillResponseDto"][];
            /** @description Character portrait URL or base64 */
            portrait?: string;
            /** @description Character gender */
            gender?: string;
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
            state: "draft" | "created";
            /** @description Character inventory */
            inventory?: components["schemas"]["InventoryItemDto"][];
            /** @description Character aptitudes (learned abilities) */
            aptitudes?: components["schemas"]["AptitudeResponseDto"][];
            /**
             * @description Character class (guerrier, rogue, mage)
             * @enum {string}
             */
            className?: "guerrier" | "rogue" | "mage";
            /** @description Character level (1-20) */
            level?: number;
            /**
             * @description Race ID (humain, nain, elfe, dark_elfe, orc)
             * @enum {string}
             */
            raceId?: "humain" | "nain" | "elfe" | "dark_elfe" | "orc";
            /** @description Tactical stats (vigor, finesse, mind, survival) */
            stats?: components["schemas"]["TacticalStats"];
            /** @description Current action points */
            pa?: number;
            /** @description Maximum action points */
            paMax?: number;
            /** @description Current movement points */
            pm?: number;
            /** @description Maximum movement points */
            pmMax?: number;
            /** @description Unspent talent points */
            talentPoints?: number;
            /** @description Talent tree progression */
            voies?: components["schemas"]["VoieProgressDto"][];
        };
        UpdateCharacterRequestDto: {
            /** @description Character name */
            name?: string;
            /** @description Physical description of the character */
            physicalDescription?: string;
            /** @description Character race (new system) */
            race?: components["schemas"]["RaceResponseDto"];
            /** @description Current hit points */
            hp?: number;
            /** @description Maximum hit points */
            hpMax?: number;
            /** @description Total experience points */
            totalXp?: number;
            /** @description Character skills */
            skills?: components["schemas"]["SkillResponseDto"][];
            /** @description Character portrait URL or base64 */
            portrait?: string;
            /** @description Character gender */
            gender?: string;
            /** @description Inspiration points */
            inspirationPoints?: number;
            /**
             * @description Character state
             * @enum {string}
             */
            state?: "draft" | "created";
            /** @description Character inventory */
            inventory?: components["schemas"]["InventoryItemDto"][];
            /** @description Character aptitudes (learned abilities) */
            aptitudes?: components["schemas"]["AptitudeResponseDto"][];
            /**
             * @description Character class (guerrier, rogue, mage)
             * @enum {string}
             */
            className?: "guerrier" | "rogue" | "mage";
            /** @description Character level (1-20) */
            level?: number;
            /**
             * @description Race ID (humain, nain, elfe, dark_elfe, orc)
             * @enum {string}
             */
            raceId?: "humain" | "nain" | "elfe" | "dark_elfe" | "orc";
            /** @description Tactical stats (vigor, finesse, mind, survival) */
            stats?: components["schemas"]["TacticalStats"];
            /** @description Current action points */
            pa?: number;
            /** @description Maximum action points */
            paMax?: number;
            /** @description Current movement points */
            pm?: number;
            /** @description Maximum movement points */
            pmMax?: number;
            /** @description Unspent talent points */
            talentPoints?: number;
            /** @description Talent tree progression */
            voies?: components["schemas"]["VoieProgressDto"][];
        };
        KillCharacterBodyDto: {
            /** @description Location where character died */
            deathLocation?: string;
        };
        DeceasedCharacterResponseDto: {
            /** @description Unique character ID (UUID) */
            characterId: string;
            /** @description Character name */
            name?: string;
            /** @description Physical description of the character */
            physicalDescription?: string;
            /** @description Character race (new system) */
            race?: components["schemas"]["RaceResponseDto"];
            /** @description Current hit points */
            hp?: number;
            /** @description Maximum hit points */
            hpMax?: number;
            /** @description Total experience points */
            totalXp?: number;
            /** @description Character skills */
            skills?: components["schemas"]["SkillResponseDto"][];
            /** @description Character portrait URL or base64 */
            portrait?: string;
            /** @description Character gender */
            gender?: string;
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
            state: "draft" | "created";
            /** @description Character inventory */
            inventory?: components["schemas"]["InventoryItemDto"][];
            /** @description Character aptitudes (learned abilities) */
            aptitudes?: components["schemas"]["AptitudeResponseDto"][];
            /**
             * @description Character class (guerrier, rogue, mage)
             * @enum {string}
             */
            className?: "guerrier" | "rogue" | "mage";
            /** @description Character level (1-20) */
            level?: number;
            /**
             * @description Race ID (humain, nain, elfe, dark_elfe, orc)
             * @enum {string}
             */
            raceId?: "humain" | "nain" | "elfe" | "dark_elfe" | "orc";
            /** @description Tactical stats (vigor, finesse, mind, survival) */
            stats?: components["schemas"]["TacticalStats"];
            /** @description Current action points */
            pa?: number;
            /** @description Maximum action points */
            paMax?: number;
            /** @description Current movement points */
            pm?: number;
            /** @description Maximum movement points */
            pmMax?: number;
            /** @description Unspent talent points */
            talentPoints?: number;
            /** @description Talent tree progression */
            voies?: components["schemas"]["VoieProgressDto"][];
        };
        GenerateAvatarRequestDto: {
            /** @description UUID of the character */
            characterId: string;
        };
        AvatarResponseDto: {
            /** @description Generated avatar image URL or base64 data */
            imageUrl: string;
        };
        WeaponMeta: {
            /**
             * @description Type discriminator for weapons
             * @enum {string}
             */
            type?: "weapon";
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
            type?: "armor";
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
            type?: "consumable";
            /** @description Item cost (gold pieces or formatted string) */
            cost?: Record<string, never>;
            /** @description Item weight in pounds */
            weight?: Record<string, never>;
            /** @description Whether this is a starter item */
            starter?: boolean;
            /** @description Whether the item can be used directly */
            usable?: boolean;
            /** @description Whether the item can be used in combat (e.g., potions) */
            combatUsable?: boolean;
            /** @description Whether the item can be used during rest (e.g., rations) */
            restUsable?: boolean;
            /** @description Heal dice expression (e.g., "2d4+2") */
            healDice?: string;
        };
        PackMeta: {
            /**
             * @description Type discriminator for packs
             * @enum {string}
             */
            type?: "pack";
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
            type?: "tool";
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
            meta?: components["schemas"]["WeaponMeta"] | components["schemas"]["ArmorMeta"] | components["schemas"]["ConsumableMeta"] | components["schemas"]["PackMeta"] | components["schemas"]["ToolMeta"] | components["schemas"]["GenericMeta"];
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
            character: components["schemas"]["CharacterResponseDto"];
        };
        ClassStatsResponseDto: {
            /**
             * @description Base HP
             * @example 10
             */
            hpBase: number;
            /**
             * @description HP gained per level
             * @example 4
             */
            hpGain: number;
            /**
             * @description Action Points
             * @example 6
             */
            pa: number;
            /**
             * @description Movement Points
             * @example 3
             */
            pm: number;
        };
        TalentRankResponseDto: {
            /**
             * @description Rank number (1-5)
             * @example 1
             */
            rank: number;
            /**
             * @description Aptitude ID for this rank
             * @example frappe_simple
             */
            aptitudeId: string;
            /**
             * @description Talent points cost
             * @example 1
             */
            pointCost: number;
        };
        TalentTreeResponseDto: {
            /**
             * @description Talent tree ID (voieId)
             * @example voie_du_guerrier
             */
            voieId: string;
            /**
             * @description Tree name
             * @example Voie du Guerrier
             */
            name: string;
            /** @description Tree ranks */
            ranks: components["schemas"]["TalentRankResponseDto"][];
        };
        ClassResponseDto: {
            /**
             * @description Class name (unique identifier)
             * @example guerrier
             */
            name: string;
            /**
             * @description Display name
             * @example Guerrier
             */
            displayName?: string;
            /**
             * @description Class description
             * @example Un combattant robuste et aguerri
             */
            description?: string;
            /**
             * @description UI color (hex)
             * @example #ef4444
             */
            color?: string;
            /**
             * @description Icon emoji
             * @example ⚔️
             */
            icon?: string;
            /** @description Base stats */
            baseStats: components["schemas"]["ClassStatsResponseDto"];
            /**
             * @description Proficiencies (stat types)
             * @example [
             *       "vigueur",
             *       "finesse"
             *     ]
             */
            proficiencies?: string[];
            /**
             * @description Starting aptitude IDs
             * @example [
             *       "frappe_simple",
             *       "posture_defensive"
             *     ]
             */
            startingAptitudes?: string[];
            /** @description Talent trees */
            talentTrees: components["schemas"]["TalentTreeResponseDto"][];
        };
        TraitEffectResponseDto: {
            /**
             * @description Effect type
             * @example pa_bonus
             */
            type: string;
            /**
             * @description Effect value
             * @example 1
             */
            value: number;
            /**
             * @description Condition for effect
             * @example first_turn
             */
            condition?: string;
        };
        RaceBonusesResponseDto: {
            /**
             * @description Vigor bonus
             * @example 1
             */
            vigor?: number;
            /**
             * @description Finesse bonus
             * @example 1
             */
            finesse?: number;
            /**
             * @description Mind bonus
             * @example 1
             */
            mind?: number;
            /**
             * @description Survival bonus
             * @example 1
             */
            survival?: number;
        };
        AptitudeTargetingResponseDto: {
            /**
             * @description Target type
             * @example enemy
             */
            type: string;
            /**
             * @description Range in cells
             * @example 3
             */
            range?: number;
            /**
             * @description Area of effect
             * @example 1
             */
            aoe?: number;
        };
        AptitudeEffectResponseDto: {
            /**
             * @description Effect type
             * @example damage
             */
            type: string;
            /**
             * @description Base value
             * @example 10
             */
            value?: number;
            /**
             * @description Scaling formula
             * @example 1d6+finesse
             */
            scaling?: string;
            /**
             * @description Effect duration in turns
             * @example 2
             */
            duration?: number;
        };
        ItemResponseDto: {
            /**
             * @description Item definition ID (unique identifier)
             * @example epee_longue
             */
            definitionId: string;
            /**
             * @description Display name
             * @example Épée longue
             */
            name: string;
            /**
             * @description Description
             * @example Une épée classique.
             */
            description?: string;
            /**
             * @description Rarity
             * @example common
             * @enum {string}
             */
            rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
            /**
             * @description Base value in gold
             * @example 50
             */
            value?: number;
            /**
             * @description Is this a starter item?
             * @example false
             */
            isStarter: boolean;
            /**
             * @description Icon emoji
             * @example ⚔️
             */
            icon?: string;
            /** @description Metadata (weapon/armor/consumable) */
            meta?: Record<string, never>;
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
                headers: {
                    [name: string]: unknown;
                };
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
                headers: {
                    [name: string]: unknown;
                };
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
            /** @description Current user profile */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthProfileDto"];
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
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NarrativeController_sendMessage: {
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
                "application/json": components["schemas"]["ChatMessageRequestDto"];
            };
        };
        responses: {
            /** @description AI response with narrative and instructions */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NarrativeResponseDto"];
                };
            };
        };
    };
    NarrativeController_getNarrativeHistory: {
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
            /** @description Narrative history */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConversationResponseDto"];
                };
            };
            /** @description Narrative not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NarrativeController_clearNarrative: {
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
            /** @description Narrative cleared */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NarrativeController_getRecentMessages: {
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
            /** @description List of recent messages */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NarrativeResponseDto"][];
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
                "application/json": components["schemas"]["DiceRequestDto"];
            };
        };
        responses: {
            /** @description Dice throw result */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DiceResultDto"];
                };
            };
            /** @description Invalid dice expression */
            400: {
                headers: {
                    [name: string]: unknown;
                };
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
                "application/json": components["schemas"]["CombatStartRequestDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CombatStateDto"];
                };
            };
        };
    };
    CombatController_action: {
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
                "application/json": components["schemas"]["CombatActionRequestDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CombatActionResponseDto"];
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
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CombatStateDto"];
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
            /** @description Returns attack logs for animations and new player turn state */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EndPlayerTurnResponseDto"];
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
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CombatEndResponseDto"];
                };
            };
        };
    };
    CombatController_move: {
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
                "application/json": components["schemas"]["MovementRequestDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MovementResponseDto"];
                };
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
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterResponseDto"][];
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
        requestBody?: never;
        responses: {
            /** @description Character created successfully */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DraftCharacterResponseDto"];
                };
            };
        };
    };
    CharacterController_findDrafts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of draft characters */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DraftCharacterResponseDto"][];
                };
            };
        };
    };
    CharacterController_findCreated: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of finished characters */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterResponseDto"][];
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
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterResponseDto"];
                };
            };
            /** @description Character not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
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
                "application/json": components["schemas"]["UpdateCharacterRequestDto"];
            };
        };
        responses: {
            /** @description Character updated */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterResponseDto"];
                };
            };
            /** @description Character not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
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
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Character not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
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
                "application/json": components["schemas"]["KillCharacterBodyDto"];
            };
        };
        responses: {
            /** @description Character marked as deceased */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterResponseDto"];
                };
            };
            /** @description Character not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeceasedCharacterResponseDto"][];
                };
            };
        };
    };
    CharacterAvatarController_generateAvatar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GenerateAvatarRequestDto"];
            };
        };
        responses: {
            /** @description Avatar generated successfully */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AvatarResponseDto"];
                };
            };
            /** @description Invalid request or avatar generation failed */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CharacterInventoryController_addItem: {
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
                "application/json": components["schemas"]["CreateInventoryItemDto"];
            };
        };
        responses: {
            /** @description Item added to inventory */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterResponseDto"];
                };
            };
            /** @description Character not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CharacterInventoryController_equipItem: {
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
                "application/json": components["schemas"]["EquipInventoryDto"];
            };
        };
        responses: {
            /** @description Character updated with equipped item */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterResponseDto"];
                };
            };
        };
    };
    CharacterInventoryController_removeItem: {
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
                "application/json": components["schemas"]["RemoveInventoryBodyDto"];
            };
        };
        responses: {
            /** @description Item removed from inventory */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterResponseDto"];
                };
            };
            /** @description Character or item not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CharacterInventoryController_updateItem: {
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
                "application/json": components["schemas"]["CreateInventoryItemDto"];
            };
        };
        responses: {
            /** @description Inventory item updated */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterResponseDto"];
                };
            };
            /** @description Character or item not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CharacterInspirationController_grant: {
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
                "application/json": components["schemas"]["GrantInspirationBodyDto"];
            };
        };
        responses: {
            /** @description Inspiration granted */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InspirationResponseDto"];
                };
            };
            /** @description Invalid amount */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Character not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CharacterInspirationController_spend: {
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
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InspirationResponseDto"];
                };
            };
            /** @description No inspiration points available */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Character not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ClassesController_getAllClasses: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of all classes with stats and talent trees */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClassResponseDto"][];
                };
            };
        };
    };
    ClassesController_getClass: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Class name (e.g., guerrier, rogue, mage) */
                className: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Class details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClassResponseDto"];
                };
            };
            /** @description Class not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ClassesController_getTalentTrees: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Class name */
                className: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of talent trees with their ranks */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TalentTreeResponseDto"][];
                };
            };
            /** @description Class not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ClassesController_getStartingAptitudes: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Class name */
                className: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of starting aptitude IDs */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": string[];
                };
            };
            /** @description Class not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    RacesController_getAllRaces: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of all races with bonuses and traits */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RaceResponseDto"][];
                };
            };
        };
    };
    RacesController_getRace: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Race identifier (humain, nain, elfe, orc) */
                raceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Race details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RaceResponseDto"];
                };
            };
            /** @description Race not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AptitudesController_getAllAptitudes: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of all aptitudes */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AptitudeResponseDto"][];
                };
            };
        };
    };
    AptitudesController_getByIds: {
        parameters: {
            query: {
                /** @description Comma-separated aptitude IDs */
                ids: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of matching aptitudes */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AptitudeResponseDto"][];
                };
            };
        };
    };
    AptitudesController_getAptitude: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Aptitude identifier */
                aptitudeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Aptitude details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AptitudeResponseDto"];
                };
            };
            /** @description Aptitude not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ItemsController_getAllItems: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of all items */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemResponseDto"][];
                };
            };
        };
    };
    ItemsController_getWeapons: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of all weapons */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemResponseDto"][];
                };
            };
        };
    };
    ItemsController_getArmors: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of all armor */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemResponseDto"][];
                };
            };
        };
    };
    ItemsController_getConsumables: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of all consumables */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemResponseDto"][];
                };
            };
        };
    };
    ItemsController_getStarterItems: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of starter items for new characters */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemResponseDto"][];
                };
            };
        };
    };
    ItemsController_getByIds: {
        parameters: {
            query: {
                /** @description Comma-separated item definition IDs */
                ids: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of matching items */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemResponseDto"][];
                };
            };
        };
    };
    ItemsController_getItem: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Item definition identifier */
                definitionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Item details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ItemResponseDto"];
                };
            };
            /** @description Item not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HealthController_check: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The Health Check is successful */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example ok */
                        status?: string;
                        /**
                         * @example {
                         *       "database": {
                         *         "status": "up"
                         *       }
                         *     }
                         */
                        info?: {
                            [key: string]: {
                                status: string;
                            } & {
                                [key: string]: unknown;
                            };
                        } | null;
                        /** @example {} */
                        error?: {
                            [key: string]: {
                                status: string;
                            } & {
                                [key: string]: unknown;
                            };
                        } | null;
                        /**
                         * @example {
                         *       "database": {
                         *         "status": "up"
                         *       }
                         *     }
                         */
                        details?: {
                            [key: string]: {
                                status: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
            };
            /** @description The Health Check is not successful */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example error */
                        status?: string;
                        /**
                         * @example {
                         *       "database": {
                         *         "status": "up"
                         *       }
                         *     }
                         */
                        info?: {
                            [key: string]: {
                                status: string;
                            } & {
                                [key: string]: unknown;
                            };
                        } | null;
                        /**
                         * @example {
                         *       "redis": {
                         *         "status": "down",
                         *         "message": "Could not connect"
                         *       }
                         *     }
                         */
                        error?: {
                            [key: string]: {
                                status: string;
                            } & {
                                [key: string]: unknown;
                            };
                        } | null;
                        /**
                         * @example {
                         *       "database": {
                         *         "status": "up"
                         *       },
                         *       "redis": {
                         *         "status": "down",
                         *         "message": "Could not connect"
                         *       }
                         *     }
                         */
                        details?: {
                            [key: string]: {
                                status: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
            };
        };
    };
    HealthController_liveness: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
