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
        /** Send prompt to Gemini (chat) */
        post: operations["ChatController_chat"];
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
        /** Get conversation history for a character */
        get: operations["ChatController_getHistory"];
        put?: never;
        post?: never;
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
        post: operations["CharacterController_addInventory"];
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
        delete: operations["CharacterController_removeInventory"];
        options?: never;
        head?: never;
        /** Update an item in character's inventory */
        patch: operations["CharacterController_updateInventory"];
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
        post: operations["CharacterController_grantInspiration"];
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
        post: operations["CharacterController_spendInspiration"];
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
        get: operations["ItemDefinitionController_list"];
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
        get: operations["ItemDefinitionController_get"];
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
    "/api/image": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate image from prompt */
        post: operations["ImageController_generate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/image/generate-avatar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate character avatar from description */
        post: operations["ImageController_generateAvatar"];
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
        get: operations["HealthController_getHealth"];
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
            /** @description Id de l'utilisateur */
            id: string;
            /** @description Email de l'utilisateur */
            email: string;
            /** @description Nom affiché de l'utilisateur */
            displayName: string;
            /** @description URL de la photo de profil de l'utilisateur */
            picture: string;
        };
        ChatRequestDto: {
            /** @description User message to send to the AI */
            message: string;
        };
        RollInstructionDto: {
            /** @description Dice expression (e.g., 1d20+5) */
            dices: string;
            /** @description Modifier */
            modifier?: Record<string, never>;
            /** @description Roll description */
            description?: string;
            /**
             * @description Advantage type
             * @enum {string}
             */
            advantage?: "advantage" | "disadvantage" | "none";
        };
        SpellInstructionDataDto: {
            /**
             * @description Spell action
             * @enum {string}
             */
            action: "learn" | "cast" | "forget";
            /** @description Spell name */
            name: string;
            /** @description Spell level */
            level?: number;
            /** @description Spell school */
            school?: string;
            /** @description Spell description */
            description?: string;
        };
        InventoryInstructionDataDto: {
            /**
             * @description Inventory action
             * @enum {string}
             */
            action: "add" | "remove" | "use";
            /** @description Item name */
            name: string;
            /** @description Quantity */
            quantity?: number;
            /** @description Item description */
            description?: string;
        };
        GameInstructionDto: {
            /**
             * @description Instruction type
             * @enum {string}
             */
            type?: "roll" | "xp" | "hp" | "spell" | "inventory";
            /** @description Roll instruction data */
            roll?: components["schemas"]["RollInstructionDto"];
            /** @description HP change */
            hp?: number;
            /** @description XP gained */
            xp?: number;
            /** @description Spell instruction */
            spell?: components["schemas"]["SpellInstructionDataDto"];
            /** @description Inventory instruction */
            inventory?: components["schemas"]["InventoryInstructionDataDto"];
        };
        ChatResponseDto: {
            /** @description Narrative text from the AI (cleaned) */
            text: string;
            /** @description Game instructions extracted from the response */
            instructions: components["schemas"]["GameInstructionDto"][];
            /** @description AI model used */
            model: string;
            /** @description Token usage statistics */
            usage?: {
                [key: string]: unknown;
            };
            /** @description Raw response (null by default) */
            raw?: Record<string, never>;
        };
        MessageMetaDto: {
            /** @description AI model version used */
            model?: string;
            /** @description Token usage statistics */
            usage?: {
                [key: string]: unknown;
            };
        };
        ChatMessageDto: {
            /**
             * @description Message role
             * @enum {string}
             */
            role: "user" | "assistant" | "system";
            /** @description Message text content */
            text: string;
            /** @description Unix timestamp of the message */
            timestamp: number;
            /** @description Message metadata */
            meta?: components["schemas"]["MessageMetaDto"];
            /** @description Narrative text (for assistant messages) */
            narrative?: string;
            /** @description Game instructions (for assistant messages) */
            instructions?: components["schemas"]["GameInstructionDto"][];
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
            mods: {
                [key: string]: number;
            };
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
        ItemResponseDto: {
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
            /** @description Item metadata */
            meta?: {
                [key: string]: unknown;
            };
        };
        SpellResponseDto: {
            /** @description Spell name */
            name: string;
            /** @description Spell level */
            level?: number;
            /** @description Spell description */
            description?: string;
            /** @description Spell metadata */
            meta?: {
                [key: string]: unknown;
            };
        };
        CharacterResponseDto: {
            /** @description Unique character ID (UUID) */
            characterId: string;
            /** @description Character name */
            name?: string;
            /** @description Physical description of the character */
            physicalDescription?: string;
            /** @description Character race */
            race?: components["schemas"]["RaceResponseDto"];
            /** @description Ability scores */
            scores?: components["schemas"]["AbilityScoresResponseDto"];
            /** @description Current hit points */
            hp?: number;
            /** @description Maximum hit points */
            hpMax?: number;
            /** @description Total experience points */
            totalXp?: number;
            /** @description Character classes */
            classes?: components["schemas"]["CharacterClassResponseDto"][];
            /** @description Character skills */
            skills?: components["schemas"]["SkillResponseDto"][];
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
            state: "draft" | "created";
            /** @description Character inventory */
            inventory?: components["schemas"]["ItemResponseDto"][];
            /** @description Character spells */
            spells?: components["schemas"]["SpellResponseDto"][];
        };
        DeceasedCharacterResponseDto: {
            /** @description Unique character ID (UUID) */
            characterId: string;
            /** @description Character name */
            name?: string;
            /** @description Physical description of the character */
            physicalDescription?: string;
            /** @description Character race */
            race?: components["schemas"]["RaceResponseDto"];
            /** @description Ability scores */
            scores?: components["schemas"]["AbilityScoresResponseDto"];
            /** @description Current hit points */
            hp?: number;
            /** @description Maximum hit points */
            hpMax?: number;
            /** @description Total experience points */
            totalXp?: number;
            /** @description Character classes */
            classes?: components["schemas"]["CharacterClassResponseDto"][];
            /** @description Character skills */
            skills?: components["schemas"]["SkillResponseDto"][];
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
            state: "draft" | "created";
            /** @description Character inventory */
            inventory?: components["schemas"]["ItemResponseDto"][];
            /** @description Character spells */
            spells?: components["schemas"]["SpellResponseDto"][];
        };
        UpdateCharacterRequestDto: {
            /** @description Character name */
            name?: string;
            /** @description Physical description of the character */
            physicalDescription?: string;
            /** @description Character race */
            race?: components["schemas"]["RaceResponseDto"];
            /** @description Ability scores */
            scores?: components["schemas"]["AbilityScoresResponseDto"];
            /** @description Current hit points */
            hp?: number;
            /** @description Maximum hit points */
            hpMax?: number;
            /** @description Total experience points */
            totalXp?: number;
            /** @description Character classes */
            classes?: components["schemas"]["CharacterClassResponseDto"][];
            /** @description Character skills */
            skills?: components["schemas"]["SkillResponseDto"][];
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
            state?: "draft" | "created";
            /** @description Character inventory */
            inventory?: components["schemas"]["ItemResponseDto"][];
            /** @description Character spells */
            spells?: components["schemas"]["SpellResponseDto"][];
        };
        MessageResponseDto: {
            /** @description Response message */
            message: string;
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
        DiceRequest: {
            /** @description Dice expression (e.g., 1d20+5, 2d6, 1d8-2) */
            expr: string;
            /**
             * @description Advantage type for d20 rolls
             * @enum {string}
             */
            advantage?: "advantage" | "disadvantage" | "none";
        };
        DiceThrowDto: {
            /** @description Individual dice roll results */
            rolls: number[];
            /** @description Modifier applied to the total */
            mod: number;
            /** @description Total result (sum of rolls + modifier) */
            total: number;
            /**
             * @description Advantage type used for this roll
             * @enum {string}
             */
            advantage?: "advantage" | "disadvantage" | "none";
            /** @description The roll that was kept (when using advantage/disadvantage) */
            keptRoll?: number;
            /** @description The roll that was discarded (when using advantage/disadvantage) */
            discardedRoll?: number;
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
            /** @description List of characters */
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
                "application/json": components["schemas"]["ChatRequestDto"];
            };
        };
        responses: {
            /** @description Chat response with narrative and instructions */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatResponseDto"];
                };
            };
            /** @description Invalid request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Chat processing failed */
            500: {
                headers: {
                    [name: string]: unknown;
                };
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
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatMessageDto"][];
                };
            };
            /** @description Invalid request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description History retrieval failed */
            500: {
                headers: {
                    [name: string]: unknown;
                };
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
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCharacterBodyDto"];
            };
        };
        responses: {
            /** @description Character created successfully */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterResponseDto"];
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
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeceasedCharacterResponseDto"][];
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
                    "application/json": components["schemas"]["UpdateCharacterRequestDto"];
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
                    "application/json": components["schemas"]["MessageResponseDto"];
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
    ItemDefinitionController_list: {
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
    ItemDefinitionController_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                definitionId: string;
            };
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
    DiceController_roll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DiceRequest"];
            };
        };
        responses: {
            /** @description Dice throw result */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DiceThrowDto"];
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
    ImageController_generate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ImageRequestDto"];
            };
        };
        responses: {
            /** @description Image generation not implemented */
            400: {
                headers: {
                    [name: string]: unknown;
                };
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
                "application/json": components["schemas"]["CharacterIdBodyDto"];
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
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
