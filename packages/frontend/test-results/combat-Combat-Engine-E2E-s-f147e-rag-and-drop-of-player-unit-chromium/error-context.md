# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:import-analysis] Failed to resolve import \"@/types/combat-types\" from \"../combat-engine/src/composable/useCombat.ts\". Does the file exist?"
  - generic [ref=e5]: /app/packages/combat-engine/src/composable/useCombat.ts:4:57
  - generic [ref=e6]: "2 | import * as PIXI from \"pixi.js\"; 3 | import { gsap } from \"gsap\"; 4 | import { GRID_CONFIG } from \"@/types/combat-types\"; | ^ 5 | import { animations as animationConfig } from \"../services/spritesAnimations\"; 6 | import { loadTextures, preloadFont } from \"../services/assets/assetManager\";"
  - generic [ref=e7]: at TransformPluginContext._formatLog (file:///app/node_modules/vite/dist/node/chunks/config.js:28998:43) at TransformPluginContext.error (file:///app/node_modules/vite/dist/node/chunks/config.js:28995:14) at normalizeUrl (file:///app/node_modules/vite/dist/node/chunks/config.js:27118:18) at process.processTicksAndRejections (node:internal/process/task_queues:103:5) at async file:///app/node_modules/vite/dist/node/chunks/config.js:27176:32 at async Promise.all (index 3) at async TransformPluginContext.transform (file:///app/node_modules/vite/dist/node/chunks/config.js:27144:4) at async EnvironmentPluginContainer.transform (file:///app/node_modules/vite/dist/node/chunks/config.js:28796:14) at async loadAndTransform (file:///app/node_modules/vite/dist/node/chunks/config.js:22669:26) at async viteTransformMiddleware (file:///app/node_modules/vite/dist/node/chunks/config.js:24541:20)
  - generic [ref=e8]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e9]: server.hmr.overlay
    - text: to
    - code [ref=e10]: "false"
    - text: in
    - code [ref=e11]: vite.config.ts
    - text: .
```