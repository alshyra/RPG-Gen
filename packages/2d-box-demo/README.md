# 2d-box-demo

A Vue 3 + Vite demo for the **Combat Grid** component using [Konva.js](https://konvajs.org/) for 2D canvas rendering.

## 🎮 Demo Features

- **7×7 Tactical Grid** — Each cell is 60×60 pixels (420×420 total).
- **Background Map** — Uses `public/map.png` as the battlefield backdrop.
- **Tokens** — Player (green) and enemies (red/orange) are displayed as circles.
- **Drag & Drop** — Only the player token is draggable. Drag it to move.
- **Movement Range** — Configurable per-unit or global (default: 3 cells, Manhattan distance).
- **Reachable Cells Highlight** — Blue overlay shows valid destination cells while dragging.
- **Snap Animation** — Token snaps smoothly (lerp) to the nearest valid cell after drag.
- **Bounds Clamping** — Tokens cannot leave the grid.
- **Enemy Click Alert** — Clicking an enemy triggers a browser alert (placeholder for future actions).

## 🚀 Quick Start

```sh
# From this directory (packages/2d-box-demo)
npm install
npm run dev
```

Open http://localhost:5173 in your browser to see the demo.

## 📁 Structure

- `src/components/CombatGrid.vue` — The main Konva-based grid component.
- `src/App.vue` — Demo harness with example map data and units.
- `public/map.png` — Background image for the battlefield.

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
