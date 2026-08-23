import * as THREE from "three";
import { NEON } from "./player";

export type PowerUpKind = "health" | "shield" | "energy" | "damage" | "speed" | "rapid" | "score";

export const POWERUP_META: Record<PowerUpKind, { label: string; color: number }> = {
  health: { label: "HULL REPAIR", color: NEON.green },
  shield: { label: "SHIELD BOOST", color: NEON.cyan },
  energy: { label: "ENERGY CELL", color: 0x7dd3fc },
  damage: { label: "DAMAGE UP", color: NEON.red },
  speed: { label: "SPEED UP", color: NEON.amber },
  rapid: { label: "RAPID FIRE", color: NEON.magenta },
  score: { label: "SCORE x2", color: NEON.purple },
};

export interface PowerUp {
  kind: PowerUpKind;
  mesh: THREE.Mesh;
  life: number;
  radius: number;
}

export class PowerUpManager {
  readonly group = new THREE.Group();
  items: PowerUp[] = [];
  private geo = new THREE.OctahedronGeometry(1.5, 0);
  private mats = new Map<PowerUpKind, THREE.MeshStandardMaterial>();

  private material(kind: PowerUpKind) {
    let m = this.mats.get(kind);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color: POWERUP_META[kind].color,
        emissive: POWERUP_META[kind].color,
        emissiveIntensity: 2.4,
        metalness: 0.4,
        roughness: 0.2,
        transparent: true,
        opacity: 0.95,
      });
      this.mats.set(kind, m);
    }
    return m;
  }

  spawn(position: THREE.Vector3, kind?: PowerUpKind) {
    const kinds = Object.keys(POWERUP_META) as PowerUpKind[];
    const k = kind ?? kinds[Math.floor(Math.random() * kinds.length)]!;
    const mesh = new THREE.Mesh(this.geo, this.material(k));
    mesh.position.copy(position);
    this.group.add(mesh);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.12, 6, 20),
      new THREE.MeshBasicMaterial({ color: POWERUP_META[k].color, transparent: true, opacity: 0.7 }),
    );
    mesh.add(halo);
    this.items.push({ kind: k, mesh, life: 16, radius: 3.2 });
  }

  update(dt: number) {
    for (const it of [...this.items]) {
      it.life -= dt;
      it.mesh.rotation.y += dt * 2.2;
      it.mesh.rotation.x += dt * 1.1;
      it.mesh.position.z += 22 * dt;
      it.mesh.scale.setScalar(1 + Math.sin(it.life * 5) * 0.1);
      if (it.life <= 0 || it.mesh.position.z > 40) this.remove(it);
    }
  }

  remove(it: PowerUp) {
    this.group.remove(it.mesh);
    it.mesh.children.forEach((c) => {
      const m = c as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material)?.dispose();
    });
    this.items = this.items.filter((x) => x !== it);
  }

  reset() {
    [...this.items].forEach((i) => this.remove(i));
  }

  dispose() {
    this.reset();
    this.geo.dispose();
    this.mats.forEach((m) => m.dispose());
  }
}
