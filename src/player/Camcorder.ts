/**
 * INCIDENT: 3:07 AM — Camcorder & Flashlight / Infrared Night Vision System
 * Manages crisp handheld flashlight, IR Night Vision mode, battery, and lighting.
 */

import * as THREE from 'three';
import { AudioEngine } from '../audio/AudioEngine';

export class Camcorder {
  public isFlashlightOn: boolean = true;
  public isNightVisionOn: boolean = false;
  public batteryPct: number = 100;
  
  public flashlightSpot: THREE.SpotLight;
  public flashlightFill: THREE.PointLight;
  public irSpotLight: THREE.SpotLight;
  
  private audioEngine: AudioEngine;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.audioEngine = AudioEngine.getInstance();

    // 1. Crisp Handheld Camcorder Flashlight (Warm White Beam) - ON BY DEFAULT
    this.flashlightSpot = new THREE.SpotLight(0xfff4e0, 2.4, 25, Math.PI / 4, 0.35, 1.2);
    this.flashlightSpot.position.set(0.15, -0.1, 0);
    this.flashlightSpot.target.position.set(0, 0, -2);
    camera.add(this.flashlightSpot);
    camera.add(this.flashlightSpot.target);

    // Soft Fill Light around player so feet & nearby objects are never pitch black
    this.flashlightFill = new THREE.PointLight(0xffeedd, 0.8, 7);
    this.flashlightFill.position.set(0, 0, 0);
    camera.add(this.flashlightFill);

    // 2. High-Contrast Night Vision IR Spotlight (Phosphor Green Beam)
    this.irSpotLight = new THREE.SpotLight(0x44ff88, 0, 28, Math.PI / 3.2, 0.45, 1.2);
    this.irSpotLight.position.set(0, 0, 0);
    this.irSpotLight.target.position.set(0, 0, -2);
    camera.add(this.irSpotLight);
    camera.add(this.irSpotLight.target);

    scene.add(camera);
  }

  /**
   * Toggles standard handheld flashlight.
   */
  public toggleFlashlight(): boolean {
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlightSpot.intensity = this.isFlashlightOn ? 2.4 : 0;
    this.flashlightFill.intensity = this.isFlashlightOn ? 0.8 : 0.1;
    return this.isFlashlightOn;
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
    this.irSpotLight.intensity = this.isNightVisionOn ? 3.6 : 0;
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
