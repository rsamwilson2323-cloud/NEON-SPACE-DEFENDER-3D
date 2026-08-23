export interface InputState {
  forward: number; // -1..1
  strafe: number; // -1..1
  roll: number; // -1..1
  boost: boolean;
  fire: boolean;
  secondary: boolean;
  special: boolean;
  aimX: number; // -1..1 (screen NDC)
  aimY: number;
}

/** Keyboard + mouse + touch aggregation. */
export class InputManager {
  state: InputState = {
    forward: 0,
    strafe: 0,
    roll: 0,
    boost: false,
    fire: false,
    secondary: false,
    special: false,
    aimX: 0,
    aimY: 0,
  };
  private keys = new Set<string>();
  private joy = { x: 0, y: 0, active: false };
  onPause?: () => void;
  onCycleWeapon?: () => void;

  attach(el: HTMLElement) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    el.addEventListener("mousemove", this.onMouseMove);
    el.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    el.addEventListener("contextmenu", this.onContext);
    window.addEventListener("blur", this.clear);
  }

  detach(el: HTMLElement) {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    el.removeEventListener("mousemove", this.onMouseMove);
    el.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    el.removeEventListener("contextmenu", this.onContext);
    window.removeEventListener("blur", this.clear);
  }

  private onContext = (e: Event) => e.preventDefault();

  private onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (k === "p" || k === "escape") {
      this.onPause?.();
      return;
    }
    if (k === "1" || k === "2" || k === "3" || k === "tab") {
      if (k === "tab") e.preventDefault();
      this.onCycleWeapon?.();
      if (k !== "tab") this.keys.add(k);
      return;
    }
    this.keys.add(k);
    this.sync();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
    this.sync();
  };

  private onMouseMove = (e: MouseEvent) => {
    this.state.aimX = (e.clientX / window.innerWidth) * 2 - 1;
    this.state.aimY = -((e.clientY / window.innerHeight) * 2 - 1);
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) this.state.fire = true;
    if (e.button === 2) this.state.secondary = true;
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.state.fire = false;
    if (e.button === 2) this.state.secondary = false;
  };

  private clear = () => {
    this.keys.clear();
    this.state.fire = false;
    this.state.secondary = false;
    this.sync();
  };

  private sync() {
    const k = this.keys;
    const up = k.has("w") || k.has("arrowup");
    const down = k.has("s") || k.has("arrowdown");
    const left = k.has("a") || k.has("arrowleft");
    const right = k.has("d") || k.has("arrowright");
    this.state.forward = (up ? 1 : 0) - (down ? 1 : 0);
    this.state.strafe = (right ? 1 : 0) - (left ? 1 : 0);
    this.state.roll = (k.has("e") ? 1 : 0) - (k.has("q") ? 1 : 0);
    this.state.boost = k.has("shift");
    this.state.special = k.has(" ");
    if (this.joy.active) {
      this.state.forward = -this.joy.y;
      this.state.strafe = this.joy.x;
    }
  }

  // --- Touch API used by the on-screen controls -------------------------
  setJoystick(x: number, y: number, active: boolean) {
    this.joy = { x, y, active };
    if (!active) {
      this.joy.x = 0;
      this.joy.y = 0;
    }
    this.sync();
  }

  setTouchButton(name: "fire" | "boost" | "special" | "secondary", down: boolean) {
    this.state[name] = down;
  }
}
