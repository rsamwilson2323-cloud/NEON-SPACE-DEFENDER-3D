import * as THREE from "three";
import { NEON } from "./player";
import type { EnemyKind } from "./types";

export type Behavior = "chase" | "strafe" | "circle" | "retreat" | "erratic" | "flank" | "run";

export interface EnemySpec {
  kind: EnemyKind;
  label: string;
  health: number;
  speed: number;
  damage: number;
  radius: number;
  fireRate: number;
  color: number;
  score: number;
}

export const ENEMY_SPECS: Record<Exclude<EnemyKind, "boss">, EnemySpec> = {
  scout: {
    kind: "scout",
    label: "SCOUT",
    health: 30,
    speed: 34,
    damage: 8,
    radius: 1.8,
    fireRate: 2.4,
    color: NEON.red,
    score: 100,
  },
  drone: {
    kind: "drone",
    label: "DRONE",
    health: 26,
    speed: 40,
    damage: 7,
    radius: 1.6,
    fireRate: 2.0,
    color: 0xff7ad9,
    score: 150,
  },
  fighter: {
    kind: "fighter",
    label: "FIGHTER",
    health: 70,
    speed: 26,
    damage: 14,
    radius: 2.4,
    fireRate: 1.6,
    color: 0xff5a3c,
    score: 250,
  },
  tank: {
    kind: "tank",
    label: "TANK",
    health: 240,
    speed: 13,
    damage: 26,
    radius: 4.2,
    fireRate: 1.2,
    color: 0xb45309,
    score: 500,
  },
  elite: {
    kind: "elite",
    label: "ELITE",
    health: 160,
    speed: 32,
    damage: 22,
    radius: 3.0,
    fireRate: 0.9,
    color: NEON.purple,
    score: 1000,
  },
};

export class Enemy {
  readonly group = new THREE.Group();
  health: number;
  maxHealth: number;
  behavior: Behavior;
  fireTimer: number;
  phase = Math.random() * Math.PI * 2;
  angle = Math.random() * Math.PI * 2;
  alive = true;

  constructor(
    readonly spec: EnemySpec,
    mesh: THREE.Object3D,
    healthMul: number,
    behavior: Behavior,
  ) {
    this.group.add(mesh);
    this.maxHealth = spec.health * healthMul;
    this.health = this.maxHealth;
    this.behavior = behavior;
    this.fireTimer = 1 + Math.random() * 2;
  }

  update(dt: number, target: THREE.Vector3, time: number) {
    const p = this.group.position;
    const toPlayer = target.clone().sub(p);
    const dist = toPlayer.length();
    const dir = toPlayer.normalize();
    const spd = this.spec.speed;
    const move = new THREE.Vector3();

    switch (this.behavior) {
      case "chase":
        move.copy(dir).multiplyScalar(spd);
        break;
      case "strafe":
        move.copy(dir).multiplyScalar(dist > 70 ? spd : spd * 0.25);
        move.x += Math.sin(time * 1.6 + this.phase) * spd * 0.9;
        move.y += Math.cos(time * 1.1 + this.phase) * spd * 0.4;
        break;
      case "circle": {
        this.angle += dt * 0.8;
        const r = 34;
        const desired = new THREE.Vector3(
          target.x + Math.cos(this.angle) * r,
          target.y + Math.sin(this.angle) * r * 0.6,
          target.z - 55,
        );
        move.copy(desired.sub(p)).clampLength(0, spd);
        break;
      }
      case "retreat":
        move.copy(dir).multiplyScalar(dist < 60 ? -spd * 0.8 : spd * 0.8);
        break;
      case "erratic":
        move.set(
          Math.sin(time * 3.4 + this.phase) * spd,
          Math.cos(time * 2.7 + this.phase * 1.7) * spd,
          dir.z * spd * 0.7 + Math.sin(time * 1.3 + this.phase) * spd * 0.3,
        );
        break;
      case "flank":
        move.copy(dir).multiplyScalar(spd * 0.6);
        move.x += Math.sign(Math.sin(this.phase)) * spd * 1.1;
        break;
      case "run":
        move.copy(dir).multiplyScalar(spd * 1.4);
        break;
    }

    // keep enemies in front of the player — they never slip behind/past the ship
    const maxZ = target.z - 26;
    if (p.z > maxZ) move.z = -Math.abs(spd);
    p.addScaledVector(move, dt);
    p.z = Math.min(p.z, maxZ);
    p.x = THREE.MathUtils.clamp(p.x, -95, 95);
    p.y = THREE.MathUtils.clamp(p.y, -55, 55);

    this.group.lookAt(target);
    this.group.rotateY(Math.PI);
    this.group.rotation.z += Math.sin(time * 2 + this.phase) * 0.02;

    this.fireTimer -= dt;
  }

  /** Only fires while ahead of the player and roughly on screen. */
  canFire(dist: number, playerPos?: THREE.Vector3) {
    if (playerPos) {
      const p = this.group.position;
      if (p.z > playerPos.z - 24) return false;
      if (Math.abs(p.x - playerPos.x) > 80 || Math.abs(p.y - playerPos.y) > 50) return false;
    }
    if (this.fireTimer > 0 || dist > 220) return false;
    this.fireTimer = this.spec.fireRate * (0.7 + Math.random() * 0.8);
    return true;
  }

}

/** Builds distinct low-poly neon meshes per enemy class. */
export class EnemyFactory {
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  private mat(color: number, emissive = 1.4) {
    const m = new THREE.MeshStandardMaterial({
      color: 0x120a1e,
      emissive: color,
      emissiveIntensity: emissive,
      metalness: 0.8,
      roughness: 0.3,
      flatShading: true,
    });
    this.disposables.push(m);
    return m;
  }

