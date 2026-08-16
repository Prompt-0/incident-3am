/**
 * INCIDENT: 3:07 AM — Procedural Horror Sound Synthesizer
 * Generates all visceral horror audio effects, stingers, EAS broadcasts, and binaural whispers.
 */

import { AudioEngine } from './AudioEngine';

export class SoundSynthesizer {
  private static instance: SoundSynthesizer;
  private engine: AudioEngine;

  private constructor() {
    this.engine = AudioEngine.getInstance();
  }

  public static getInstance(): SoundSynthesizer {
    if (!SoundSynthesizer.instance) {
      SoundSynthesizer.instance = new SoundSynthesizer();
    }
    return SoundSynthesizer.instance;
  }

  private get ctx(): AudioContext | null {
    return this.engine.ctx;
  }

  /**
   * Generates white/brown noise buffer.
   */
  private createNoise(type: 'white' | 'brown', duration: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'white') {
        data[i] = white;
      } else {
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
    }
    return buffer;
  }

  /**
   * Emergency Alert System (EAS / EBS) 2-Tone Attention Signal (853Hz + 960Hz).
   */
  public playEASAlert(duration: number = 2.5): void {
    if (!this.ctx || !this.engine.voiceGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = 853;

    osc2.type = 'sine';
    osc2.frequency.value = 960;

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.05);
    gain.gain.setValueAtTime(0.45, now + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.engine.voiceGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  /**
   * Violent, room-shaking metallic door banging (BAM BAM BAM!).
   */
  public playViolentDoorKnock(): void {
    if (!this.ctx || !this.engine.sfxGain) return;

    const strikes = [0, 0.22, 0.44];
    strikes.forEach((offset, idx) => {
      setTimeout(() => {
        if (!this.ctx || !this.engine.sfxGain) return;
        const now = this.ctx.currentTime;

        // Sub-bass thud
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

        oscGain.gain.setValueAtTime(0.9, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(oscGain);
        oscGain.connect(this.engine.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);

        // Metal vibration rattle
        const noise = this.createNoise('white', 0.2);
        if (noise) {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noise;
          const bandpass = this.ctx.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.value = 1200 - idx * 200;
          bandpass.Q.value = 8.0;

          const nGain = this.ctx.createGain();
          nGain.gain.setValueAtTime(0.5, now);
          nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

          noiseSrc.connect(bandpass);
          bandpass.connect(nGain);
          nGain.connect(this.engine.sfxGain);

          noiseSrc.start(now);
        }
      }, offset * 1000);
    });
  }

  /**
   * Binaural Ragged Cold Breathing right behind player's ear.
   * @param pan Stereo panning: -1 (left ear) to 1 (right ear)
   */
  public playColdNeckBreathing(pan: number = 0.4): void {
    if (!this.ctx || !this.engine.sfxGain) return;

    const noise = this.createNoise('brown', 2.0);
    if (!noise) return;

    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 450;
    filter.Q.value = 3.0;

    // Filter sweep simulating inhale / ragged gasp
    const now = this.ctx.currentTime;
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.linearRampToValueAtTime(700, now + 0.8);
    filter.frequency.linearRampToValueAtTime(250, now + 1.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.6);
    gain.gain.linearRampToValueAtTime(0.001, now + 1.9);

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);

    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.engine.sfxGain);

    noiseSrc.start(now);
  }

  /**
   * Bone-shattering Jumpscare Screech Stinger.
   */
  public playJumpscareStinger(): void {
    if (!this.ctx || !this.engine.sfxGain) return;

    const now = this.ctx.currentTime;
    const duration = 1.6;

    // 1. Dissonant frequency-modulated screaming oscillators
    const freqs = [180, 240, 520, 840, 1150];
    freqs.forEach((f) => {
      if (!this.ctx || !this.engine.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 2.2, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(f * 0.4, now + duration);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.engine.sfxGain);

      osc.start(now);
      osc.stop(now + duration);
    });

    // 2. Violent distorted impact burst
    const noise = this.createNoise('white', 0.6);
    if (noise) {
      const src = this.ctx.createBufferSource();
      src.buffer = noise;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      src.connect(gain);
      gain.connect(this.engine.sfxGain);
      src.start(now);
    }
  }

  /**
   * Bloodcurdling wail when checking the peephole.
   */
  public playPeepholeScreech(): void {
    if (!this.ctx || !this.engine.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(2600, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(300, now + 1.2);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.engine.sfxGain);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  /**
   * Heavy deadbolt lock and iron barricade sound.
   */
  public playDoorLockBarricade(): void {
    if (!this.ctx || !this.engine.sfxGain) return;

    const now = this.ctx.currentTime;

    // Metallic heavy clunk
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.engine.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Footsteps across wooden floorboards / concrete.
   */
  public playFootstep(isSprinting: boolean = false): void {
    if (!this.ctx || !this.engine.sfxGain) return;

    const now = this.ctx.currentTime;
    const noise = this.createNoise('brown', 0.1);
    if (!noise) return;

    const src = this.ctx.createBufferSource();
    src.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = isSprinting ? 600 : 350;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isSprinting ? 0.6 : 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.engine.sfxGain);

    src.start(now);
  }

  /**
   * Creepy claws scratching inside ceiling air ventilation ducts.
   */
  public playVentScratch(): void {
    if (!this.ctx || !this.engine.sfxGain) return;

    const now = this.ctx.currentTime;
    const noise = this.createNoise('white', 0.8);
    if (!noise) return;

    const src = this.ctx.createBufferSource();
    src.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3500;
    filter.Q.value = 12.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.7);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.engine.sfxGain);

    src.start(now);
  }

  /**
   * Radio voice announcer using Web Speech API synthesis or fallback synth.
   */
  public speakEmergencyBroadcast(text: string): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 0.6;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }
}
