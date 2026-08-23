# 🚀 NEON SPACE DEFENDER 3D

> 👾 A futuristic 3D space survival shooter built for the browser with WebGL, Three.js, and a neon arcade aesthetic.

<p align="center">

**🚀 DEFEND • DESTROY • SURVIVE 🌌**

</p>

<p align="center">
  Fight endless waves of enemies, defeat powerful bosses, collect power-ups, and survive the neon galaxy.
</p>

---

## 🌌 About The Game

**NEON SPACE DEFENDER 3D** is a futuristic browser-based 3D space survival shooter focused on fast-paced arcade combat, neon visuals, enemy waves, boss battles, and responsive gameplay.

Take control of a futuristic spacecraft and defend yourself against increasingly powerful enemies.

Survive waves, destroy enemy ships, collect power-ups, manage your **Hull, Shield, and Energy**, and achieve the highest score possible.

### 🎯 Main Objectives

* 🚀 Pilot your spaceship
* 🔫 Destroy enemy spacecraft
* 🌊 Survive increasingly difficult waves
* ☠️ Defeat powerful bosses
* ⚡ Collect power-ups
* 🛡️ Manage shields and hull health
* 🏆 Build kill combos
* 🌌 Survive as long as possible
* 💯 Beat your high score

---

# ✨ Features

## 🚀 3D Spaceship Combat

* Third-person 3D spaceship gameplay
* Mouse-based aiming
* Smooth movement
* Primary laser weapon
* Homing missiles
* Special Nova ability
* Boost system
* Camera shake
* Roll and tilt effects
* Engine glow and boost trails

---

## 🌌 Immersive Space Environment

The game features a futuristic neon space environment containing:

* ⭐ Animated starfields
* 🌌 Deep-space backgrounds
* 🪐 Distant planets
* ☄️ Asteroids
* 💫 Explosion particles
* ✨ Neon glow effects
* 🌈 Atmospheric visual effects
* 🎨 Dynamic lighting

---

# 👾 Enemy System

Different enemy classes have unique stats and behaviors.

| Enemy      |    Health |  Speed | Damage | Behavior          |
| ---------- | --------: | -----: | -----: | ----------------- |
| 🔹 Scout   |       Low |   High |    Low | Direct chase      |
| 🔹 Fighter |    Medium | Medium | Medium | Strafing movement |
| 🔹 Tank    | Very High |    Low |   High | Armored push      |
| 🔹 Drone   |       Low |   High |    Low | Erratic movement  |
| 🔹 Elite   |      High |   High |   High | Circle and attack |

Enemies are designed to behave differently rather than simply flying directly toward the player.

---

# 🌊 Wave System

Enemy difficulty increases as the player progresses through the waves.

```text
WAVE 01 → Light scout squads
WAVE 02 → Scouts + fighters
WAVE 03 → Scouts + fighters + tanks
WAVE 04 → Fighters + tanks + drones
WAVE 05 → ☠ BOSS WAVE
```

Every **5th wave** introduces a boss encounter.

### Campaign Mode

Campaign Mode progresses up to:

```text
WAVE 25
```

### Endless Mode

Endless Mode allows the player to continue surviving beyond the campaign waves.

After every completed wave:

```text
WAVE COMPLETE

NEXT WAVE IN 3
```

---

# ☠️ Boss Battles

## ☠️ VOID DESTROYER

The **Void Destroyer** is the primary boss enemy.

### Boss Features

* Massive 3D structure
* Rotating ring system
* Spike array
* Large health pool
* Scaling health across encounters
* Volley-based attacks
* Minion spawning
* Dedicated boss HUD
* Boss health bar

Example:

```text
☠ VOID DESTROYER MK.2

BOSS HEALTH
████████████████████
```

After defeating a boss:

```text
BOSS DEFEATED

+15000 SCORE
```

---

# 🔫 Weapon System

The player has multiple weapons and abilities.

| Weapon           | Damage    | Fire Rate   | Description                  |
| ---------------- | --------- | ----------- | ---------------------------- |
| 🔵 Primary Laser | Medium    | High        | Unlimited mouse-aimed weapon |
| 🔴 Missile       | Very High | Low         | Limited homing ammunition    |
| 💥 Special Nova  | Extreme   | Full Energy | Powerful area attack         |

---

