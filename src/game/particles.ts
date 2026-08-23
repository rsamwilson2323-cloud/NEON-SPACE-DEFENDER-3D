import * as THREE from "three";

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
  active: boolean;
}

/**
 * Pooled GPU particle system. A single THREE.Points object holds every
 * particle so explosions / trails never allocate new geometry at runtime.
 */
export class ParticleSystem {
  readonly points: THREE.Points;
  private pool: Particle[] = [];
  private cursor = 0;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  enabled = true;

  constructor(private capacity = 3000) {
    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(capacity * 3);
    this.colors = new Float32Array(capacity * 3);
    this.sizes = new Float32Array(capacity);
    geo.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(this.sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: makeSpriteTexture(),
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;

    for (let i = 0; i < capacity; i++) {
      this.pool.push({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        size: 1,
        color: new THREE.Color(),
        active: false,
      });
    }
  }

  spawn(
    origin: THREE.Vector3,
    count: number,
    opts: {
      color: number | THREE.Color;
      speed?: number;
      life?: number;
      size?: number;
      spread?: THREE.Vector3;
      drift?: THREE.Vector3;
    },
  ) {
    if (!this.enabled) count = Math.ceil(count * 0.25);
    const color = new THREE.Color(opts.color as number);
    const speed = opts.speed ?? 20;
    const life = opts.life ?? 0.8;
    const size = opts.size ?? 1;

    for (let i = 0; i < count; i++) {
      const p = this.pool[this.cursor]!;
      this.cursor = (this.cursor + 1) % this.capacity;
      p.active = true;
      p.pos.copy(origin);
      if (opts.spread) {
        p.pos.x += (Math.random() - 0.5) * opts.spread.x;
        p.pos.y += (Math.random() - 0.5) * opts.spread.y;
        p.pos.z += (Math.random() - 0.5) * opts.spread.z;
      }
      p.vel
        .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(speed * (0.35 + Math.random()));
      if (opts.drift) p.vel.add(opts.drift);
      p.maxLife = life * (0.6 + Math.random() * 0.7);
      p.life = p.maxLife;
      p.size = size * (0.6 + Math.random());
      p.color.copy(color);
    }
  }

  explosion(origin: THREE.Vector3, scale = 1, color = 0x00e5ff) {
    this.spawn(origin, Math.round(40 * scale), {
      color,
      speed: 26 * scale,
      life: 0.9,
      size: 1.6 * scale,
    });
    this.spawn(origin, Math.round(20 * scale), {
      color: 0xffffff,
      speed: 40 * scale,
      life: 0.4,
      size: 1.1 * scale,
    });
  }

  update(dt: number) {
    let n = 0;
    for (let i = 0; i < this.capacity; i++) {
      const p = this.pool[i]!;
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.pos.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(1 - 1.8 * dt);
      const t = p.life / p.maxLife;
      this.positions[n * 3] = p.pos.x;
      this.positions[n * 3 + 1] = p.pos.y;
      this.positions[n * 3 + 2] = p.pos.z;
      this.colors[n * 3] = p.color.r * t;
      this.colors[n * 3 + 1] = p.color.g * t;
      this.colors[n * 3 + 2] = p.color.b * t;
      this.sizes[n] = p.size * t;
      n++;
    }
    const geo = this.points.geometry;
    geo.setDrawRange(0, n);
    (geo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute("size") as THREE.BufferAttribute).needsUpdate = true;
  }

  reset() {
    for (const p of this.pool) p.active = false;
  }

  dispose() {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}

let spriteTex: THREE.Texture | null = null;
export function makeSpriteTexture(): THREE.Texture {
  if (spriteTex) return spriteTex;
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  spriteTex = new THREE.CanvasTexture(c);
  return spriteTex;
}
