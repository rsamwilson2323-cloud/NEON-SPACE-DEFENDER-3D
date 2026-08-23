import * as THREE from "three";

export const NEON = {
  cyan: 0x00e5ff,
  blue: 0x2563eb,
  purple: 0x8b5cf6,
  magenta: 0xff2fd0,
  white: 0xffffff,
  red: 0xff2d55,
  green: 0x22ffa7,
  amber: 0xffb020,
};

/** Player spaceship: mesh, flight model, hull / shield / energy. */
export class Player {
  readonly group = new THREE.Group();
  readonly velocity = new THREE.Vector3();
  hull = 100;
  maxHull = 100;
  shield = 100;
  maxShield = 100;
  energy = 100;
  maxEnergy = 100;
  shieldCooldown = 0;
  invuln = 0;
  radius = 2.6;

  // temporary power-up buffs
  damageBoost = 0;
  speedBoost = 0;
  rapidFire = 0;
  scoreMul = 0;

  private engineGlowL: THREE.Mesh;
  private engineGlowR: THREE.Mesh;
  private shieldMesh: THREE.Mesh;
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  constructor() {
    const body = new THREE.Group();

    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x0d1b3a,
      metalness: 0.85,
      roughness: 0.28,
      emissive: 0x061426,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: NEON.cyan,
      emissive: NEON.cyan,
      emissiveIntensity: 2.2,
      metalness: 0.3,
      roughness: 0.2,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x7de9ff,
      emissive: 0x2bb6ff,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.75,
      metalness: 0.6,
      roughness: 0.05,
    });
    this.disposables.push(hullMat, trimMat, glassMat);

    // Fuselage
    const fuse = new THREE.Mesh(new THREE.ConeGeometry(1.1, 5.4, 8), hullMat);
    fuse.rotation.x = -Math.PI / 2;
    body.add(fuse);

    // Cockpit
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), glassMat);
    cockpit.position.set(0, 0.42, -0.5);
    cockpit.scale.set(1, 0.7, 1.5);
    body.add(cockpit);

    // Wings
    const wingGeo = new THREE.BoxGeometry(3.4, 0.16, 1.5);
    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(wingGeo, hullMat);
      wing.position.set(s * 2.0, -0.05, 0.7);
      wing.rotation.z = s * 0.12;
      wing.rotation.y = s * -0.22;
      body.add(wing);

      const edge = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.06, 0.16), trimMat);
      edge.position.set(s * 2.0, 0.05, 0.05);
      edge.rotation.z = s * 0.12;
      edge.rotation.y = s * -0.22;
      body.add(edge);

      // weapon mount
      const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.9, 8), hullMat);
      mount.rotation.x = Math.PI / 2;
      mount.position.set(s * 3.1, -0.02, -0.5);
      body.add(mount);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), trimMat);
      tip.position.set(s * 3.1, -0.02, -1.5);
      body.add(tip);
    }
    this.disposables.push(wingGeo);

    // Tail fin
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 1.3), trimMat);
    fin.position.set(0, 0.6, 1.6);
    body.add(fin);

    // Engines
    const engMat = new THREE.MeshStandardMaterial({ color: 0x101a30, metalness: 0.9, roughness: 0.3 });
    this.disposables.push(engMat);
    const glowMat = new THREE.MeshBasicMaterial({ color: NEON.cyan, transparent: true, opacity: 0.95 });
    this.disposables.push(glowMat);
    const glows: THREE.Mesh[] = [];
    for (const s of [-1, 1]) {
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.6, 12), engMat);
      eng.rotation.x = Math.PI / 2;
      eng.position.set(s * 0.95, -0.15, 2.2);
      body.add(eng);
      const glow = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.6, 12, 1, true), glowMat);
      glow.rotation.x = Math.PI / 2;
      glow.position.set(s * 0.95, -0.15, 3.6);
      body.add(glow);
      glows.push(glow);
    }
    this.engineGlowL = glows[0]!;
    this.engineGlowR = glows[1]!;

    // Shield bubble
    const shieldMat = new THREE.MeshBasicMaterial({
      color: NEON.cyan,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    this.disposables.push(shieldMat);
    this.shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(4.2, 18, 14), shieldMat);
    body.add(this.shieldMesh);

    const light = new THREE.PointLight(NEON.cyan, 40, 40);
    light.position.set(0, 0, 3);
    body.add(light);

    this.group.add(body);
    this.group.position.set(0, 0, 0);
  }

  reset() {
    this.hull = this.maxHull;
    this.shield = this.maxShield;
    this.energy = this.maxEnergy;
    this.velocity.set(0, 0, 0);
    this.group.position.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
    this.damageBoost = this.speedBoost = this.rapidFire = this.scoreMul = 0;
    this.invuln = 1.5;
    this.shieldCooldown = 0;
  }

  /** Returns true if damage reached the hull. */
  takeDamage(amount: number): "shield" | "hull" | "none" {
    if (this.invuln > 0) return "none";
    this.shieldCooldown = 4;
    if (this.shield > 0) {
      this.shield = Math.max(0, this.shield - amount);
      return "shield";
    }
    this.hull = Math.max(0, this.hull - amount);
    this.invuln = 0.35;
    return "hull";
  }

  update(
    dt: number,
    input: { forward: number; strafe: number; roll: number },
    boosting: boolean,
    time: number,
  ) {
    const speedMul = 1 + (this.speedBoost > 0 ? 0.45 : 0) + (boosting ? 0.85 : 0);
    const accel = 130 * speedMul;
    const maxSpeed = 46 * speedMul;

    this.velocity.x += input.strafe * accel * dt;
    this.velocity.y += input.forward * accel * dt;
    // drag
    this.velocity.multiplyScalar(1 - Math.min(1, 3.4 * dt));
    this.velocity.clampLength(0, maxSpeed);

    this.group.position.addScaledVector(this.velocity, dt);
    this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, -46, 46);
    this.group.position.y = THREE.MathUtils.clamp(this.group.position.y, -26, 26);

    // banking + roll
    const targetRoll = -this.velocity.x / 60 + (input.roll ? -input.roll * 0.9 : 0);
    const targetPitch = -this.velocity.y / 110;
    this.group.rotation.z += (targetRoll - this.group.rotation.z) * Math.min(1, 6 * dt);
    this.group.rotation.x += (targetPitch - this.group.rotation.x) * Math.min(1, 6 * dt);
    this.group.rotation.y += (-this.velocity.x / 240 - this.group.rotation.y) * Math.min(1, 5 * dt);
    this.group.position.y += Math.sin(time * 1.7) * 0.008;

    // engine glow reacts to boost
    const glowScale = boosting ? 1.9 + Math.sin(time * 40) * 0.18 : 1 + Math.sin(time * 18) * 0.08;
    this.engineGlowL.scale.set(1, glowScale, 1);
    this.engineGlowR.scale.set(1, glowScale, 1);

    // shield visual
    const s = this.shield / this.maxShield;
    const mat = this.shieldMesh.material as THREE.MeshBasicMaterial;
    mat.opacity = s <= 0 ? 0 : 0.06 + s * 0.14 + (this.shieldCooldown > 3.6 ? 0.3 : 0);
    this.shieldMesh.rotation.y += dt * 0.6;

    // regen
    this.shieldCooldown = Math.max(0, this.shieldCooldown - dt);
    if (this.shieldCooldown === 0 && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + 9 * dt);
    }
    this.energy = Math.min(this.maxEnergy, this.energy + (boosting ? 0 : 11) * dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.damageBoost = Math.max(0, this.damageBoost - dt);
    this.speedBoost = Math.max(0, this.speedBoost - dt);
    this.rapidFire = Math.max(0, this.rapidFire - dt);
    this.scoreMul = Math.max(0, this.scoreMul - dt);
  }

  get muzzles(): THREE.Vector3[] {
    const p = this.group.position;
    return [
      new THREE.Vector3(p.x - 3.1, p.y, p.z - 1.6),
      new THREE.Vector3(p.x + 3.1, p.y, p.z - 1.6),
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
