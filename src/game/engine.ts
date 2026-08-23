import * as THREE from "three";
import { AudioEngine } from "./audio";
import { Boss } from "./boss";
import { Enemy, EnemyFactory, ENEMY_SPECS, pickBehavior, waveComposition } from "./enemies";
import { InputManager } from "./input";
import { ParticleSystem } from "./particles";
import { NEON, Player } from "./player";
import { POWERUP_META, PowerUpManager } from "./powerups";
import {
  DEFAULT_SETTINGS,
  HIGHSCORE_KEY,
  type HudState,
  type Settings,
  type WeaponId,
} from "./types";
import { ProjectilePool, WEAPONS } from "./weapons";
import { World } from "./world";

const WEAPON_ORDER: WeaponId[] = ["laser", "plasma", "missile"];
const MAX_WAVE = 25;

export interface EngineCallbacks {
  onHud: (hud: HudState) => void;
  onGameOver: (stats: { score: number; wave: number; kills: number; time: number }) => void;
  onVictory: (stats: { score: number; wave: number; kills: number; time: number }) => void;
  onEvent?: (message: string) => void;
}

/** Owns the Three.js scene and the whole gameplay simulation loop. */
export class GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raf = 0;
  private running = false;
  private paused = false;
  private disposed = false;

  private world: World;
  private particles = new ParticleSystem(3000);
  private projectiles = new ProjectilePool(300);
  private powerups = new PowerUpManager();
  private factory = new EnemyFactory();
  private player = new Player();
  private input = new InputManager();
  private audio: AudioEngine;

  private enemies: Enemy[] = [];
  private boss: Boss | null = null;
  private bossIndex = 0;
  private bossesDefeated = 0;

  private wave = 1;
  private level = 1;
  private queue: ReturnType<typeof waveComposition> = [];
  private spawnTimer = 0;
  private intermission = 0;
  private score = 0;
  private highScore = 0;
  private kills = 0;
  private combo = 0;
  private comboTimer = 0;
  private elapsed = 0;
  private weapon: WeaponId = "laser";
  private missiles = 12;
  private fireCooldown = 0;
  private specialCharge = 1;
  private shake = 0;
  private banner: string | null = null;
  private bannerTimer = 0;
  private countdown: number | null = null;
  private fps = 60;
  private fpsAcc = 0;
  private fpsFrames = 0;
  private hudTimer = 0;
  private target: Enemy | null = null;

  settings: Settings;

  constructor(
    private canvas: HTMLCanvasElement,
    settings: Settings,
    private cb: EngineCallbacks,
  ) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.audio = new AudioEngine(this.settings);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.settings.graphics !== "LOW",
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.settings.graphics === "ULTRA" ? 2 : 1.5),
    );
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.settings.bloom ? 1.5 : 1.1;

    this.scene.fog = new THREE.FogExp2(0x03040f, 0.0016);
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.camera.position.set(0, 7, 30);

    this.world = new World(this.settings.graphics);
    this.particles.enabled = this.settings.particles;

    this.scene.add(this.world.group);
    this.scene.add(this.particles.points);
    this.scene.add(this.projectiles.group);
    this.scene.add(this.powerups.group);
    this.scene.add(this.player.group);

    this.scene.add(new THREE.AmbientLight(0x4455aa, 1.2));
    const key = new THREE.DirectionalLight(0x88ccff, 2.2);
    key.position.set(-30, 40, 30);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(NEON.magenta, 1.4);
    rim.position.set(30, -20, -40);
    this.scene.add(rim);

    this.highScore = Number(localStorage.getItem(HIGHSCORE_KEY) ?? 0);

    this.input.attach(canvas);
    this.input.onPause = () => this.cbPause?.();
    this.input.onCycleWeapon = () => this.cycleWeapon();
    window.addEventListener("resize", this.onResize);
  }

  cbPause?: () => void;

  get inputManager() {
    return this.input;
  }

  applySettings(s: Settings) {
    this.settings = s;
    this.audio.settings = s;
    this.particles.enabled = s.particles;
    this.renderer.toneMappingExposure = s.bloom ? 1.5 : 1.1;
    if (!s.audio || !s.music) this.audio.stopMusic();
    else if (this.running) this.audio.startMusic();
  }

  // ---- lifecycle --------------------------------------------------------
  start() {
    this.audio.init();
    this.audio.resume();
    this.reset();
    this.running = true;
    this.paused = false;
    this.clock.getDelta();
    if (this.settings.audio && this.settings.music) this.audio.startMusic();
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
    this.startWave(1);
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (p) this.audio.stopMusic();
    else if (this.settings.audio && this.settings.music) this.audio.startMusic();
    this.clock.getDelta();
  }

  stop() {
    this.running = false;
    this.audio.stopMusic();
  }

  private reset() {
    this.enemies.forEach((e) => this.scene.remove(e.group));
    this.enemies = [];
    if (this.boss) {
      this.scene.remove(this.boss.group);
      this.boss.dispose();
      this.boss = null;
    }
    this.projectiles.reset();
    this.particles.reset();
    this.powerups.reset();
    this.player.reset();
    this.wave = 1;
    this.level = 1;
    this.score = 0;
    this.kills = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.elapsed = 0;
    this.missiles = 12;
    this.weapon = "laser";
    this.specialCharge = 1;
    this.bossIndex = 0;
    this.bossesDefeated = 0;
    this.queue = [];
    this.intermission = 0;
    this.countdown = null;
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  // ---- waves ------------------------------------------------------------
  private startWave(wave: number) {
    this.wave = wave;
    this.level = Math.max(1, Math.ceil(wave / 5));
    if (wave % 5 === 0) {
      this.spawnBoss();
      return;
    }
    this.queue = waveComposition(wave);
    this.spawnTimer = 0;
    this.showBanner(`WAVE ${wave}`);
    this.cb.onEvent?.(`WAVE ${wave} INCOMING`);
  }

  private spawnBoss() {
    this.boss = new Boss(this.bossIndex, 1 + this.bossIndex * 0.55);
    this.scene.add(this.boss.group);
    this.showBanner(`WARNING — ${this.boss.name}`);
    this.play("bossWarning");
    this.cb.onEvent?.(`BOSS: ${this.boss.name}`);
  }

  private spawnEnemy(kind: keyof typeof ENEMY_SPECS) {
    const spec = ENEMY_SPECS[kind];
    const mesh = this.factory.create(kind);
    const e = new Enemy(spec, mesh, 1 + (this.wave - 1) * 0.14, pickBehavior(kind));
    e.group.position.set(
      (Math.random() - 0.5) * 130,
      (Math.random() - 0.5) * 70,
      -220 - Math.random() * 140,
    );
    this.enemies.push(e);
    this.scene.add(e.group);
  }

  // ---- combat -----------------------------------------------------------
  cycleWeapon(id?: WeaponId) {
    if (id) this.weapon = id;
    else this.weapon = WEAPON_ORDER[(WEAPON_ORDER.indexOf(this.weapon) + 1) % 3]!;
    this.fireCooldown = 0;
  }

  private play(n: Parameters<AudioEngine["play"]>[0], v = 1) {
    if (this.settings.audio && this.settings.sfx) this.audio.play(n, v);
  }

  private aimPoint() {
    const s = this.input.state;
    const v = new THREE.Vector3(s.aimX, s.aimY, 0.5).unproject(this.camera);
    const dir = v.sub(this.camera.position).normalize();
    const dist = (-180 - this.camera.position.z) / dir.z;
    return this.camera.position.clone().addScaledVector(dir, Math.abs(dist));
  }

  private fire() {
    const spec = WEAPONS[this.weapon];
    if (this.weapon === "missile" && this.missiles <= 0) return;
    if (this.player.energy < spec.energy) return;
    this.player.energy -= spec.energy;
    if (this.weapon === "missile") this.missiles--;

    const dmg = spec.damage * (this.player.damageBoost > 0 ? 1.8 : 1);
    const aim = this.aimPoint();
    for (const m of this.player.muzzles) {
      const dir = aim.clone().sub(m).normalize();
      this.projectiles.spawn({
        position: m,
        velocity: dir.multiplyScalar(spec.speed),
        damage: dmg,
        color: spec.color,
        hostile: false,
        homing: spec.homing,
        target: spec.homing ? (this.target?.group ?? this.boss?.group ?? null) : null,
        life: 3,
        scale: this.weapon === "missile" ? 1.5 : this.weapon === "plasma" ? 1.3 : 1,
      });
      if (this.settings.particles)
        this.particles.spawn(m, 3, { color: spec.color, speed: 8, life: 0.2, size: 0.8 });
    }
    this.play(this.weapon, 0.55);
    this.fireCooldown = spec.cooldown * (this.player.rapidFire > 0 ? 0.45 : 1);
    this.shake = Math.max(this.shake, this.weapon === "laser" ? 0.06 : 0.18);
  }

  private special() {
    if (this.specialCharge < 1) return;
    this.specialCharge = 0;
    this.play("special");
    this.shake = 1;
    const origin = this.player.group.position.clone();
    this.particles.spawn(origin, 220, { color: NEON.cyan, speed: 90, life: 1.2, size: 2.4 });
    for (const e of [...this.enemies]) {
      this.damageEnemy(e, 260);
    }
    if (this.boss) this.boss.damage(320);
    for (const p of this.projectiles.active) if (p.hostile) this.projectiles.kill(p);
  }

  private damageEnemy(e: Enemy, amount: number) {
    e.health -= amount;
    this.particles.spawn(e.group.position, 6, {
      color: e.spec.color,
      speed: 14,
      life: 0.35,
      size: 1,
    });
    if (e.health <= 0 && e.alive) this.killEnemy(e);
  }

  private killEnemy(e: Enemy) {
    e.alive = false;
    this.kills++;
    this.combo++;
    this.comboTimer = 3;
    const mul = (1 + Math.min(this.combo, 20) * 0.1) * (this.player.scoreMul > 0 ? 2 : 1);
    this.score += Math.round(e.spec.score * mul);
    this.particles.explosion(e.group.position, e.spec.radius * 0.5, e.spec.color);
    this.play("explosion", 0.5);
    this.shake = Math.max(this.shake, 0.3);
    if (Math.random() < 0.22) this.powerups.spawn(e.group.position.clone());
    this.scene.remove(e.group);
    this.enemies = this.enemies.filter((x) => x !== e);
    if (this.target === e) this.target = null;
  }

  // ---- loop -------------------------------------------------------------
  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    if (!this.running || this.paused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.step(dt);
    this.renderer.render(this.scene, this.camera);

    this.fpsAcc += dt;
    this.fpsFrames++;
    if (this.fpsAcc > 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsAcc);
      this.fpsAcc = 0;
      this.fpsFrames = 0;
    }
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.cb.onHud(this.hud());
    }
  };

  private step(dt: number) {
    this.elapsed += dt;
    const time = this.elapsed;
    const st = this.input.state;
    const boosting = st.boost && this.player.energy > 4;
    if (boosting) this.player.energy = Math.max(0, this.player.energy - 22 * dt);

    this.player.update(dt, st, boosting, time);
    this.world.update(dt, boosting ? 3.2 : 1, time);
    this.particles.update(dt);
    this.projectiles.update(dt);
    this.powerups.update(dt);

    // engine trail
    if (this.settings.particles) {
      const p = this.player.group.position;
      this.particles.spawn(new THREE.Vector3(p.x, p.y - 0.2, p.z + 4), boosting ? 5 : 2, {
        color: boosting ? NEON.magenta : NEON.cyan,
        speed: 5,
        life: 0.35,
        size: 1.1,
        drift: new THREE.Vector3(0, 0, 26),
      });
    }

    // firing
    this.fireCooldown -= dt;
    if ((st.fire || st.secondary) && this.fireCooldown <= 0) this.fire();
    if (st.special) this.special();
    this.specialCharge = Math.min(1, this.specialCharge + dt / 22);

    // wave spawning
    if (!this.boss) {
      if (this.queue.length) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.enemies.length < 16) {
          this.spawnEnemy(this.queue.shift()!);
          this.spawnTimer = 0.35;
        }
      } else if (this.enemies.length === 0) {
        if (this.intermission === 0) {
          this.intermission = 3.2;
          this.play("waveComplete");
          this.showBanner(`WAVE ${this.wave} CLEAR`);
          this.missiles = Math.min(24, this.missiles + 4);
        }
        this.intermission -= dt;
        this.countdown = Math.max(0, Math.ceil(this.intermission));
        if (this.intermission <= 0) {
          this.intermission = 0;
          this.countdown = null;
          if (this.wave >= MAX_WAVE) return this.finish(true);
          this.startWave(this.wave + 1);
        }
      }
    }

    this.updateEnemies(dt, time);
    this.updateBoss(dt, time);
    this.collisions();
    this.pickups();
    this.updateCamera(dt, boosting);

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.banner = null;
    }
    this.shake = Math.max(0, this.shake - dt * 2.2);

    if (this.player.hull <= 0) this.finish(false);
  }

  private updateEnemies(dt: number, time: number) {
    const pp = this.player.group.position;
    for (const e of [...this.enemies]) {
      e.update(dt, pp, time);
      const dist = e.group.position.distanceTo(pp);
      if (e.canFire(dist, pp)) {
        const dir = pp.clone().sub(e.group.position).normalize();
        this.projectiles.spawn({
          position: e.group.position.clone(),
          velocity: dir.multiplyScalar(90),
          damage: e.spec.damage,
          color: e.spec.color,
          hostile: true,
          life: 4,
        });
      }
      // ramming
      if (dist < e.spec.radius + this.player.radius) {
        this.hitPlayer(e.spec.damage * 1.6);
        this.damageEnemy(e, 120);
      }
    }
    // auto target = nearest enemy to crosshair
    const aim = this.aimPoint();
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      const d = e.group.position.distanceTo(aim);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    this.target = bestD < 90 ? best : null;
  }

  private updateBoss(dt: number, time: number) {
    const b = this.boss;
    if (!b) return;
    const pp = this.player.group.position;
    b.update(dt, pp, time);
    if (b.entering) return;

    if (b.attackTimer <= 0) {
      b.attackTimer = Math.max(0.35, 1.5 - b.phase * 0.45);
      for (const t of b.turrets) {
        const dir = pp.clone().sub(t).normalize();
        this.projectiles.spawn({
          position: t,
          velocity: dir.multiplyScalar(110),
          damage: 16 + b.phase * 8,
          color: NEON.magenta,
          hostile: true,
          life: 5,
          scale: 1.4,
        });
      }
    }
    if (b.minionTimer <= 0) {
      b.minionTimer = 12 - b.phase * 3;
      for (let i = 0; i < 2 + b.phase; i++) this.spawnEnemy(b.phase >= 1 ? "fighter" : "scout");
    }
    if (b.beamTimer <= 0 && b.phase >= 1) {
      b.beamTimer = 9;
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        this.projectiles.spawn({
          position: b.group.position.clone(),
          velocity: new THREE.Vector3(Math.cos(a) * 60, Math.sin(a) * 60, 80),
          damage: 14,
          color: NEON.purple,
          hostile: true,
          life: 5,
        });
      }
    }

    if (b.health <= 0) {
      this.particles.explosion(b.group.position, 6, NEON.magenta);
      this.play("explosion", 1);
      this.shake = 1.2;
      this.score += 5000 * (this.player.scoreMul > 0 ? 2 : 1);
      this.kills++;
      this.bossesDefeated++;
      this.bossIndex++;
      for (let i = 0; i < 4; i++) this.powerups.spawn(b.group.position.clone());
      this.scene.remove(b.group);
      b.dispose();
      this.boss = null;
      this.showBanner("BOSS DESTROYED");
      this.play("waveComplete");
      if (this.wave >= MAX_WAVE) this.finish(true);
      else this.startWave(this.wave + 1);
    }
  }

  private collisions() {
    const pp = this.player.group.position;
    for (const p of this.projectiles.active) {
      if (p.hostile) {
        if (p.mesh.position.distanceTo(pp) < this.player.radius + p.radius) {
          this.hitPlayer(p.damage);
          this.particles.explosion(p.mesh.position, 0.5, NEON.red);
          this.projectiles.kill(p);
        }
        continue;
      }
      let hit = false;
      for (const e of this.enemies) {
        if (p.mesh.position.distanceTo(e.group.position) < e.spec.radius + p.radius) {
          this.damageEnemy(e, p.damage);
          this.play("hit", 0.3);
          hit = true;
          break;
        }
      }
      if (!hit && this.boss && p.mesh.position.distanceTo(this.boss.group.position) < this.boss.radius + p.radius) {
        this.boss.damage(p.damage);
        this.particles.spawn(p.mesh.position, 8, { color: NEON.magenta, speed: 16, life: 0.3 });
        this.play("hit", 0.3);
        hit = true;
      }
      if (hit) this.projectiles.kill(p);
    }

    // asteroids
    for (const a of [...this.world.asteroids]) {
      if (a.mesh.position.distanceTo(pp) < a.radius + this.player.radius) {
        this.hitPlayer(18);
        this.particles.explosion(a.mesh.position, 1.2, 0x88aaff);
        this.world.removeAsteroid(a);
        this.world.spawnAsteroid();
      }
    }
  }

  private hitPlayer(amount: number) {
    const res = this.player.takeDamage(amount);
    if (res === "none") return;
    this.play("hit", 0.7);
    this.combo = 0;
    if (this.settings.screenShake) this.shake = Math.max(this.shake, res === "hull" ? 0.7 : 0.35);
    this.particles.spawn(this.player.group.position, 14, {
      color: res === "hull" ? NEON.red : NEON.cyan,
      speed: 18,
      life: 0.4,
    });
  }

  private pickups() {
    const pp = this.player.group.position;
    for (const it of [...this.powerups.items]) {
      if (it.mesh.position.distanceTo(pp) > it.radius + this.player.radius) continue;
      switch (it.kind) {
        case "health":
          this.player.hull = Math.min(this.player.maxHull, this.player.hull + 30);
          break;
        case "shield":
          this.player.shield = Math.min(this.player.maxShield, this.player.shield + 45);
          break;
        case "energy":
          this.player.energy = this.player.maxEnergy;
          break;
        case "damage":
          this.player.damageBoost = 12;
          break;
        case "speed":
          this.player.speedBoost = 12;
          break;
        case "rapid":
          this.player.rapidFire = 10;
          break;
        case "score":
          this.player.scoreMul = 15;
          break;
      }
      this.play("powerup", 0.6);
      this.showBanner(POWERUP_META[it.kind].label);
      this.particles.spawn(it.mesh.position, 24, {
        color: POWERUP_META[it.kind].color,
        speed: 20,
        life: 0.6,
      });
      this.powerups.remove(it);
    }
  }

  private updateCamera(dt: number, boosting: boolean) {
    const p = this.player.group.position;
    const targetZ = boosting ? 34 : 30;
    const desired = new THREE.Vector3(p.x * 0.45, p.y * 0.4 + 6, p.z + targetZ);
    this.camera.position.lerp(desired, Math.min(1, 4 * dt));
    if (this.settings.screenShake && this.shake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 2.2;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 2.2;
    }
    this.camera.lookAt(p.x * 0.6, p.y * 0.6, p.z - 60);
  }

  private showBanner(text: string) {
    this.banner = text;
    this.bannerTimer = 2.2;
  }

  private finish(victory: boolean) {
    if (!this.running) return;
    this.running = false;
    this.audio.stopMusic();
    this.play(victory ? "victory" : "gameOver");
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(HIGHSCORE_KEY, String(this.score));
    }
    const stats = {
      score: this.score,
      wave: this.wave,
      kills: this.kills,
      time: Math.round(this.elapsed),
    };
    this.cb.onHud(this.hud());
    if (victory) this.cb.onVictory(stats);
    else this.cb.onGameOver(stats);
  }

  hud(): HudState {
    const t = this.target;
    return {
      score: this.score,
      highScore: Math.max(this.highScore, this.score),
      wave: this.wave,
      level: this.level,
      enemiesLeft: this.enemies.length + this.queue.length + (this.boss ? 1 : 0),
      hull: this.player.hull / this.player.maxHull,
      shield: this.player.shield / this.player.maxShield,
      energy: this.player.energy / this.player.maxEnergy,
      weapon: this.weapon,
      missiles: this.missiles,
      combo: this.combo,
      specialReady: this.specialCharge,
      boosting: this.input.state.boost,
      lowEnergy: this.player.energy < 20,
      shieldOffline: this.player.shield <= 0,
      target: t
        ? {
            name: t.spec.label,
            distance: Math.round(t.group.position.distanceTo(this.player.group.position)),
            healthPct: t.health / t.maxHealth,
            isBoss: false,
          }
        : this.boss
          ? {
              name: this.boss.name,
              distance: Math.round(
                this.boss.group.position.distanceTo(this.player.group.position),
              ),
              healthPct: this.boss.health / this.boss.maxHealth,
              isBoss: true,
            }
          : null,
      boss: this.boss
        ? {
            name: this.boss.name,
            health: this.boss.health / this.boss.maxHealth,
            shield: this.boss.shield / this.boss.maxShield,
          }
        : null,
      banner: this.banner,
      countdown: this.countdown,
      fps: this.fps,
      kills: this.kills,
      time: Math.round(this.elapsed),
      bossesDefeated: this.bossesDefeated,
    };
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    this.input.detach(this.canvas);
    this.audio.dispose();
    this.world.dispose();
    this.particles.dispose();
    this.projectiles.dispose();
    this.powerups.dispose();
    this.factory.dispose();
    this.player.dispose();
    this.boss?.dispose();
    this.renderer.dispose();
  }
}