# ❤️ Hull, 🛡️ Shield & 🔋 Energy

The player must manage three primary resources.

```text
HULL     ████████████████ 100%
SHIELD   ████████████████ 100%
ENERGY   ████████████████ 100%
```

### ❤️ Hull

The hull represents the player's actual health.

When the hull reaches zero:

```text
GAME OVER
```

### 🛡️ Shield

The shield absorbs incoming damage before the hull.

It can regenerate after the player avoids taking damage for a short period.

### 🔋 Energy

Energy powers:

* 🚀 Boost
* 💥 Special Nova

Energy regenerates automatically over time.

---

# 🚀 Boost System

Boost increases the spaceship's movement speed.

### Desktop

Hold:

```text
SHIFT
```

### Mobile

Use:

```text
BOOST
```

Boost effects include:

* Increased movement speed
* Stronger engine glow
* Starfield streaking
* Boost trails
* Energy consumption

---

# ⚡ Power-Ups

Destroyed enemies can drop different power-ups.

Available power-ups include:

| Power-Up           | Effect                    |
| ------------------ | ------------------------- |
| ❤️ HEALTH          | Restores hull             |
| 🛡️ SHIELD         | Restores shield           |
| ⚡ ENERGY           | Restores energy           |
| 🔫 DAMAGE          | Temporary damage boost    |
| 🚀 SPEED           | Temporary speed boost     |
| 💥 RAPID FIRE      | Temporary fire-rate boost |
| ⭐ SCORE MULTIPLIER | Increases score           |

Power-ups are visually highlighted with glowing effects and move toward the player when collected.

---

# 🎯 Target Lock & Crosshair

A futuristic targeting reticle helps identify enemies.

Example:

```text
TARGET LOCK

SCOUT
245m
```

Bosses receive dedicated targeting and HUD indicators.

---

# 🏆 Scoring & Combos

Destroying enemies rewards the player with points.

| Enemy   | Points |
| ------- | -----: |
| Scout   |   +100 |
| Drone   |   +150 |
| Fighter |   +250 |
| Tank    |   +500 |
| Elite   |  +1000 |
| Boss    | +15000 |

---

## 🔥 Combo System

Consecutive enemy kills increase the combo multiplier.

```text
COMBO x2
COMBO x3
COMBO x4
```

Maintaining combos allows skilled players to achieve significantly higher scores.

---

# 💾 High Scores

High scores and game settings are stored locally in the browser using:

```text
localStorage
```

This allows scores and preferences to persist between sessions.

---

# 🎮 Controls

## 🖥️ Desktop

| Key / Input   | Action          |
| ------------- | --------------- |
| `W A S D`     | Move            |
| `Arrow Keys`  | Move            |
| `Mouse`       | Aim             |
| `Left Click`  | Fire Laser      |
| `Right Click` | Fire Missile    |
| `SHIFT`       | Boost           |
| `SPACE`       | Special Ability |
| `Q`           | Roll Left       |
| `E`           | Roll Right      |
| `P`           | Pause           |
| `ESC`         | Pause           |

---

## 📱 Mobile

Touch controls are automatically enabled on touch-capable devices.

### Controls

* 🕹️ Left virtual joystick → Movement
* 🔫 FIRE → Primary weapon
* 🚀 BOOST → Speed boost
* 💥 SPECIAL → Special ability

The interface is designed to adapt to mobile and tablet screens.

---

# 🖥️ HUD

The game provides a futuristic heads-up display.

```text
┌─────────────────────────────────────────────┐
│ SCORE                 WAVE 05          LEVEL 03
│ HIGH SCORE             ENEMIES: 08          │
│                                             │
│                                             │
│                                             │
│ HULL     ████████████                       │
│ SHIELD   ████████████      WEAPON: LASER   │
│ ENERGY   ████████████      MISSILES: 08    │
└─────────────────────────────────────────────┘
```

---

# 🖥️ Game Screens

The game contains multiple UI screens.

### 🚀 Start Screen

Includes:

* START GAME
* ENDLESS MODE
* HOW TO PLAY
* SETTINGS

### 📖 How To Play

Provides information about:

* Controls
* Weapons
* Abilities
* Survival mechanics
* Enemy types

### ⚙️ Settings

Available settings include:

* 🔊 Audio
* 🎵 Music
* 💥 SFX
* 🎨 Graphics quality
* ✨ Particles
* 📳 Screen shake

