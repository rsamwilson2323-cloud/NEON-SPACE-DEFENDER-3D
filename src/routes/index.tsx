import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine } from "@/game/engine";
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  HIGHSCORE_KEY,
  type GamePhase,
  type GraphicsQuality,
  type HudState,
  type Settings,
  type WeaponId,
} from "@/game/types";
import { WEAPONS } from "@/game/weapons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Neon Space Defender 3D — Arcade Space Shooter" },
      {
        name: "description",
        content:
          "Pilot a neon starfighter through 25 waves of enemies, bosses and asteroid fields in this 3D browser arcade shooter built with Three.js.",
      },
      { property: "og:title", content: "Neon Space Defender 3D" },
      {
        property: "og:description",
        content: "Defend the galaxy across 25 neon waves of 3D arcade combat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

const EMPTY_HUD: HudState = {
  score: 0,
  highScore: 0,
  wave: 1,
  level: 1,
  enemiesLeft: 0,
  hull: 1,
  shield: 1,
  energy: 1,
  weapon: "laser",
  missiles: 12,
  combo: 0,
  specialReady: 1,
  boosting: false,
  lowEnergy: false,
  shieldOffline: false,
  target: null,
  boss: null,
  banner: null,
  countdown: null,
  fps: 60,
  kills: 0,
  time: 0,
  bossesDefeated: 0,
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState({ score: 0, wave: 1, kills: 0, time: 0 });
  const [highScore, setHighScore] = useState(0);
  const phaseRef = useRef<GamePhase>("menu");
  phaseRef.current = phase;

  useEffect(() => {
    setSettings(loadSettings());
    setHighScore(Number(localStorage.getItem(HIGHSCORE_KEY) ?? 0));
  }, []);

  // create engine once
  useEffect(() => {
    if (!canvasRef.current || engineRef.current) return;
    const engine = new GameEngine(canvasRef.current, loadSettings(), {
      onHud: setHud,
      onGameOver: (s) => {
        setStats(s);
        setPhase("gameover");
        setHighScore(Number(localStorage.getItem(HIGHSCORE_KEY) ?? 0));
      },
      onVictory: (s) => {
        setStats(s);
        setPhase("victory");
        setHighScore(Number(localStorage.getItem(HIGHSCORE_KEY) ?? 0));
      },
    });
    engine.cbPause = () => {
      const p = phaseRef.current;
      if (p === "playing") {
        engine.setPaused(true);
        setPhase("paused");
      } else if (p === "paused") {
        engine.setPaused(false);
        setPhase("playing");
      }
    };
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.applySettings(settings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const startGame = useCallback(() => {
    engineRef.current?.start();
    setPhase("playing");
  }, []);

  const resume = useCallback(() => {
    engineRef.current?.setPaused(false);
    setPhase("playing");
  }, []);

  const quitToMenu = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current?.setPaused(true);
    setPhase("menu");
  }, []);

  const playing = phase === "playing";

  return (
    <main className="relative h-screen w-screen overflow-hidden text-foreground select-none">
      <h1 className="sr-only">Neon Space Defender 3D</h1>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.72))]" />

      {playing && <Hud hud={hud} />}
      {playing && <TouchControls engine={engineRef} />}

      {phase === "menu" && (
        <Menu
          highScore={highScore}
          onStart={startGame}
          onHowTo={() => setPhase("howto")}
          onSettings={() => setPhase("settings")}
        />
      )}
      {phase === "howto" && <HowTo onBack={() => setPhase("menu")} />}
      {phase === "settings" && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onBack={() => setPhase("menu")}
        />
      )}
      {phase === "paused" && (
        <Overlay title="PAUSED" accent="text-neon-cyan">
          <div className="flex flex-col gap-3">
            <NeonButton onClick={resume}>RESUME</NeonButton>
            <NeonButton onClick={startGame} variant="ghost">
              RESTART
            </NeonButton>
            <NeonButton onClick={quitToMenu} variant="ghost">
              MAIN MENU
            </NeonButton>
          </div>
        </Overlay>
      )}
      {(phase === "gameover" || phase === "victory") && (
        <Overlay
          title={phase === "victory" ? "GALAXY DEFENDED" : "SHIP DESTROYED"}
          accent={phase === "victory" ? "text-neon-green" : "text-neon-red"}
        >
          <dl className="mb-6 grid grid-cols-2 gap-x-8 gap-y-2 font-display text-sm">
            <Stat label="SCORE" value={stats.score.toLocaleString()} />
            <Stat label="HIGH SCORE" value={highScore.toLocaleString()} />
            <Stat label="WAVE" value={String(stats.wave)} />
            <Stat label="KILLS" value={String(stats.kills)} />
            <Stat label="TIME" value={formatTime(stats.time)} />
            <Stat label="BOSSES" value={String(hud.bossesDefeated)} />
          </dl>
          <div className="flex flex-col gap-3">
            <NeonButton onClick={startGame}>PLAY AGAIN</NeonButton>
            <NeonButton onClick={quitToMenu} variant="ghost">
              MAIN MENU
            </NeonButton>
          </div>
        </Overlay>
      )}
    </main>
  );
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-1">
      <dt className="text-[10px] tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="text-neon-cyan text-glow">{value}</dd>
    </div>
  );
}

