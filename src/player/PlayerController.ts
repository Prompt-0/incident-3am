/**
 * INCIDENT: 3:07 AM — First-Person Player Controller
 * Locomotion, Pointer Lock, Head-bob, Interactivity, and "Don't Turn Around" Mechanics.
 */

import * as THREE from 'three';
import { SoundSynthesizer } from '../audio/SoundSynthesizer';
import { ApartmentWorld } from '../world/ApartmentWorld';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3 = new THREE.Vector3(0, 1.6, 1.0);
  
  public pitch: number = 0;
  public yaw: number = 0;
  public isLocked: boolean = false;

  /* Movement State */
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  public isSprinting: boolean = false;
  public isCrouching: boolean = false;
  public isInsideCloset: boolean = false;

  /* Speeds */
  private walkSpeed: number = 2.4;
  private sprintSpeed: number = 4.2;
  private crouchSpeed: number = 1.2;
  
  /* Head bob */
  private bobTimer: number = 0;
  private footstepTimer: number = 0;

  /* Peephole Inspection Mode */
  public isInspectingPeephole: boolean = false;

  /* "Don't Turn Around" Safety Tracking */
  public isColdBreathingActive: boolean = false;
  public initialColdYaw: number = 0;
  public hasTurnedAroundDuringCold: boolean = false;

  private soundSynth: SoundSynthesizer;
  public world: ApartmentWorld;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, world: ApartmentWorld) {
    this.camera = camera;
    this.world = world;
    this.soundSynth = SoundSynthesizer.getInstance();

    this.setupInputs(domElement);
  }

  private setupInputs(domElement: HTMLElement): void {
    // Pointer Lock
    domElement.addEventListener('click', () => {
      if (!this.isLocked && !this.isInspectingPeephole) {
        domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === domElement;
    });

    // Mouse Look
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      const sensitivity = 0.0022;
      this.yaw -= e.movementX * sensitivity;
      this.pitch -= e.movementY * sensitivity;

      // Clamp pitch [-85 deg, +85 deg]
      this.pitch = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.pitch));

      // Check "Don't Turn Around" Violation
      if (this.isColdBreathingActive) {
        const yawDelta = Math.abs(this.yaw - this.initialColdYaw);
        if (yawDelta > 0.75) { // Turned more than ~45 degrees
          this.hasTurnedAroundDuringCold = true;
        }
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
        case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
        case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
        case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
        case 'ShiftLeft': case 'ShiftRight': this.isSprinting = true; break;
        case 'KeyC': case 'ControlLeft': this.isCrouching = !this.isCrouching; break;
      }
    });

    document.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
        case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
        case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
        case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
        case 'ShiftLeft': case 'ShiftRight': this.isSprinting = false; break;
      }
    });
  }

  /**
   * Begins "Don't Turn Around" cold breath phase.
   */
  public startColdBreathing(): void {
    this.isColdBreathingActive = true;
    this.initialColdYaw = this.yaw;
    this.hasTurnedAroundDuringCold = false;
  }

  public stopColdBreathing(): void {
    this.isColdBreathingActive = false;
    this.hasTurnedAroundDuringCold = false;
  }

  /**
   * Updates player movement, bounds collision, and camera transformation.
   */
  public update(dt: number): void {
    if (this.isInspectingPeephole) {
      // Lock camera at peephole
      this.camera.position.set(0, 1.6, -4.92);
      this.camera.rotation.set(0, 0, 0);
      return;
    }

    // Determine current speed
    let speed = this.walkSpeed;
    if (this.isCrouching) speed = this.crouchSpeed;
    else if (this.isSprinting) speed = this.sprintSpeed;

    // Movement Direction Vector
    const moveDir = new THREE.Vector3();
    if (this.moveForward) moveDir.z -= 1;
    if (this.moveBackward) moveDir.z += 1;
    if (this.moveLeft) moveDir.x -= 1;
    if (this.moveRight) moveDir.x += 1;

    const isMoving = moveDir.lengthSq() > 0;
    if (isMoving) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

      this.position.x += moveDir.x * speed * dt;
      this.position.z += moveDir.z * speed * dt;

      // Footstep audio cadence
      this.footstepTimer += dt * (speed / this.walkSpeed);
      if (this.footstepTimer > 0.45) {
        this.footstepTimer = 0;
        if (!this.isCrouching) {
          this.soundSynth.playFootstep(this.isSprinting);
        }
      }
    }

    // Room 404 Collision Bounds
    this.position.x = Math.max(-3.6, Math.min(3.6, this.position.x));
    this.position.z = Math.max(-4.6, Math.min(4.6, this.position.z));

    // Check if inside hiding closet
    this.isInsideCloset = (
      this.position.x < -2.6 &&
      this.position.x > -3.8 &&
      this.position.z > 0.8 &&
      this.position.z < 2.2
    );

    // Head-bob calculation
    let targetHeight = this.isCrouching ? 0.95 : 1.6;
    if (isMoving) {
      this.bobTimer += dt * (speed * 2.5);
      targetHeight += Math.sin(this.bobTimer) * 0.04;
    }

    this.position.y = THREE.MathUtils.lerp(this.position.y, targetHeight, dt * 10);

    // Apply transformation to camera
    this.camera.position.copy(this.position);

    // Euler rotation (Pitch / Yaw)
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.pitch;
    euler.y = this.yaw;
    this.camera.quaternion.setFromEuler(euler);
  }
}
