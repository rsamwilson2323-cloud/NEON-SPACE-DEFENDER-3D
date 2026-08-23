# NEON SPACE DEFENDER 3D — run it locally

## Windows (easiest)

1. Install [Node.js 20 or newer](https://nodejs.org) (LTS build).
2. Unzip this folder anywhere.
3. Double-click **run.bat**.
   - First run downloads all packages (a few minutes).
   - Then the game opens at http://localhost:5173

To stop the server, close the black console window.

## macOS / Linux

```bash
npm install
npm run dev -- --port 5173
```

Then open http://localhost:5173

## Production build

```bash
npm run build
npm run preview
```

## Controls

- W A S D / Arrows — fly
- Mouse — aim, Left click — fire
- 1 / 2 / 3 / Tab — laser, plasma, missiles
- Shift — boost, Space — nova special, Q / E — roll
- P / Esc — pause

On phones/tablets a virtual joystick and buttons appear automatically.

## Settings

The Settings screen has audio, graphics quality and a GROQ API KEY field.
The key is stored only in your browser's localStorage and is never uploaded.

## Project layout

```
src/game/     game engine (engine, player, enemies, boss, weapons, world, particles, audio, input, powerups)
src/routes/   React UI: HUD, menus, settings, mobile controls
src/styles.css neon design tokens
```
