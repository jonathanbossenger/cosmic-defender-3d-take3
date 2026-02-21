# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start Vite dev server (opens browser automatically)
- `npm run build` - Production build to `dist/`
- `npm run preview` - Preview production build locally

No test framework, linter, or type checker is configured.

## Architecture

Cosmic Defender 3D is a first-person wave-based shooter built with Three.js and Vite. The active development is on the `rebuild` branch. Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`.

### Entry Point and Game Loop

`src/main.js` creates `src/Game.js`, which is the central orchestrator. Game.js owns the Three.js renderer/scene/camera, instantiates all subsystems, and runs the game loop via `requestAnimationFrame`. The `_updateGameplay(dt)` method is the main tick: it processes input, updates player/weapon/projectiles/enemies, runs collision checks via Combat, manages waves, updates particles, applies screen shake, and refreshes the HUD.

### State Machine

Game states: `LOADING -> MENU -> PLAYING -> PAUSED -> GAME_OVER`. Pointer lock is requested on PLAYING, released on pause/game over. Losing pointer lock while PLAYING triggers pause.

### Object Pooling

Projectiles, enemies, and particles all use pre-allocated pools. Instances have `active` flags and `activate()`/`deactivate()` methods. The pool managers maintain an `active` array that is iterated in reverse for safe removal during updates. Pool sizes: 80 projectiles, 40 enemies, 500 particles.

### Collision Detection

Distance-based (no physics engine despite cannon-es being in package.json). `Combat.checkPlayerProjectiles()` tests player projectile positions against enemy bounding sphere radii. `Combat.checkEnemyProjectiles()` tests enemy projectile positions against a fixed player radius (0.5). Each projectile can only hit one target per frame.

### Rendering and UI Split

3D rendering is Three.js. All UI (HUD, screens, menus) is DOM-based, defined in `index.html` with inline CSS. The HUD class reads DOM element references by ID in its constructor. Screens class manages show/hide of overlay screens and persists high scores via `localStorage`.

### Audio

Fully procedural via Web Audio API (`src/core/Audio.js`). No audio files - all sounds are synthesized in real-time using oscillators and noise buffers. Music is a looping synthwave pattern built from sawtooth bass, hi-hats, and sine pads. Audio context is initialized lazily on first user interaction.

### Key Constants

- Arena radius: 15m (player boundary: 14m)
- Enemy spawn radius: 20m
- Player move speed: 6 m/s
- Weapon: 20-round magazine, 4 shots/sec, 1.5s reload, 50 m/s projectile speed
- Enemy types: `drone` (20hp, green octahedron) and `soldier` (40hp, blue dodecahedron, burst fire)
- Soldiers appear from wave 3
- Combo multiplier: +0.1x per consecutive kill, max 3.0x, resets after 2s timeout

### Path Alias

`@` is aliased to `src/` in `vite.config.js`, though current imports use relative paths.

### Deployment

Vite `base` is set to `/cosmic-defender-3d-take3/` for GitHub Pages. The deploy workflow builds on push to `main`.
