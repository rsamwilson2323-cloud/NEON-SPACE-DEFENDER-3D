import * as THREE from "three";
import { NEON } from "./player";
import type { WeaponId } from "./types";

export interface WeaponSpec {
  id: WeaponId;
  label: string;
  damage: number;
  cooldown: number;
  energy: number;
  speed: number;
  color: number;
  homing: boolean;
}

export const WEAPONS: Record<WeaponId, WeaponSpec> = {
  laser: {
    id: "laser",
    label: "LASER",
    damage: 12,
    cooldown: 0.12,
    energy: 1.5,
    speed: 220,
    color: NEON.cyan,
    homing: false,
  },
  plasma: {
    id: "plasma",
    label: "PLASMA",
    damage: 34,
    cooldown: 0.36,
    energy: 9,
    speed: 150,
    color: NEON.magenta,
    homing: false,
  },
  missile: {
    id: "missile",
    label: "MISSILE",
    damage: 85,
    cooldown: 0.9,
    energy: 18,
    speed: 110,
    color: NEON.amber,
    homing: true,
  },
};

export interface Projectile {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  damage: number;
  hostile: boolean;
  homing: boolean;
  radius: number;
  target?: THREE.Object3D | null;
  active: boolean;
}

/** Object-pooled projectile manager shared by player, enemies and boss. */
export class ProjectilePool {
  readonly group = new THREE.Group();
  private pool: Projectile[] = [];
  private geo = new THREE.CapsuleGeometry(0.22, 1.6, 4, 8);
  private mats = new Map<number, THREE.MeshBasicMaterial>();

  constructor(private capacity = 260) {
    for (let i = 0; i < capacity; i++) {
      const mesh = new THREE.Mesh(this.geo, this.material(NEON.cyan));
      mesh.visible = false;
      mesh.rotation.x = Math.PI / 2;
      this.group.add(mesh);
      this.pool.push({
        mesh,
        vel: new THREE.Vector3(),
        life: 0,
        damage: 0,
        hostile: false,
        homing: false,
        radius: 0.7,
        active: false,
      });
    }
  }

  private material(color: number) {
    let m = this.mats.get(color);
    if (!m) {
      m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
      this.mats.set(color, m);
    }
    return m;
  }

  spawn(opts: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    damage: number;
    color: number;
    hostile: boolean;
    homing?: boolean;
    life?: number;
    scale?: number;
    target?: THREE.Object3D | null;
  }): Projectile | null {
    const p = this.pool.find((x) => !x.active);
    if (!p) return null;
    p.active = true;
    p.mesh.visible = true;
    p.mesh.material = this.material(opts.color);
    p.mesh.position.copy(opts.position);
    p.mesh.scale.setScalar(opts.scale ?? 1);
    p.vel.copy(opts.velocity);
    p.damage = opts.damage;
    p.hostile = opts.hostile;
    p.homing = opts.homing ?? false;
    p.target = opts.target ?? null;
    p.life = opts.life ?? 3;
    p.radius = 0.8 * (opts.scale ?? 1);
    orient(p.mesh, p.vel);
    return p;
  }

  kill(p: Projectile) {
    p.active = false;
    p.mesh.visible = false;
  }

  get active(): Projectile[] {
    return this.pool.filter((p) => p.active);
  }

  update(dt: number) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        this.kill(p);
        continue;
      }
      if (p.homing && p.target && p.target.parent) {
        const dir = p.target.position.clone().sub(p.mesh.position).normalize();
        p.vel.lerp(dir.multiplyScalar(p.vel.length()), Math.min(1, 3 * dt));
        orient(p.mesh, p.vel);
      }
      p.mesh.position.addScaledVector(p.vel, dt);
    }
  }

  reset() {
    for (const p of this.pool) this.kill(p);
  }

  dispose() {
    this.geo.dispose();
    this.mats.forEach((m) => m.dispose());
  }
}

const up = new THREE.Vector3(0, 1, 0);
function orient(mesh: THREE.Mesh, vel: THREE.Vector3) {
  const dir = vel.clone().normalize();
  mesh.quaternion.setFromUnitVectors(up, dir);
}