  /** Shared aircraft silhouette: fuselage, cockpit, swept wings, tail, engines. */
  private plane(
    body: THREE.Material,
    trim: THREE.Material,
    o: { len: number; span: number; thick: number; engines: number },
  ): THREE.Group {
    const g = new THREE.Group();

    const fuse = new THREE.Mesh(new THREE.ConeGeometry(o.thick, o.len, 8), body);
    fuse.rotation.x = Math.PI / 2;
    g.add(fuse);

    const tailCone = new THREE.Mesh(
      new THREE.CylinderGeometry(o.thick * 0.9, o.thick * 0.45, o.len * 0.45, 8),
      body,
    );
    tailCone.rotation.x = Math.PI / 2;
    tailCone.position.z = o.len * 0.42;
    g.add(tailCone);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(o.thick * 0.55, 10, 8), trim);
    canopy.scale.set(1, 0.55, 1.6);
    canopy.position.set(0, o.thick * 0.4, o.len * 0.05);
    g.add(canopy);

    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(o.span, o.thick * 0.14, o.len * 0.34), body);
      wing.position.set((s * o.span) / 2, 0, o.len * 0.12);
      wing.rotation.y = s * -0.3;
      wing.rotation.z = s * 0.1;
      g.add(wing);

      const edge = new THREE.Mesh(new THREE.BoxGeometry(o.span, o.thick * 0.07, o.len * 0.06), trim);
      edge.position.set((s * o.span) / 2, o.thick * 0.1, o.len * 0.0);
      edge.rotation.y = s * -0.3;
      g.add(edge);

      // tailplane
      const tp = new THREE.Mesh(
        new THREE.BoxGeometry(o.span * 0.4, o.thick * 0.1, o.len * 0.16),
        body,
      );
      tp.position.set((s * o.span) / 5, 0, o.len * 0.56);
      g.add(tp);

      for (let i = 0; i < o.engines / 2; i++) {
        const eng = new THREE.Mesh(
          new THREE.CylinderGeometry(o.thick * 0.32, o.thick * 0.36, o.len * 0.3, 10),
          body,
        );
        eng.rotation.x = Math.PI / 2;
        eng.position.set(s * o.thick * (0.9 + i * 1.4), -o.thick * 0.15, o.len * 0.4);
        g.add(eng);
        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(o.thick * 0.3, o.len * 0.36, 10, 1, true),
          trim,
        );
        flame.rotation.x = -Math.PI / 2;
        flame.position.set(s * o.thick * (0.9 + i * 1.4), -o.thick * 0.15, o.len * 0.62);
        g.add(flame);
      }
    }

    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(o.thick * 0.12, o.thick * 1.1, o.len * 0.2),
      trim,
    );
    fin.position.set(0, o.thick * 0.7, o.len * 0.5);
    g.add(fin);

    return g;
  }

  create(kind: Exclude<EnemyKind, "boss">): THREE.Object3D {
    const spec = ENEMY_SPECS[kind];
    const body = this.mat(spec.color, 0.6);
    const trim = this.mat(spec.color, 3);

    const dims: Record<Exclude<EnemyKind, "boss">, { len: number; span: number; thick: number; engines: number }> = {
      scout: { len: 4.0, span: 2.6, thick: 0.85, engines: 2 },
      drone: { len: 3.4, span: 3.2, thick: 0.7, engines: 2 },
      fighter: { len: 5.4, span: 3.8, thick: 1.15, engines: 2 },
      tank: { len: 8.6, span: 6.4, thick: 2.1, engines: 4 },
      elite: { len: 6.6, span: 5.0, thick: 1.5, engines: 4 },
    };

    const g = this.plane(body, trim, dims[kind]);

    if (kind === "elite") {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.14, 8, 22), trim);
      ring.rotation.x = Math.PI / 2;
      ring.position.z = 1.4;
      g.add(ring);
    }
    if (kind === "tank") {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.4, 1.8), trim);
      plate.position.set(0, 1.4, 0.6);
      g.add(plate);
    }

    const light = new THREE.PointLight(spec.color, 12, 26);
    g.add(light);
    return g;
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}


const BEHAVIORS: Record<Exclude<EnemyKind, "boss">, Behavior[]> = {
  scout: ["run", "strafe", "erratic"],
  drone: ["erratic", "circle", "flank"],
  fighter: ["strafe", "chase", "flank"],
  tank: ["chase", "retreat"],
  elite: ["circle", "flank", "strafe", "retreat"],
};

export function pickBehavior(kind: Exclude<EnemyKind, "boss">): Behavior {
  const list = BEHAVIORS[kind];
  return list[Math.floor(Math.random() * list.length)]!;
}

/** Wave composition scales with wave number. */
export function waveComposition(wave: number): Exclude<EnemyKind, "boss">[] {
  const out: Exclude<EnemyKind, "boss">[] = [];
  const push = (k: Exclude<EnemyKind, "boss">, n: number) => {
    for (let i = 0; i < n; i++) out.push(k);
  };
  const w = wave;
  push("scout", Math.min(10, 2 + Math.floor(w * 0.8)));
  if (w >= 2) push("fighter", Math.min(9, Math.floor(w * 0.7)));
  if (w >= 3) push("tank", Math.min(5, Math.floor((w - 1) / 3)));
  if (w >= 4) push("drone", Math.min(8, Math.floor(w * 0.5)));
  if (w >= 5 && w % 5 !== 0) push("elite", Math.min(4, Math.floor(w / 5)));
  if (w % 5 === 0) push("elite", 3);
  return out;
}
