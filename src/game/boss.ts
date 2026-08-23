import * as THREE from "three";
import { NEON } from "./player";

export const BOSS_NAMES = [
  "VOID DESTROYER",
  "CRIMSON LEVIATHAN",
  "NEBULA TYRANT",
  "OBSIDIAN WARDEN",
  "OMEGA SINGULARITY",
];

/** Huge multi-phase boss ship. */
export class Boss {
  readonly group = new THREE.Group();
  readonly name: string;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  radius = 12;
  attackTimer = 2;
  minionTimer = 8;
  beamTimer = 12;
  phase = 0;
  entering = true;
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
  private core: THREE.Mesh;
  private rings: THREE.Mesh[] = [];

  constructor(index: number, difficulty: number) {
    this.name = BOSS_NAMES[index % BOSS_NAMES.length]!;
    this.maxHealth = 1800 * difficulty;
    this.health = this.maxHealth;
    this.maxShield = 600 * difficulty;
    this.shield = this.maxShield;

    const hull = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      emissive: 0x2b0b3f,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.25,
      flatShading: true,
    });
    const trim = new THREE.MeshStandardMaterial({
      color: 0x1a0020,
      emissive: NEON.magenta,
      emissiveIntensity: 2.6,
      metalness: 0.5,
      roughness: 0.2,
    });
    this.disposables.push(hull, trim);

    const spine = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 26), hull);
    this.group.add(spine);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(4.4, 12, 6), hull);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -17;
    this.group.add(nose);

    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(18, 1.6, 12), hull);
      wing.position.set(s * 12, 0, 2);
      wing.rotation.z = s * 0.1;
      this.group.add(wing);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 1.2), trim);
      edge.position.set(s * 12, 1.1, -4);
      this.group.add(edge);
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 8, 10), trim);
      pod.rotation.x = Math.PI / 2;
      pod.position.set(s * 19, 0, -2);
      this.group.add(pod);
      const engine = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.6, 5, 12), trim);
      engine.rotation.x = Math.PI / 2;
      engine.position.set(s * 5, 0, 15);
      this.group.add(engine);
    }

    this.core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.4, 1),
      new THREE.MeshBasicMaterial({ color: NEON.magenta }),
    );
    this.core.position.set(0, 0, -4);
    this.group.add(this.core);

    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(
        new THREE.TorusGeometry(6 + i * 2.4, 0.28, 8, 40),
        new THREE.MeshBasicMaterial({ color: i % 2 ? NEON.cyan : NEON.purple, transparent: true, opacity: 0.8 }),
      );
      r.position.z = -4;
      r.rotation.x = Math.random();
      r.rotation.y = Math.random();
      this.rings.push(r);
      this.group.add(r);
    }

    this.group.add(new THREE.PointLight(NEON.magenta, 220, 160));
    this.group.position.set(0, 6, -320);
  }

  update(dt: number, target: THREE.Vector3, time: number) {
    if (this.entering) {
      this.group.position.z += 46 * dt;
      if (this.group.position.z >= -120) this.entering = false;
    } else {
      const t = time * 0.45;
      const rangeX = 46;
      this.group.position.x += (Math.sin(t) * rangeX - this.group.position.x) * Math.min(1, dt * 1.2);
      this.group.position.y +=
        (Math.cos(t * 0.8) * 16 + 6 - this.group.position.y) * Math.min(1, dt * 1.2);
      const desiredZ = this.phase >= 1 ? -95 : -125;
      this.group.position.z += (desiredZ - this.group.position.z) * Math.min(1, dt * 0.6);
    }

    this.group.lookAt(target.x * 0.3, target.y * 0.3, target.z);
    this.rings.forEach((r, i) => {
      r.rotation.x += dt * (0.3 + i * 0.2);
      r.rotation.y += dt * (0.2 + i * 0.15);
    });
    const pulse = 1 + Math.sin(time * 6) * 0.08;
    this.core.scale.setScalar(pulse);

    this.attackTimer -= dt;
    this.minionTimer -= dt;
    this.beamTimer -= dt;

    const hp = this.health / this.maxHealth;
    this.phase = hp < 0.33 ? 2 : hp < 0.66 ? 1 : 0;
  }

  damage(amount: number) {
    if (this.shield > 0) {
      this.shield = Math.max(0, this.shield - amount);
      return;
    }
    this.health = Math.max(0, this.health - amount);
  }

  get turrets(): THREE.Vector3[] {
    const p = this.group.position;
    return [
      new THREE.Vector3(p.x - 19, p.y, p.z + 6),
      new THREE.Vector3(p.x + 19, p.y, p.z + 6),
      new THREE.Vector3(p.x, p.y, p.z + 12),
    ];
  }

  dispose() {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    this.disposables.forEach((d) => d.dispose());
  }
}
