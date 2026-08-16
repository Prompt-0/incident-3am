/**
 * INCIDENT: 3:07 AM — Master UI Manager
 * Controls VHS Camcorder overlay, Night-Vision HUD, Objectives, Subtitles, and Jumpscares.
 */

export class UIManager {
  private static instance: UIManager;

  // DOM Elements
  private hudTimecode!: HTMLElement;
  private batteryFill!: HTMLElement;
  private batteryPct!: HTMLElement;
  private bpmValue!: HTMLElement;
  private objText!: HTMLElement;
  private warningBanner!: HTMLElement;
  private warningText!: HTMLElement;
  private interactPrompt!: HTMLElement;
  private interactLabel!: HTMLElement;
  private subtitleBox!: HTMLElement;
  private camcorderHud!: HTMLElement;
  private peepholeOverlay!: HTMLElement;
  private frostOverlay!: HTMLElement;
  private glitchLayer!: HTMLElement;
  private jumpscareFlash!: HTMLElement;
  private startModal!: HTMLElement;
  private deathModal!: HTMLElement;
  private victoryModal!: HTMLElement;
  private deathCause!: HTMLElement;
  private deathTime!: HTMLElement;

  private subtitleTimeout: number | null = null;

  private constructor() {
    this.cacheDOMElements();
  }

  public static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  private cacheDOMElements(): void {
    this.hudTimecode = document.getElementById('hud-timecode')!;
    this.batteryFill = document.getElementById('battery-fill')!;
    this.batteryPct = document.getElementById('battery-pct')!;
    this.bpmValue = document.getElementById('bpm-value')!;
    this.objText = document.getElementById('obj-text')!;
    this.warningBanner = document.getElementById('warning-banner')!;
    this.warningText = document.getElementById('warning-text')!;
    this.interactPrompt = document.getElementById('interact-prompt')!;
    this.interactLabel = document.getElementById('interact-label')!;
    this.subtitleBox = document.getElementById('subtitle-box')!;
    this.camcorderHud = document.getElementById('camcorder-hud')!;
    this.peepholeOverlay = document.getElementById('peephole-overlay')!;
    this.frostOverlay = document.getElementById('frost-overlay')!;
    this.glitchLayer = document.getElementById('vhs-glitch-layer')!;
    this.jumpscareFlash = document.getElementById('jumpscare-flash')!;
    this.startModal = document.getElementById('start-modal')!;
    this.deathModal = document.getElementById('death-modal')!;
    this.victoryModal = document.getElementById('victory-modal')!;
    this.deathCause = document.getElementById('death-cause')!;
    this.deathTime = document.getElementById('death-time')!;
  }

  public hideStartModal(): void {
    if (this.startModal) this.startModal.style.display = 'none';
  }

  public setTimecode(timeStr: string): void {
    if (this.hudTimecode) this.hudTimecode.innerText = timeStr;
  }

  public setBattery(pct: number): void {
    const rounded = Math.max(0, Math.floor(pct));
    if (this.batteryFill) this.batteryFill.style.width = `${rounded}%`;
    if (this.batteryPct) this.batteryPct.innerText = `${rounded}%`;
  }

  public setBPM(bpm: number): void {
    if (this.bpmValue) this.bpmValue.innerText = bpm.toString();
  }

  public setObjective(text: string): void {
    if (this.objText) this.objText.innerText = text;
  }

  public setNightVisionMode(active: boolean): void {
    if (this.camcorderHud) {
      if (active) this.camcorderHud.classList.add('night-vision');
      else this.camcorderHud.classList.remove('night-vision');
    }
  }

  public showWarning(text: string, show: boolean): void {
    if (!this.warningBanner) return;
    if (show) {
      this.warningText.innerText = text;
      this.warningBanner.classList.add('active');
    } else {
      this.warningBanner.classList.remove('active');
    }
  }

  public showInteractPrompt(label: string, show: boolean): void {
    if (!this.interactPrompt) return;
    if (show) {
      this.interactLabel.innerText = label;
      this.interactPrompt.classList.add('active');
    } else {
      this.interactPrompt.classList.remove('active');
    }
  }

  public showSubtitle(text: string, type: 'normal' | 'creepy' | 'eas' = 'normal', durationMs: number = 4000): void {
    if (!this.subtitleBox) return;
    if (this.subtitleTimeout) clearTimeout(this.subtitleTimeout);

    this.subtitleBox.className = `subtitle-box active ${type}`;
    this.subtitleBox.innerText = text;

    this.subtitleTimeout = window.setTimeout(() => {
      this.subtitleBox.className = 'subtitle-box';
    }, durationMs);
  }

  public setPeepholeMode(active: boolean): void {
    if (this.peepholeOverlay) {
      if (active) this.peepholeOverlay.classList.add('active');
      else this.peepholeOverlay.classList.remove('active');
    }
  }

  public setFrostOverlay(active: boolean): void {
    if (this.frostOverlay) {
      if (active) this.frostOverlay.classList.add('active');
      else this.frostOverlay.classList.remove('active');
    }
  }

  public triggerGlitch(durationMs: number = 400): void {
    if (!this.glitchLayer) return;
    this.glitchLayer.classList.add('active');
    setTimeout(() => {
      this.glitchLayer.classList.remove('active');
    }, durationMs);
  }

  public triggerJumpscare(causeText: string = 'IT CAUGHT YOU.'): void {
    if (!this.jumpscareFlash) return;
    this.jumpscareFlash.style.display = 'flex';

    setTimeout(() => {
      this.jumpscareFlash.style.display = 'none';
      this.showDeathScreen(causeText);
    }, 1200);
  }

  public showDeathScreen(causeText: string): void {
    if (!this.deathModal) return;
    this.deathCause.innerText = causeText;
    this.deathTime.innerText = `TIME OF DEATH: ${this.hudTimecode.innerText}`;
    this.deathModal.style.display = 'flex';
  }

  public showVictoryScreen(): void {
    if (this.victoryModal) {
      this.victoryModal.style.display = 'flex';
    }
  }
}
