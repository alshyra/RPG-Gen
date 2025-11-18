# Conversation — résumé synthétique

Bref : ce module gère la conversation entre le joueur (user) et le modèle (Gemini). Les réponses du modèle contiennent :

- une narration texte (human-readable) ;
- éventuellement des instructions machine en JSON (GameInstruction).

Types importants

- GameInstruction — union courte : `roll`, `xp`, `hp`, `spell`, `inventory` (voir `dto/GameConversation.ts`)
- ChatMessage (persisté) — `{ role, text, timestamp, meta? }` (Mongoose + DTO)
- GameMessage — `{ narrative: string, instructions: GameInstruction[] }`
- GameResponse — `{ text: narrative, instructions: [], model, usage? }` (exposé via l'API)