Graphics presets:

```text
LOW
MEDIUM
HIGH
ULTRA
```

### ⏸️ Pause Menu

Includes:

* Resume
* Restart
* Quit

### ☠️ Game Over

Displays:

* Final score
* High score
* Wave reached
* Enemies destroyed
* Survival time
* Best combo

Example:

```text
MISSION FAILED

FINAL SCORE  00012500
WAVE         08
```

### 🏆 Victory Screen

Displays:

* Final score
* Bosses defeated
* Waves cleared
* High score

---

# 🎨 Visual Style

The game follows a futuristic neon arcade design.

### Color Palette

* 🔵 Neon Cyan
* 🟣 Electric Purple
* 💗 Magenta
* 🌌 Deep Space Blue

### UI Style

* Glass-style HUD panels
* Backdrop blur
* Neon borders
* Glow effects
* Particle effects
* Futuristic typography
* High-contrast interface

---

# 🔊 Audio

Game sound effects are generated using the **Web Audio API**.

No external audio files are required for the synthesized effects.

Audio settings can be controlled independently.

```text
Audio
Music
SFX
```

Players can enable or disable these settings through the Settings menu.

---

# 🛠️ Technology Stack

| Technology       | Purpose                              |
| ---------------- | ------------------------------------ |
| ⚡ Vite           | Development server and build tooling |
| ⚛️ React         | User interface                       |
| 📘 TypeScript    | Type-safe application logic          |
| 🎮 Three.js      | 3D rendering                         |
| 🧊 WebGL         | Hardware-accelerated graphics        |
| 🎨 CSS           | UI styling                           |
| 💾 LocalStorage  | Persistent settings and scores       |
| 🔊 Web Audio API | Real-time audio effects              |
| 📦 npm / Bun     | Package management                   |

---

# 📂 Project Structure

```text
NEON-SPACE-DEFENDER-3D/
│
├── 📄 .gitignore
├── 📄 .prettierignore
├── 📄 .prettierrc
├── 📄 bun.lock
├── 📄 bunfig.toml
├── 📄 components.json
├── 📄 eslint.config.js
├── 📄 HOW_TO_RUN.md
├── 📄 package-lock.json
├── 📄 package.json
├── 📄 README.md
├── 📄 run.bat
├── 📄 tsconfig.json
├── 📄 vite.config.ts
│
├── 📁 src/
│   └── Application source code
│
└── 📁 node_modules/
    └── Installed dependencies
```

> `node_modules/` is generated automatically and should not be committed to Git.

---

# ⚙️ Requirements

Before running the project, make sure you have:

* Node.js 20+
* npm
* A modern web browser
* WebGL-compatible graphics hardware
* Internet connection for installing dependencies

Recommended:

```text
Node.js 20+
npm 10+
```

---

# 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/rsamwilson2323-cloud/NEON-SPACE-DEFENDER-3D.git
```

Enter the project directory:

```bash
cd NEON-SPACE-DEFENDER-3D
```

Install dependencies:

```bash
npm install
```

---

# ▶️ Run The Game

Start the Vite development server:

```bash
npm run dev
```

The game will normally be available at:

```text
http://localhost:5173
```

---

# 🪟 Windows Quick Start

A `run.bat` launcher is included for Windows users.

Simply double-click:

```text
run.bat
```

The launcher checks Node.js, installs dependencies when necessary, and starts the development server.

You can then open:

```text
http://localhost:5173
```

---

# 🌐 Network Access

To make the development server accessible from other devices on the same network:

```bash
npm run dev -- --host 0.0.0.0
```

Then use the displayed network address from Vite.

For example:

```text
Local:
http://localhost:5173

