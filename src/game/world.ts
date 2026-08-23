import * as THREE from "three";
import { makeSpriteTexture } from "./particles";

export interface Asteroid {
  mesh: THREE.Mesh;
  radius: number;
  spin: THREE.Vector3;
  vel: THREE.Vector3;
}

/** Starfield, nebula, planets, debris and asteroid field. */
export class World {
  readonly group = new THREE.Group();
  asteroids: Asteroid[] = [];
  private stars: THREE.Points;
  private starVel: Float32Array;
  private nebula: THREE.Points;
  private planets: THREE.Mesh[] = [];
  private asteroidGeos: THREE.BufferGeometry[] = [];
  private asteroidMat: THREE.MeshStandardMaterial;

  constructor(private quality: "LOW" | "MEDIUM" | "HIGH" | "ULTRA" = "HIGH") {
    const starCount = { LOW: 1500, MEDIUM: 3500, HIGH: 6000, ULTRA: 9000 }[quality];

    // ---- Starfield -------------------------------------------------------
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);
    const size = new Float32Array(starCount);
    this.starVel = new Float32Array(starCount);
    const palette = [0xffffff, 0x00e5ff, 0x8b5cf6, 0xff2fd0, 0x7dd3fc];
    for (let i = 0; i < starCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 900;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 600;
      pos[i * 3 + 2] = -Math.random() * 1200 + 100;
      const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]!);
      const b = 0.4 + Math.random() * 0.6;
      col[i * 3] = c.r * b;
      col[i * 3 + 1] = c.g * b;
      col[i * 3 + 2] = c.b * b;
      size[i] = 0.6 + Math.random() * 2.4;
      this.starVel[i] = 4 + Math.random() * 26;
    }
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    sgeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    sgeo.setAttribute("size", new THREE.BufferAttribute(size, 1));
    this.stars = new THREE.Points(
      sgeo,
      new THREE.PointsMaterial({
        size: 1.7,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: makeSpriteTexture(),
      }),
    );
    this.stars.frustumCulled = false;
    this.group.add(this.stars);

    // ---- Nebula clouds ---------------------------------------------------
    const nCount = quality === "LOW" ? 250 : 700;
    const npos = new Float32Array(nCount * 3);
    const ncol = new Float32Array(nCount * 3);
    for (let i = 0; i < nCount; i++) {
      npos[i * 3] = (Math.random() - 0.5) * 1400;
      npos[i * 3 + 1] = (Math.random() - 0.5) * 800;
      npos[i * 3 + 2] = -400 - Math.random() * 900;
      const c = new THREE.Color(Math.random() > 0.5 ? 0x6d28d9 : 0x0891b2);
      ncol[i * 3] = c.r;
      ncol[i * 3 + 1] = c.g;
      ncol[i * 3 + 2] = c.b;
    }
    const ngeo = new THREE.BufferGeometry();
    ngeo.setAttribute("position", new THREE.BufferAttribute(npos, 3));
    ngeo.setAttribute("color", new THREE.BufferAttribute(ncol, 3));
    this.nebula = new THREE.Points(
      ngeo,
      new THREE.PointsMaterial({
        size: 160,
        vertexColors: true,
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: makeSpriteTexture(),
      }),
    );
    this.nebula.frustumCulled = false;
    this.group.add(this.nebula);

    // ---- Distant planets -------------------------------------------------
    const planetDefs = [
      { r: 90, color: 0x1e3a8a, emissive: 0x0e7490, pos: [-320, 120, -820] },
      { r: 55, color: 0x4c1d95, emissive: 0x7c3aed, pos: [380, -90, -700] },
      { r: 34, color: 0x831843, emissive: 0xdb2777, pos: [180, 190, -960] },
    ];
    for (const d of planetDefs) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(d.r, 32, 24),
        new THREE.MeshStandardMaterial({
          color: d.color,
          emissive: d.emissive,
          emissiveIntensity: 0.35,
          roughness: 0.9,
          metalness: 0.1,
        }),
      );
      m.position.set(d.pos[0]!, d.pos[1]!, d.pos[2]!);
      this.planets.push(m);
      this.group.add(m);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(d.r * 1.3, d.r * 1.8, 64),
        new THREE.MeshBasicMaterial({
          color: d.emissive,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
        }),
      );
      ring.position.copy(m.position);
      ring.rotation.x = Math.PI / 2.6;
      this.group.add(ring);
    }

    // ---- Asteroid resources ---------------------------------------------
    this.asteroidGeos = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.IcosahedronGeometry(1, 1),
    ].map(deform);
    this.asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x2a3350,
      emissive: 0x0b3b52,
      emissiveIntensity: 0.4,
      roughness: 0.95,
      metalness: 0.15,
      flatShading: true,
    });

    const count = quality === "LOW" ? 10 : quality === "ULTRA" ? 26 : 18;
    for (let i = 0; i < count; i++) this.spawnAsteroid(true);
  }

  spawnAsteroid(initial = false) {
    const geo = this.asteroidGeos[Math.floor(Math.random() * this.asteroidGeos.length)]!;
    const radius = 2 + Math.random() * 9;
    const mesh = new THREE.Mesh(geo, this.asteroidMat);
    mesh.scale.setScalar(radius);
    mesh.position.set(
      (Math.random() - 0.5) * 180,
      (Math.random() - 0.5) * 110,
      initial ? -Math.random() * 400 : -420 - Math.random() * 120,
    );
    const a: Asteroid = {
      mesh,
      radius,
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2,
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        14 + Math.random() * 24,
      ),
    };
    this.asteroids.push(a);
    this.group.add(mesh);
  }

  removeAsteroid(a: Asteroid) {
    this.group.remove(a.mesh);
    this.asteroids = this.asteroids.filter((x) => x !== a);
  }

  update(dt: number, speedMul: number, time: number) {
    // Stars stream toward the camera; boost multiplies flow speed.
    const sp = this.stars.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = sp.array as Float32Array;
    for (let i = 0; i < this.starVel.length; i++) {
      arr[i * 3 + 2] = arr[i * 3 + 2]! + this.starVel[i]! * speedMul * dt;
      if (arr[i * 3 + 2]! > 120) {
        arr[i * 3] = (Math.random() - 0.5) * 900;
        arr[i * 3 + 1] = (Math.random() - 0.5) * 600;
        arr[i * 3 + 2] = -1100;
      }
    }
    sp.needsUpdate = true;

    this.nebula.rotation.z += dt * 0.01;
    this.planets.forEach((p, i) => {
      p.rotation.y += dt * 0.02 * (i + 1);
    });

    for (const a of [...this.asteroids]) {
      a.mesh.position.addScaledVector(a.vel, dt * speedMul);
      a.mesh.rotation.x += a.spin.x * dt;
      a.mesh.rotation.y += a.spin.y * dt;
      a.mesh.rotation.z += a.spin.z * dt;
      if (a.mesh.position.z > 90) {
        this.removeAsteroid(a);
        this.spawnAsteroid();
      }
    }
    void time;
  }

  dispose() {
    this.stars.geometry.dispose();
    (this.stars.material as THREE.Material).dispose();
    this.nebula.geometry.dispose();
    (this.nebula.material as THREE.Material).dispose();
    this.asteroidGeos.forEach((g) => g.dispose());
    this.asteroidMat.dispose();
    this.planets.forEach((p) => p.geometry.dispose());
  }
}

function deform(geo: THREE.BufferGeometry) {
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const f = 0.75 + Math.random() * 0.5;
    pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f, pos.getZ(i) * f);
  }
  geo.computeVertexNormals();
  return geo;
}
