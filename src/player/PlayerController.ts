/**
 * INCIDENT: 3:07 AM — First-Person Player Controller (Laptop & Touchpad Friendly)
 * Locomotion, Pointer Lock, Drag-to-Look, Arrow Key Camera Look, and "Don't Turn Around" Tracking.
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
  
  /* Keyboard Look State (Laptop / Trackpad Friendly) */
  private lookLeft: boolean = false;
  private lookRight: boolean = false;
  private lookUp: boolean = false;
  private lookDown: boolean = false;

  /* Drag-to-Look State (Touchpad / Mouse Drag without Pointer Lock) */
  private isDragging: boolean = false;
  private lastDragX: number = 0;
  private lastDragY: number = 0;

  public isSprinting: boolean = false;
  public isCrouching: boolean = false;
  public isInsideCloset: boolean = false;

  /* Speeds */
  private walkSpeed: number = 2.4;
  private sprintSpeed: number = 4.2;
  private crouchSpeed: number = 1.2;
  private keyboardLookSpeed: number = 2.2; // Rad/sec for arrow keys
  
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
    // 1. Pointer Lock on Click
    domElement.addEventListener('click', () => {
      if (!this.isLocked && !this.isInspectingPeephole) {
        domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === domElement;
    });

    // 2. Mouse Move (Pointer Lock Mode)
    document.addEventListener('mousemove', (e) => {
      if (this.isLocked) {
        const sensitivity = 0.0024;
        this.applyLookDelta(e.movementX * sensitivity, e.movementY * sensitivity);
      } else if (this.isDragging) {
        // Drag-to-look fallback for laptop touchpads
        const dx = e.clientX - this.lastDragX;
        const dy = e.clientY - this.lastDragY;
        this.lastDragX = e.clientX;
        this.lastDragY = e.clientY;
        const dragSensitivity = 0.0035;
        this.applyLookDelta(dx * dragSensitivity, dy * dragSensitivity);
      }
    });

    // 3. Touchpad Drag / Click-and-Drag Fallback
    domElement.addEventListener('mousedown', (e) => {
      if (!this.isLocked) {
        this.isDragging = true;
        this.lastDragX = e.clientX;
        this.lastDragY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // 4. Touchscreen Support for laptops with touch displays
    domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.isDragging = true;
        this.lastDragX = e.touches[0].clientX;
        this.lastDragY = e.touches[0].clientY;
      }
    }, { passive: true });

    domElement.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length > 0) {
        const dx = e.touches[0].clientX - this.lastDragX;
        const dy = e.touches[0].clientY - this.lastDragY;
        this.lastDragX = e.touches[0].clientX;
        this.lastDragY = e.touches[0].clientY;
        const touchSensitivity = 0.004;
        this.applyLookDelta(dx * touchSensitivity, dy * touchSensitivity);
      }
    }, { passive: true });

    domElement.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // 5. Keyboard Navigation (WASD for movement, Arrow Keys for Camera Look)
    document.addEventListener('keydown', (e) => {
      switch (e.code) {
        // Movement (WASD)
        case 'KeyW': this.moveForward = true; break;
        case 'KeyS': this.moveBackward = true; break;
        case 'KeyA': this.moveLeft = true; break;
        case 'KeyD': this.moveRight = true; break;

        // Camera Look Keys (Arrow Keys & IJKL)
        case 'ArrowLeft': case 'KeyJ': this.lookLeft = true; break;
        case 'ArrowRight': case 'KeyL': this.lookRight = true; break;
        case 'ArrowUp': case 'KeyI': this.lookUp = true; break;
        case 'ArrowDown': case 'KeyK': this.lookDown = true; break;

        // Actions
        case 'ShiftLeft': case 'ShiftRight': this.isSprinting = true; break;
        case 'KeyC': case 'ControlLeft': this.isCrouching = !this.isCrouching; break;
      }
    });

    document.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': this.moveForward = false; break;
        case 'KeyS': this.moveBackward = false; break;
        case 'KeyA': this.moveLeft = false; break;
        case 'KeyD': this.moveRight = false; break;

        case 'ArrowLeft': case 'KeyJ': this.lookLeft = false; break;
        case 'ArrowRight': case 'KeyL': this.lookRight = false; break;
        case 'ArrowUp': case 'KeyI': this.lookUp = false; break;
        case 'ArrowDown': case 'KeyK': this.lookDown = false; break;

        case 'ShiftLeft': case 'ShiftRight': this.isSprinting = false; break;
      }
    });
  }

  private applyLookDelta(deltaYaw: number, deltaPitch: number): void {
    this.yaw -= deltaYaw;
    this.pitch -= deltaPitch;

    // Clamp pitch [-85 deg, +85 deg]
    this.pitch = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.pitch));

    // Check "Don't Turn Around" Violation
    if (this.isColdBreathingActive) {
      const yawDelta = Math.abs(this.yaw - this.initialColdYaw);
      if (yawDelta > 0.75) { // Turned more than ~45 degrees
        this.hasTurnedAroundDuringCold = true;
      }
    }
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

    // Keyboard Smooth Look (Laptop friendly)
    if (this.lookLeft) this.applyLookDelta(-this.keyboardLookSpeed * dt, 0);
    if (this.lookRight) this.applyLookDelta(this.keyboardLookSpeed * dt, 0);
    if (this.lookUp) this.applyLookDelta(0, -this.keyboardLookSpeed * dt);
    if (this.lookDown) this.applyLookDelta(0, this.keyboardLookSpeed * dt);

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
