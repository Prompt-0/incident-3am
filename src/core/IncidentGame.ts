/**
 * INCIDENT: 3:07 AM — Master Game Coordinator & Timeline Engine
 * Orchestrates Three.js scene, crisp horror lighting, laptop/touchpad controls, audio, and jump scares.
 */

import * as THREE from 'three';
import { AudioEngine } from '../audio/AudioEngine';
import { SoundSynthesizer } from '../audio/SoundSynthesizer';
import { ApartmentWorld } from '../world/ApartmentWorld';
import { PlayerController } from '../player/PlayerController';
import { Camcorder } from '../player/Camcorder';
import { Stalker } from '../entities/Stalker';
import { UIManager } from '../ui/UIManager';

export class IncidentGame {
  private static instance: IncidentGame;

  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public canvas: HTMLCanvasElement;

  public world!: ApartmentWorld;
  public player!: PlayerController;
  public camcorder!: Camcorder;
  public stalker!: Stalker;
  public ui: UIManager;
  public audio: AudioEngine;
  public synth: SoundSynthesizer;

  /* Brightness / Exposure Settings */
  private brightnessLevels: number[] = [1.0, 1.45, 1.9, 2.4];
  private brightnessIndex: number = 1;

  /* Timeline & Game Loop State */
  public isPlaying: boolean = false;
  public isGameOver: boolean = false;
  public isVictory: boolean = false;
  
  // Game clock: starts at 3:00:00, ends at 3:33:00 (Total real-time duration ~210s)
  private elapsedSeconds: number = 0;
  private readonly TOTAL_GAME_SECONDS: number = 210; // 3.5 minutes
  private inGameMinutes: number = 0; // 0 to 33

  /* Event Phase Triggers */
  private phase1Triggered: boolean = false; // 03:00 Blackout & EAS
  private phase2Triggered: boolean = false; // 03:07 Violent Knocking
  private phase2ScreechTriggered: boolean = false;
  private phase3Triggered: boolean = false; // 03:15 Don't Turn Around
  private phase3Passed: boolean = false;
  private phase4Triggered: boolean = false; // 03:22 Night Vision Specter
  private phase5Triggered: boolean = false; // 03:28 The Breach & Hide
  private phase6Triggered: boolean = false; // 03:33 Dawn

  private coldBreathTimer: number = 0;
  private stalkerHuntTimer: number = 0;

  private lastFrameTime: number = performance.now();

  private constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.scene = new THREE.Scene();
    
    // Atmospheric low-density fog (lets player see room clearly)
    this.scene.fog = new THREE.FogExp2(0x0c0b10, 0.022);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      60
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.brightnessLevels[this.brightnessIndex]; // 1.45 default exposure

    this.ui = UIManager.getInstance();
    this.audio = AudioEngine.getInstance();
    this.synth = SoundSynthesizer.getInstance();

