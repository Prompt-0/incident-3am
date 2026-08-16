/**
 * INCIDENT: 3:07 AM — Camcorder & Infrared Night Vision System
 * Manages IR Spotlight, battery level, phosphor green shader activation, and capacitor audio whine.
 */

import * as THREE from 'three';
import { AudioEngine } from '../audio/AudioEngine';

export class Camcorder {
  public isNightVisionOn: boolean = false;
  public batteryPct: number = 100;
  public irSpotLight: THREE.SpotLight;
  private audioEngine: AudioEngine;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.audioEngine = AudioEngine.getInstance();

    // Night Vision IR Spotlight attached to camera
    this.irSpotLight = new THREE.SpotLight(0x44ff88, 0, 18, Math.PI / 3.5, 0.4, 1.5);
    this.irSpotLight.position.set(0, 0, 0);
    this.irSpotLight.target.position.set(0, 0, -1);
    camera.add(this.irSpotLight);
    camera.add(this.irSpotLight.target);
    scene.add(camera);
  }

  /**
   * Toggles Infrared Night Vision mode.
   */
  public toggleNightVision(): boolean {
    if (this.batteryPct <= 0) {
      this.isNightVisionOn = false;
      this.irSpotLight.intensity = 0;
      this.audioEngine.toggleNightVisionHum(false);
      return false;
    }

    this.isNightVisionOn = !this.isNightVisionOn;
    this.irSpotLight.intensity = this.isNightVisionOn ? 2.5 : 0;
    this.audioEngine.toggleNightVisionHum(this.isNightVisionOn);
    return this.isNightVisionOn;
  }

  /**
   * Recharge battery from pickup.
   */
  public recharge(amount: number = 50): void {
    this.batteryPct = Math.min(100, this.batteryPct + amount);
  }

  public update(dt: number): void {
    if (this.isNightVisionOn) {
      // Drain battery (100% lasts ~90 seconds of continuous IR use)
      this.batteryPct = Math.max(0, this.batteryPct - (dt / 90) * 100);

      if (this.batteryPct <= 0) {
        this.toggleNightVision();
      }
    }
  }
}