/* ------------------------------- HUD ---------------------------------- */

function Bar({
  value,
  color,
  label,
  warn,
}: {
  value: number;
  color: string;
  label: string;
  warn?: boolean;
}) {
  return (
    <div className={warn ? "pulse-warn" : ""}>
      <div className="mb-1 flex justify-between font-display text-[10px] tracking-[0.2em] text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 w-44 border border-border bg-background/70">
        <div
          className={`h-full ${color} transition-[width] duration-150`}
          style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        />
      </div>
    </div>
  );
}

function Hud({ hud }: { hud: HudState }) {
  return (
    <div className="pointer-events-none absolute inset-0 font-display">
      {/* top left: score */}
      <div className="panel absolute left-4 top-4 rounded px-4 py-3">
        <div className="text-[10px] tracking-[0.25em] text-muted-foreground">SCORE</div>
        <div className="text-2xl text-neon-cyan text-glow">{hud.score.toLocaleString()}</div>
        <div className="text-[10px] tracking-[0.2em] text-muted-foreground">
          HIGH {hud.highScore.toLocaleString()}
        </div>
        {hud.combo > 1 && (
          <div className="mt-1 text-sm text-neon-amber text-glow">COMBO x{hud.combo}</div>
        )}
      </div>

      {/* top center: wave */}
      <div className="panel absolute left-1/2 top-4 -translate-x-1/2 rounded px-6 py-2 text-center">
        <div className="text-[10px] tracking-[0.25em] text-muted-foreground">
          SECTOR {hud.level}
        </div>
        <div className="text-lg text-neon-magenta text-glow">WAVE {hud.wave}</div>
        <div className="text-[10px] tracking-[0.2em] text-muted-foreground">
          HOSTILES {hud.enemiesLeft}
        </div>
      </div>

      {/* top right: fps + target */}
      <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
        <div className="panel rounded px-3 py-1 text-[10px] tracking-[0.2em] text-muted-foreground">
          {hud.fps} FPS · {formatTime(hud.time)}
        </div>
        {hud.target && (
          <div className="panel w-48 rounded px-3 py-2">
            <div className="text-[10px] tracking-[0.2em] text-muted-foreground">TARGET</div>
            <div className={hud.target.isBoss ? "text-neon-red text-glow" : "text-neon-cyan"}>
              {hud.target.name}
            </div>
            <div className="mt-1 h-1.5 border border-border">
              <div
                className="h-full bg-neon-red"
                style={{ width: `${hud.target.healthPct * 100}%` }}
              />
            </div>
            <div className="mt-1 text-right text-[10px] text-muted-foreground">
              {hud.target.distance}m
            </div>
          </div>
        )}
      </div>

      {/* bottom left: vitals */}
      <div className="panel absolute bottom-4 left-4 flex flex-col gap-2 rounded px-4 py-3">
        <Bar value={hud.hull} color="bg-neon-red" label="HULL" warn={hud.hull < 0.3} />
        <Bar
          value={hud.shield}
          color="bg-neon-cyan"
          label="SHIELD"
          warn={hud.shieldOffline}
        />
        <Bar value={hud.energy} color="bg-neon-green" label="ENERGY" warn={hud.lowEnergy} />
      </div>

      {/* bottom right: weapons */}
      <div className="panel absolute bottom-4 right-4 rounded px-4 py-3 text-right">
        <div className="text-[10px] tracking-[0.25em] text-muted-foreground">WEAPON</div>
        <div className="text-lg text-neon-amber text-glow">{WEAPONS[hud.weapon].label}</div>
        <div className="text-[10px] tracking-[0.2em] text-muted-foreground">
          MISSILES {hud.missiles}
        </div>
        <div className="mt-2 text-[10px] tracking-[0.2em] text-muted-foreground">SPECIAL</div>
        <div className="ml-auto h-2 w-36 border border-border">
          <div
            className={hud.specialReady >= 1 ? "h-full bg-neon-magenta pulse-warn" : "h-full bg-neon-purple"}
            style={{ width: `${hud.specialReady * 100}%` }}
          />
        </div>
      </div>

      {/* boss bar */}
      {hud.boss && (
        <div className="panel absolute left-1/2 top-28 w-[min(680px,80vw)] -translate-x-1/2 rounded px-4 py-3">
          <div className="mb-1 flex justify-between text-xs tracking-[0.25em] text-neon-red text-glow">
            <span>{hud.boss.name}</span>
            <span>{Math.round(hud.boss.health * 100)}%</span>
          </div>
          <div className="h-3 border border-border">
            <div className="h-full bg-neon-red" style={{ width: `${hud.boss.health * 100}%` }} />
          </div>
          {hud.boss.shield > 0 && (
            <div className="mt-1 h-1.5 border border-border">
              <div
                className="h-full bg-neon-cyan"
                style={{ width: `${hud.boss.shield * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* crosshair */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-10 w-10">
          <div className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-neon-cyan" />
          <div className="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-neon-cyan" />
          <div className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-neon-cyan" />
          <div className="absolute right-0 top-1/2 h-px w-3 -translate-y-1/2 bg-neon-cyan" />
          <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan" />
        </div>
      </div>

      {/* banners */}
      {hud.banner && (
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 text-center text-3xl tracking-[0.3em] text-neon-magenta text-glow">
          {hud.banner}
        </div>
      )}
      {hud.countdown !== null && hud.countdown > 0 && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 text-6xl text-neon-cyan text-glow">
          {hud.countdown}
        </div>
      )}
      {hud.hull < 0.3 && (
        <div className="pointer-events-none absolute inset-0 border-[12px] border-neon-red/30 pulse-warn" />
      )}
    </div>
  );
}

/* ----------------------------- Screens -------------------------------- */

function NeonButton({
  children,
  onClick,
  variant = "solid",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "solid" | "ghost";
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded border px-8 py-3 font-display text-sm tracking-[0.3em] transition-all ${
        variant === "solid"
          ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan text-glow hover:bg-neon-cyan/25"
          : "border-border text-muted-foreground hover:border-neon-magenta hover:text-neon-magenta"
      }`}
    >
      {children}
    </button>
  );
}

function Overlay({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-md rounded-lg p-8 text-center">
        <h2 className={`mb-6 font-display text-2xl tracking-[0.3em] ${accent} text-glow`}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function Menu({
  highScore,
  onStart,
  onHowTo,
  onSettings,
}: {
  highScore: number;
  onStart: () => void;
  onHowTo: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <p className="font-display text-xs tracking-[0.5em] text-neon-magenta text-glow">
          NEON
        </p>
        <p className="font-display text-5xl leading-tight tracking-[0.15em] text-neon-cyan text-glow sm:text-6xl">
          SPACE
          <br />
          DEFENDER
        </p>
        <p className="mb-8 font-display text-xl tracking-[0.6em] text-neon-purple text-glow">3D</p>
        <p className="mb-8 text-sm tracking-[0.2em] text-muted-foreground">
          DEFEND THE GALAXY · SURVIVE 25 WAVES · BEAT 5 BOSSES
        </p>
        <div className="mx-auto flex max-w-xs flex-col gap-3">
          <NeonButton onClick={onStart}>START MISSION</NeonButton>
          <NeonButton onClick={onHowTo} variant="ghost">
            HOW TO PLAY
          </NeonButton>
          <NeonButton onClick={onSettings} variant="ghost">
            SETTINGS
          </NeonButton>
        </div>
        <p className="mt-8 font-display text-xs tracking-[0.3em] text-muted-foreground">
          HIGH SCORE <span className="text-neon-amber text-glow">{highScore.toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
}

const CONTROLS: [string, string][] = [
  ["W A S D / ARROWS", "Fly the ship"],
  ["MOUSE", "Aim"],
  ["LEFT CLICK", "Fire weapon"],
  ["1 / 2 / 3 / TAB", "Cycle laser, plasma, missiles"],
  ["SHIFT", "Boost (burns energy)"],
  ["SPACE", "Special: nova blast"],
  ["Q / E", "Roll"],
  ["P / ESC", "Pause"],
];

function HowTo({ onBack }: { onBack: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-auto bg-background/70 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-xl rounded-lg p-8">
        <h2 className="mb-6 text-center font-display text-2xl tracking-[0.3em] text-neon-cyan text-glow">
          HOW TO PLAY
        </h2>
        <ul className="mb-6 space-y-2 text-sm">
          {CONTROLS.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-6 border-b border-border/50 pb-1">
              <span className="font-display text-[11px] tracking-[0.2em] text-neon-amber">{k}</span>
              <span className="text-muted-foreground">{v}</span>
            </li>
          ))}
        </ul>
        <p className="mb-6 text-sm text-muted-foreground">
          Shields regenerate when you avoid damage. Collect glowing power-ups for repairs, damage,
          speed, rapid fire and double score. Every 5th wave launches a multi-phase boss.
        </p>
        <NeonButton onClick={onBack} variant="ghost">
          BACK
        </NeonButton>
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between border-b border-border/50 py-2 font-display text-[11px] tracking-[0.2em]"
    >
      <span className="text-muted-foreground">{label}</span>
      <span className={value ? "text-neon-green text-glow" : "text-muted-foreground"}>
        {value ? "ON" : "OFF"}
      </span>
    </button>
  );
}

const QUALITIES: GraphicsQuality[] = ["LOW", "MEDIUM", "HIGH", "ULTRA"];

function SettingsPanel({
  settings,
  onChange,
  onBack,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onBack: () => void;
}) {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    onChange({ ...settings, [k]: v });

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-auto bg-background/70 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-md rounded-lg p-8">
        <h2 className="mb-6 text-center font-display text-2xl tracking-[0.3em] text-neon-cyan text-glow">
          SETTINGS
        </h2>
        <Toggle label="AUDIO" value={settings.audio} onChange={(v) => set("audio", v)} />
        <Toggle label="MUSIC" value={settings.music} onChange={(v) => set("music", v)} />
        <Toggle label="SOUND FX" value={settings.sfx} onChange={(v) => set("sfx", v)} />
        <Toggle label="BLOOM" value={settings.bloom} onChange={(v) => set("bloom", v)} />
        <Toggle label="PARTICLES" value={settings.particles} onChange={(v) => set("particles", v)} />
        <Toggle
          label="SCREEN SHAKE"
          value={settings.screenShake}
          onChange={(v) => set("screenShake", v)}
        />

        <div className="mt-4">
          <div className="mb-2 font-display text-[11px] tracking-[0.2em] text-muted-foreground">
            GRAPHICS
          </div>
          <div className="grid grid-cols-4 gap-2">
            {QUALITIES.map((q) => (
              <button
                key={q}
                onClick={() => set("graphics", q)}
                className={`border py-2 font-display text-[10px] tracking-[0.15em] ${
                  settings.graphics === q
                    ? "border-neon-cyan text-neon-cyan text-glow"
                    : "border-border text-muted-foreground"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Graphics quality applies on next page reload.
          </p>
        </div>

        <div className="mt-5">
          <label
            htmlFor="groq"
            className="mb-2 block font-display text-[11px] tracking-[0.2em] text-muted-foreground"
          >
            GROQ API KEY
          </label>
          <input
            id="groq"
            type="password"
            value={settings.groqApiKey}
            onChange={(e) => set("groqApiKey", e.target.value)}
            placeholder="gsk_..."
            className="w-full rounded border border-input bg-background/70 px-3 py-2 text-sm outline-none focus:border-neon-cyan"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Stored only in this browser (localStorage). Never sent anywhere by the game.
          </p>
        </div>

        <div className="mt-6">
          <NeonButton onClick={onBack} variant="ghost">
            BACK
          </NeonButton>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Touch controls ---------------------------- */

function TouchControls({ engine }: { engine: React.RefObject<GameEngine | null> }) {
  const padRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const move = (e: React.TouchEvent) => {
    const el = padRef.current;
    const t = e.touches[0];
    if (!el || !t) return;
    const r = el.getBoundingClientRect();
    const dx = (t.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (t.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const x = Math.max(-1, Math.min(1, dx));
    const y = Math.max(-1, Math.min(1, dy));
    setKnob({ x, y });
    engine.current?.inputManager.setJoystick(x, y, true);
  };

  const end = () => {
    setKnob({ x: 0, y: 0 });
    engine.current?.inputManager.setJoystick(0, 0, false);
  };

  const btn = (name: "fire" | "boost" | "special", label: string, cls: string) => (
    <button
      key={name}
      onTouchStart={() => engine.current?.inputManager.setTouchButton(name, true)}
      onTouchEnd={() => engine.current?.inputManager.setTouchButton(name, false)}
      className={`h-16 w-16 rounded-full border font-display text-[10px] tracking-[0.15em] ${cls}`}
    >
      {label}
    </button>
  );

  return (
    <div className="pointer-events-none absolute inset-0 md:hidden">
      <div
        ref={padRef}
        onTouchStart={move}
        onTouchMove={move}
        onTouchEnd={end}
        className="pointer-events-auto absolute bottom-6 left-6 h-32 w-32 rounded-full border border-neon-cyan/50 bg-background/40"
      >
        <div
          className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neon-cyan bg-neon-cyan/20"
          style={{ transform: `translate(calc(-50% + ${knob.x * 40}px), calc(-50% + ${knob.y * 40}px))` }}
        />
      </div>
      <div className="pointer-events-auto absolute bottom-6 right-6 flex flex-col items-end gap-3">
        <div className="flex gap-3">
          {btn("boost", "BOOST", "border-neon-amber text-neon-amber bg-background/40")}
          {btn("special", "NOVA", "border-neon-magenta text-neon-magenta bg-background/40")}
        </div>
        {btn("fire", "FIRE", "border-neon-cyan text-neon-cyan bg-neon-cyan/15 h-20 w-20")}
      </div>
      <button
        onTouchStart={() => engine.current?.cycleWeapon()}
        className="pointer-events-auto absolute right-6 top-32 rounded border border-border bg-background/50 px-3 py-2 font-display text-[10px] tracking-[0.2em] text-muted-foreground"
      >
        WEAPON
      </button>
    </div>
  );
}

export type { WeaponId };
