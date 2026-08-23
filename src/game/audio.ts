import type { Settings } from "./types";

type SfxName =
  | "laser"
  | "plasma"
  | "missile"
  | "explosion"
  | "hit"
  | "boost"
  | "powerup"
  | "bossWarning"
  | "waveComplete"
  | "gameOver"
  | "victory"
  | "special";

/**
 * Procedural WebAudio engine. Sound files can be dropped into
 * `public/assets/sounds/<name>.mp3` later — the loader falls back to the
 * synthesised tone whenever a file is missing, so nothing ever crashes.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private buffers = new Map<SfxName, AudioBuffer>();
  settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  init() {
    if (this.ctx) return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.master);
    } catch {
      this.ctx = null;
    }
  }

  resume() {
    this.init();
    void this.ctx?.resume().catch(() => {});
  }

  /** Optional: preload real audio assets if present. Never throws. */
  async preload(names: Partial<Record<SfxName, string>>) {
    this.init();
    if (!this.ctx) return;
    await Promise.all(
      Object.entries(names).map(async ([name, url]) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return;
          const buf = await this.ctx!.decodeAudioData(await res.arrayBuffer());
          this.buffers.set(name as SfxName, buf);
        } catch {
          /* missing asset — procedural fallback is used */
        }
      }),
    );
  }

  play(name: SfxName, volume = 1) {
    if (!this.settings.audio || !this.settings.sfx) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain) return;

    const file = this.buffers.get(name);
    if (file) {
      const src = ctx.createBufferSource();
      src.buffer = file;
      const g = ctx.createGain();
      g.gain.value = volume;
      src.connect(g).connect(this.sfxGain);
      src.start();
      return;
    }

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.connect(filter).connect(gain).connect(this.sfxGain);

    const cfg: Record<SfxName, () => void> = {
      laser: () => {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(240, t + 0.14);
        filter.type = "bandpass";
        filter.frequency.value = 1400;
        gain.gain.setValueAtTime(0.25 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.stop(t + 0.17);
      },
      plasma: () => {
        osc.type = "square";
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.3);
        gain.gain.setValueAtTime(0.3 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        osc.stop(t + 0.33);
      },
      missile: () => {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.linearRampToValueAtTime(680, t + 0.4);
        gain.gain.setValueAtTime(0.22 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.stop(t + 0.46);
      },
      explosion: () => {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.6);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(900, t);
        filter.frequency.exponentialRampToValueAtTime(80, t + 0.6);
        gain.gain.setValueAtTime(0.45 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
        osc.stop(t + 0.66);
      },
      hit: () => {
        osc.type = "square";
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.18);
        gain.gain.setValueAtTime(0.3 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.stop(t + 0.21);
      },
      boost: () => {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(90, t);
        osc.frequency.linearRampToValueAtTime(320, t + 0.5);
        filter.type = "lowpass";
        filter.frequency.value = 800;
        gain.gain.setValueAtTime(0.14 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.stop(t + 0.56);
      },
      powerup: () => {
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.linearRampToValueAtTime(1400, t + 0.25);
        gain.gain.setValueAtTime(0.25 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.stop(t + 0.31);
      },
      bossWarning: () => {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.linearRampToValueAtTime(70, t + 1.2);
        gain.gain.setValueAtTime(0.3 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
        osc.stop(t + 1.45);
      },
      waveComplete: () => {
        osc.type = "sine";
        osc.frequency.setValueAtTime(660, t);
        osc.frequency.setValueAtTime(880, t + 0.12);
        osc.frequency.setValueAtTime(1320, t + 0.24);
        gain.gain.setValueAtTime(0.24 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.stop(t + 0.51);
      },
      gameOver: () => {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 1.4);
        gain.gain.setValueAtTime(0.3 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        osc.stop(t + 1.55);
      },
      victory: () => {
        osc.type = "triangle";
        [523, 659, 784, 1046].forEach((f, i) => osc.frequency.setValueAtTime(f, t + i * 0.16));
        gain.gain.setValueAtTime(0.28 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        osc.stop(t + 0.95);
      },
      special: () => {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.8);
        filter.type = "lowpass";
        filter.frequency.value = 2000;
        gain.gain.setValueAtTime(0.4 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        osc.stop(t + 0.95);
      },
    };
    osc.start(t);
    cfg[name]();
  }

  startMusic() {
    this.init();
    if (!this.ctx || !this.musicGain || this.musicTimer !== null) return;
    if (!this.settings.audio || !this.settings.music) return;
    const scale = [55, 65.4, 73.4, 87.3, 98, 110];
    let step = 0;
    const tick = () => {
      if (!this.ctx || !this.musicGain) return;
      if (!this.settings.audio || !this.settings.music) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = scale[step % scale.length]! * (step % 8 === 0 ? 2 : 1);
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 600;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.3, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(f).connect(g).connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.55);
      step++;
    };
    this.musicTimer = window.setInterval(tick, 300);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  dispose() {
    this.stopMusic();
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