    this.setupWindowResize();
  }

  public static getInstance(): IncidentGame {
    if (!IncidentGame.instance) {
      IncidentGame.instance = new IncidentGame();
    }
    return IncidentGame.instance;
  }

  public init(): void {
    // 1. Build 3D world
    this.world = new ApartmentWorld(this.scene);

    // 2. Setup Player & Camcorder
    this.player = new PlayerController(this.camera, this.canvas, this.world);
    this.camcorder = new Camcorder(this.scene, this.camera);

    // 3. Spawn Stalker entity
    this.stalker = new Stalker();
    this.scene.add(this.stalker.mesh);

    // 4. Setup UI Listeners & Laptop Controls
    this.setupUIListeners();

    // 5. Start Render Loop
    this.render();
  }

  public cycleBrightness(): void {
    this.brightnessIndex = (this.brightnessIndex + 1) % this.brightnessLevels.length;
    const level = this.brightnessLevels[this.brightnessIndex];
    this.renderer.toneMappingExposure = level;
    const labels = ['NORMAL (1.0x)', 'BRIGHT (1.45x)', 'VERY BRIGHT (1.9x)', 'MAXIMUM (2.4x)'];
    this.ui.showSubtitle(`☀️ BRIGHTNESS: ${labels[this.brightnessIndex]}`, 'normal', 2500);
  }

  private setupUIListeners(): void {
    const startBtn = document.getElementById('btn-start-game');
    startBtn?.addEventListener('click', async () => {
      await this.audio.init();
      this.ui.hideStartModal();
      this.startGame();
    });

    const retryBtn = document.getElementById('btn-retry');
    retryBtn?.addEventListener('click', () => {
      window.location.reload();
    });

    const restartBtn = document.getElementById('btn-restart');
    restartBtn?.addEventListener('click', () => {
      window.location.reload();
    });

    // ── Laptop & Touchpad Quick Action Buttons ──
    const btnLight = document.getElementById('btn-action-light');
    btnLight?.addEventListener('click', () => {
      if (!this.isPlaying || this.isGameOver) return;
      const on = this.camcorder.toggleFlashlight();
      this.synth.playDoorLockBarricade();
      this.ui.showSubtitle(on ? '💡 FLASHLIGHT ON' : '💡 FLASHLIGHT OFF', 'normal', 1500);
    });

    const btnNV = document.getElementById('btn-action-nv');
    btnNV?.addEventListener('click', () => {
      if (!this.isPlaying || this.isGameOver) return;
      const isNightVision = this.camcorder.toggleNightVision();
      this.ui.setNightVisionMode(isNightVision);
      this.ui.showSubtitle(isNightVision ? '📹 NIGHT VISION [IR] ACTIVE' : '📹 NIGHT VISION OFF', 'normal', 1500);
    });

    const btnInteract = document.getElementById('btn-action-interact');
    btnInteract?.addEventListener('click', () => {
      if (!this.isPlaying || this.isGameOver) return;
      this.handlePlayerInteraction();
    });

    const btnCrouch = document.getElementById('btn-action-crouch');
    btnCrouch?.addEventListener('click', () => {
      if (!this.isPlaying || this.isGameOver) return;
      this.player.isCrouching = !this.player.isCrouching;
      this.ui.showSubtitle(this.player.isCrouching ? '🧎 CROUCHING (SILENT)' : '🚶 STANDING', 'normal', 1500);
    });

    const btnBright = document.getElementById('btn-action-bright');
    btnBright?.addEventListener('click', () => {
      this.cycleBrightness();
    });

    // ── Keyboard Controls ──
    document.addEventListener('keydown', (e) => {
      if (!this.isPlaying || this.isGameOver) return;

      // Flashlight Toggle (F)
      if (e.code === 'KeyF') {
        const on = this.camcorder.toggleFlashlight();
        this.ui.showSubtitle(on ? '💡 FLASHLIGHT ON' : '💡 FLASHLIGHT OFF', 'normal', 1500);
      }

      // Night Vision Toggle (V or N)
      if (e.code === 'KeyV' || e.code === 'KeyN') {
        const isNightVision = this.camcorder.toggleNightVision();
        this.ui.setNightVisionMode(isNightVision);
        this.ui.showSubtitle(isNightVision ? '📹 NIGHT VISION [IR] ACTIVE' : '📹 NIGHT VISION OFF', 'normal', 1500);
      }

      // Brightness Cycle (B)
      if (e.code === 'KeyB') {
        this.cycleBrightness();
      }

      // Interaction Key (E)
      if (e.code === 'KeyE') {
        this.handlePlayerInteraction();
      }

      // Escape peephole view
      if (e.code === 'Escape' && this.player.isInspectingPeephole) {
        this.player.isInspectingPeephole = false;
        this.ui.setPeepholeMode(false);
      }
    });
  }

  private handlePlayerInteraction(): void {
    // If looking at peephole
    if (this.player.isInspectingPeephole) {
      this.player.isInspectingPeephole = false;
      this.ui.setPeepholeMode(false);
      return;
    }

    const distToDoor = this.player.position.distanceTo(new THREE.Vector3(0, 1.6, -4.8));
    if (distToDoor < 1.8) {
      if (this.world.hasIronBar && !this.world.isDoorBarricaded) {
        // Barricade door
        this.world.isDoorBarricaded = true;
        this.synth.playDoorLockBarricade();
        this.ui.showSubtitle('FRONT DOOR SECURED WITH HEAVY IRON BAR.', 'normal', 3000);
        this.ui.setObjective('Wait for the anomaly to pass.');
      } else {
        // Look through peephole
        this.player.isInspectingPeephole = true;
        this.ui.setPeepholeMode(true);
        this.synth.playFootstep();

        if (this.phase2Triggered && !this.phase2ScreechTriggered) {
          this.phase2ScreechTriggered = true;
          // Stalker rushes the peephole!
          this.stalker.mesh.position.set(0, 0, -6.5);
          this.stalker.isVisibleInNormalLight = true;
          this.synth.playPeepholeScreech();
          this.ui.triggerGlitch(800);
          this.ui.showSubtitle('IT IS WATCHING YOU.', 'creepy', 3000);
        }
      }
      return;
    }

    // Check Breaker Box
    const distToBreaker = this.player.position.distanceTo(new THREE.Vector3(-3.8, 1.6, -1.5));
    if (distToBreaker < 1.8 && !this.world.isPowerRestored) {
      this.world.isPowerRestored = true;
      this.world.breakerSwitches = [true, true, true, true];
      this.world.ceilingLight.color.setHex(0xffbb66);
      this.world.ceilingLight.intensity = 1.0;
      this.synth.playDoorLockBarricade();
      this.ui.showSubtitle('EMERGENCY CIRCUITS ACTIVE. ROOM ILLUMINATION RESTORED.', 'normal', 3000);
      return;
    }

    // Check Iron Pipe Pickup
    const distToPipe = this.player.position.distanceTo(new THREE.Vector3(2.8, 0.85, 2.5));
    if (distToPipe < 1.8 && !this.world.hasIronBar) {
      this.world.hasIronBar = true;
      const pipeMesh = this.world.roomMesh.getObjectByName('pickup_iron_pipe');
      if (pipeMesh) pipeMesh.visible = false;
      this.synth.playDoorLockBarricade();
      this.ui.showSubtitle('ACQUIRED HEAVY IRON PIPE. GO BARRICADE THE FRONT DOOR [E].', 'normal', 4000);
      this.ui.setObjective('Barricade front door [E]');
      return;
    }

    // Check Battery Pickup
    const distToBatt = this.player.position.distanceTo(new THREE.Vector3(-3.6, 0.7, 2.0));
    if (distToBatt < 1.8) {
      const battMesh = this.world.roomMesh.getObjectByName('pickup_battery');
      if (battMesh && battMesh.visible) {
        battMesh.visible = false;
        this.camcorder.recharge(50);
        this.ui.setBattery(this.camcorder.batteryPct);
        this.synth.playFootstep();
        this.ui.showSubtitle('ACQUIRED CAM BATTERY PACK (+50%).', 'normal', 3000);
      }
    }
  }

  public startGame(): void {
    this.isPlaying = true;
    this.elapsedSeconds = 0;
    this.lastFrameTime = performance.now();
    this.audio.setTension(0.1);

    // Initial EBS Emergency Broadcast Subtitle
    setTimeout(() => {
      this.synth.playEASAlert(2.0);
      this.ui.showSubtitle('⚠️ EBS WARNING: ANOMALY 307 BREACH DETECTED. SURVIVE UNTIL 03:33 AM.', 'eas', 5000);
    }, 1500);
  }

  /**
   * Main Simulation Loop.
   */
  private update(dt: number): void {
    if (!this.isPlaying || this.isGameOver || this.isVictory) return;

    this.elapsedSeconds += dt;
    const progress = Math.min(1.0, this.elapsedSeconds / this.TOTAL_GAME_SECONDS);
    this.inGameMinutes = Math.floor(progress * 33); // 0 to 33 mins

    // Format timecode
    const inGameSecs = Math.floor((progress * 33 * 60) % 60);
    const mm = (this.inGameMinutes).toString().padStart(2, '0');
    const ss = (inGameSecs).toString().padStart(2, '0');
    this.ui.setTimecode(`03:${mm}:${ss} AM`);

    // Update Subsystems
    this.player.update(dt);
    this.camcorder.update(dt);
    this.ui.setBattery(this.camcorder.batteryPct);
    this.ui.setBPM(this.audio.currentBPM);
    this.world.updateTVTexture(performance.now() * 0.001);
    this.stalker.update(dt, this.camcorder.isNightVisionOn);

    // Update Interaction Prompts
    this.updateInteractionPrompts();

    // Run Phased Horror Events
    this.updateHorrorTimeline(dt);
  }

  private updateInteractionPrompts(): void {
    if (this.player.isInspectingPeephole) {
      this.ui.showInteractPrompt('Step Back [E] / [ESC]', true);
      return;
    }

    const distToDoor = this.player.position.distanceTo(new THREE.Vector3(0, 1.6, -4.8));
    if (distToDoor < 1.8) {
      if (this.world.hasIronBar && !this.world.isDoorBarricaded) {
        this.ui.showInteractPrompt('Barricade Door [E]', true);
      } else {
        this.ui.showInteractPrompt('Look Through Peephole [E]', true);
      }
      return;
    }

    const distToBreaker = this.player.position.distanceTo(new THREE.Vector3(-3.8, 1.6, -1.5));
    if (distToBreaker < 1.8 && !this.world.isPowerRestored) {
      this.ui.showInteractPrompt('Reset Circuit Breaker [E]', true);
      return;
    }

    const distToPipe = this.player.position.distanceTo(new THREE.Vector3(2.8, 0.85, 2.5));
    if (distToPipe < 1.8 && !this.world.hasIronBar) {
      this.ui.showInteractPrompt('Pick up Heavy Iron Pipe [E]', true);
      return;
    }

    this.ui.showInteractPrompt('', false);
  }

  /**
   * Timeline Sequence for 3:00 AM -> 3:33 AM.
   */
  private updateHorrorTimeline(dt: number): void {
    // ── Phase 1: 03:00 - 03:07 AM (Blackout & Breaker) ──
    if (this.inGameMinutes >= 1 && !this.phase1Triggered) {
      this.phase1Triggered = true;
      this.world.ceilingLight.intensity = 0.4; // Soft emergency amber
      this.audio.setTension(0.3);
      this.ui.setObjective('Investigate Room 404 / Find the Iron Pipe on the desk');
      this.ui.showSubtitle('The main grid failed. Use your handheld light [F] and search the room.', 'normal', 4000);
    }

    // ── Phase 2: 03:07 - 03:15 AM (Violent Door Knocks) ──
    if (this.inGameMinutes >= 7 && !this.phase2Triggered) {
      this.phase2Triggered = true;
      this.audio.setTension(0.5);
      this.synth.playViolentDoorKnock();
      this.ui.triggerGlitch(600);
      this.ui.showSubtitle('[ AGGRESSIVE POUNDING ON FRONT DOOR ]', 'creepy', 4000);
      this.ui.setObjective('Inspect front door peephole [E] or Barricade it!');
    }

    // ── Phase 3: 03:15 - 03:22 AM ("Don't Turn Around" Cold Breath) ──
    if (this.inGameMinutes >= 15 && !this.phase3Triggered) {
      this.phase3Triggered = true;
      this.audio.setTension(0.85);
      this.player.startColdBreathing();
      this.ui.setFrostOverlay(true);
      this.ui.showWarning('⚠️ BREATHING DETECTED BEHIND YOU — DO NOT TURN AROUND', true);
      this.synth.playColdNeckBreathing(0.3);
      this.coldBreathTimer = 8.0; // 8 seconds survival freeze
    }

    if (this.phase3Triggered && !this.phase3Passed) {
      this.coldBreathTimer -= dt;

      // Check if player failed the rule
      if (this.player.hasTurnedAroundDuringCold) {
        this.triggerPlayerDeath('YOU TURNED AROUND.');
        return;
      }

      if (this.coldBreathTimer <= 0) {
        this.phase3Passed = true;
        this.player.stopColdBreathing();
        this.ui.setFrostOverlay(false);
        this.ui.showWarning('', false);
        this.synth.playVentScratch();
        this.ui.showSubtitle('The entity crawled into the ceiling vent above...', 'normal', 4000);
        this.ui.setObjective('Prepare for incursion. Toggle Night Vision [V / F]');
      }
    }

    // ── Phase 4: 03:22 - 03:28 AM (Invisible Specter Hunt) ──
    if (this.inGameMinutes >= 22 && !this.phase4Triggered) {
      this.phase4Triggered = true;
      this.audio.setTension(0.9);
      this.stalker.mesh.position.set(0, 0, 0);
      this.stalker.isVisibleInNormalLight = false; // Only visible in Night Vision!
      this.synth.playFootstep();
      this.ui.showSubtitle('Heavy footsteps echo in the room... but no one is visible. USE NIGHT VISION [V].', 'creepy', 5000);
      this.ui.setObjective('Track the anomaly with Night Vision [V]');
    }

    // If in Phase 4 and player gets too close without night vision
    if (this.phase4Triggered && this.inGameMinutes < 28) {
      const distToStalker = this.player.position.distanceTo(this.stalker.mesh.position);
      if (distToStalker < 1.6 && !this.camcorder.isNightVisionOn) {
        this.triggerPlayerDeath('THE UNSEEN ENTITY TORE YOU APART.');
        return;
      }
    }

    // ── Phase 5: 03:28 - 03:33 AM (Door Breach & Closet Hide) ──
    if (this.inGameMinutes >= 28 && !this.phase5Triggered) {
      this.phase5Triggered = true;
      this.audio.setTension(1.0);
      this.synth.playViolentDoorKnock();
      this.synth.playJumpscareStinger();
      this.world.frontDoorMesh.position.x = -1.6; // Door blown open!
      this.stalker.mesh.position.set(0, 0, -3.0);
      this.stalker.isVisibleInNormalLight = true;
      this.ui.showWarning('🚨 HIDE INSIDE THE CLOSET! CROUCH [C] AND TURN LIGHTS OFF!', true);
      this.ui.setObjective('Hide in the wooden wardrobe closet! Crouch [C]');
      this.stalkerHuntTimer = 20.0;
    }

    if (this.phase5Triggered && !this.phase6Triggered) {
      this.stalkerHuntTimer -= dt;

      // If player is NOT hidden in the closet, Stalker attacks!
      if (this.stalkerHuntTimer < 14.0) {
        if (!this.player.isInsideCloset || !this.player.isCrouching || this.camcorder.isNightVisionOn) {
          this.triggerPlayerDeath('IT FOUND YOU STANDING IN THE OPEN.');
          return;
        }
      }

      // ── Phase 6: 03:33 AM (Dawn / Victory) ──
      if (this.inGameMinutes >= 33) {
        this.phase6Triggered = true;
        this.triggerVictory();
      }
    }
  }

  public triggerPlayerDeath(reason: string): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.synth.playJumpscareStinger();
    this.ui.triggerJumpscare(reason);
  }

  public triggerVictory(): void {
    if (this.isVictory) return;
    this.isVictory = true;
    this.world.ceilingLight.color.setHex(0xffffff);
    this.world.ceilingLight.intensity = 2.4;
    this.ui.showWarning('', false);
    this.ui.showVictoryScreen();
  }

  private setupWindowResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private render = (): void => {
    requestAnimationFrame(this.render);

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;

    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };
}
