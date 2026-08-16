/**
 * INCIDENT: 3:07 AM — Master Audio Engine
 * Real-time Web Audio API procedural synthesis with zero external dependencies.
 */

export class AudioEngine {
  private static instance: AudioEngine;
  public ctx: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public sfxGain: GainNode | null = null;
  public ambientGain: GainNode | null = null;
  public voiceGain: GainNode | null = null;

  // Ambient Drone Nodes
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  public currentBPM: number = 72;

  // Night Vision Hum
  private nvHumOsc: OscillatorNode | null = null;
  private nvHumGain: GainNode | null = null;

  public isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes the AudioContext upon user gesture.
   */
  public async init(): Promise<void> {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.masterGain);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.6;
    this.ambientGain.connect(this.masterGain);

    this.voiceGain = this.ctx.createGain();
    this.voiceGain.gain.value = 1.0;
    this.voiceGain.connect(this.masterGain);

    this.isInitialized = true;

    this.startAmbientDrone();
    this.startHeartbeatLoop();
  }

  public async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Starts deep subterranean brown-noise & resonant drone.
   */
  private startAmbientDrone(): void {
    if (!this.ctx || !this.ambientGain) return;

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneFilter = this.ctx.createBiquadFilter();

    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.value = 45; // Sub-bass

    this.droneOsc2.type = 'sine';
    this.droneOsc2.frequency.value = 46.5; // Binaural beat

    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.value = 120;
    this.droneFilter.Q.value = 4.0;

    const droneMix = this.ctx.createGain();
    droneMix.gain.value = 0.4;

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(droneMix);
    droneMix.connect(this.ambientGain);

    this.droneOsc1.start();
    this.droneOsc2.start();
  }

  /**
   * Sets tension level which filters ambient drone and scales heartbeat.
   * @param tension 0.0 (calm) to 1.0 (extreme dread)
   */
  public setTension(tension: number): void {
    if (!this.ctx || !this.droneFilter) return;
    const targetFreq = 120 + tension * 400;
    this.droneFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.5);

    this.currentBPM = Math.floor(70 + tension * 105); // Up to 175 BPM
  }

  /**
   * Continuous procedural heartbeat loop.
   */
  private startHeartbeatLoop(): void {
    const playPulse = () => {
      if (!this.isInitialized || !this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      // Lub
      this.playHeartThud(now, 45, 0.7);
      // Dub (180ms later)
      this.playHeartThud(now + 0.18, 52, 0.45);

      const intervalMs = (60 / Math.max(50, this.currentBPM)) * 1000;
      window.setTimeout(playPulse, intervalMs);
    };

    playPulse();
  }

  private playHeartThud(time: number, freq: number, gainVal: number): void {
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq + 20, time);
    osc.frequency.exponentialRampToValueAtTime(freq - 15, time + 0.12);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.18);
  }

  /**
   * Night Vision IR Capacitor Whine and toggle click.
   */
  public toggleNightVisionHum(active: boolean): void {
    if (!this.ctx || !this.ambientGain) return;

    if (active) {
      if (this.nvHumOsc) return;

      this.nvHumOsc = this.ctx.createOscillator();
      this.nvHumGain = this.ctx.createGain();

      this.nvHumOsc.type = 'sine';
      this.nvHumOsc.frequency.value = 14500; // Ultra high pitch whine

      this.nvHumGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.nvHumGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.1);

      this.nvHumOsc.connect(this.nvHumGain);
      this.nvHumGain.connect(this.ambientGain);
      this.nvHumOsc.start();
    } else {
      if (this.nvHumGain && this.ctx) {
        this.nvHumGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
        setTimeout(() => {
          if (this.nvHumOsc) {
            this.nvHumOsc.stop();
            this.nvHumOsc.disconnect();
            this.nvHumOsc = null;
          }
        }, 120);
      }
    }
  }
}