Network:
http://192.168.1.100:5173
```

Your computer and mobile device must be connected to the same network.

---

# 🧠 Performance

The game is designed with performance in mind.

Optimization techniques include:

* `requestAnimationFrame` rendering
* Object cleanup and pruning
* Particle management
* Configurable graphics quality
* Adjustable particle effects
* Optional screen shake
* WebGL hardware acceleration
* Responsive rendering

### Graphics Presets

Players can choose:

```text
LOW
MEDIUM
HIGH
ULTRA
```

If performance is low, reduce the graphics quality and disable unnecessary particle effects.

---

# 📱 Responsive Design

The interface supports:

* 🖥️ Desktop
* 💻 Laptop
* 📱 Mobile
* 📲 Tablet

Touch controls automatically adapt to supported devices.

The interface uses touch-friendly controls to prevent accidental scrolling and interaction conflicts during gameplay.

---

# 🐛 Troubleshooting

## ❌ `npm` Is Not Recognized

Install Node.js and restart your terminal.

Check:

```bash
node -v
npm -v
```

---

## ❌ Dependencies Are Missing

Run:

```bash
npm install
```

Then start the project:

```bash
npm run dev
```

---

## ❌ Vite Is Not Found

Run:

```bash
npm install
```

If the problem continues:

```bash
npm install vite
```

Then:

```bash
npm run dev
```

---

## ❌ Blank Screen

Open the browser developer console:

```text
F12 → Console
```

Look for JavaScript or WebGL errors.

Also confirm that your browser supports WebGL.

---

## ❌ Low FPS

Try:

1. Set Graphics to **Low**
2. Disable Particles
3. Disable Screen Shake
4. Close unnecessary browser tabs
5. Use a browser with hardware acceleration enabled

---

## ❌ Port 5173 Is Already In Use

Start Vite on another port:

```bash
npm run dev -- --port 5174
```

Then open:

```text
http://localhost:5174
```

---

# 🔐 Git & GitHub

To initialize the project as a Git repository:

```bash
git init
```

Add all project files:

```bash
git add .
```

Create the first commit:

```bash
git commit -m "Initial commit"
```

Add the GitHub remote:

```bash
git remote add origin https://github.com/rsamwilson2323-cloud/NEON-SPACE-DEFENDER-3D.git
```

Push the project:

```bash
git branch -M main
git push -u origin main
```

---

# 🚫 Files Not Recommended for Git

Do not commit:

```text
node_modules/
```

The `.gitignore` file should exclude generated dependencies and other unnecessary files.

Install dependencies again after cloning with:

```bash
npm install
```

---

# 🚀 Future Improvements

Potential future features include:

* 🎵 Dynamic soundtrack
* 🎶 Adaptive boss music
* 🏆 Global leaderboard
* 🥇 Achievements
* 🚀 Multiple playable ships
* 🔫 Weapon upgrades
* 🧰 Custom loadouts
* 🌌 Multiple galaxies
* 🪐 New environments
* 👾 Additional enemy classes
* ☠️ Multi-phase bosses
* 🎮 Gamepad support
* ⌨️ Custom key bindings
* 🌐 Online multiplayer
* 🤝 Cooperative missions

---

# 🤝 Contributing

Contributions and improvements are welcome.

### Basic workflow

```bash
git clone https://github.com/rsamwilson2323-cloud/NEON-SPACE-DEFENDER-3D.git

cd NEON-SPACE-DEFENDER-3D

npm install

npm run dev
```

Create your changes, test them locally, and submit a pull request.

---

# ⚠️ Disclaimer

This project is intended for:

* 🎓 Educational purposes
* 🧪 Experimental development
* 🎮 Game development learning
* 🚀 Personal projects
* 🎉 Entertainment

It is a browser-based game project and is not intended to represent production-grade commercial game infrastructure.

---

# 📜 License

This project is licensed under the **MIT License**.

You are free to:

* ✅ Use the project
* ✅ Study the source code
* ✅ Modify the project
* ✅ Create derivative works
* ✅ Distribute copies
* ✅ Use it for learning and development

---

# 🚀 Final Mission

```text
╔══════════════════════════════════════════╗
║                                          ║
║       🚀 NEON SPACE DEFENDER 3D         ║
║                                          ║
║       👾 GALAXY UNDER ATTACK             ║
║                                          ║
║             🚀 DEPLOY                    ║
║             🔫 FIRE                      ║
║             ⚡ BOOST                     ║
║             🛡️ SURVIVE                  ║
║             ☠️ DESTROY                  ║
║             🏆 CONQUER                  ║
║                                          ║
╚══════════════════════════════════════════╝
```

## 🌌 Defend the galaxy.

## 🚀 Destroy the enemy.

## 👾 Survive every wave.

## 🏆 Become the ultimate Space Defender.

---

<p align="center">

**Made with 🚀 + 🎮 + 💜**

</p>
