# Combat Engine

A standalone 2D combat engine built with PixiJS, Vue 3, and Pinia. Provides grid-based tactical combat with animated sprites, drag-and-drop movement, and event-driven architecture.

## Features

- **Grid-based combat**: 12×9 tile grid with visual feedback
- **Animated sprites**: Walk and idle animations for multiple character types
- **Drag-and-drop movement**: Interactive unit movement with range validation
- **Health bars**: Visual HP indicators for all units
- **Event system**: Subscribe to combat events (unit clicked, attacked, died, turn ended)
- **Reachable cells overlay**: Visual feedback showing valid movement range

## Installation

```bash
npm install
```

## Development

Start the dev server with a demo combat scene:

```bash
npm run dev
```

Open `http://localhost:5174` to see the combat engine in action.

## Testing

The combat engine has comprehensive E2E tests using Playwright:

```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug
```

### Test Coverage

- Canvas rendering with correct dimensions (768×576px)
- Grid display with tiles and lines
- Unit creation and display (player + enemies)
- Drag-and-drop functionality
- Reachable cells overlay on drag
- Movement validation within range
- Health bar rendering

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
