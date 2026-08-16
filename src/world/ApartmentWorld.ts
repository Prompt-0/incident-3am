/**
 * INCIDENT: 3:07 AM — 3D Apartment World & Environment
 * Builds Room 404, interactive front door with Peephole corridor, breaker box, TV, closet, and items.
 */

import * as THREE from 'three';

export interface InteractableObject {
  id: string;
  name: string;
  position: THREE.Vector3;
  radius: number;
  onInteract: () => void;
  promptText: string;
}

export class ApartmentWorld {
  public scene: THREE.Scene;
  public interactables: InteractableObject[] = [];
  
  /* Key World Components */
  public roomMesh!: THREE.Group;
  public frontDoorMesh!: THREE.Group;
  public isDoorLocked: boolean = false;
  public isDoorBarricaded: boolean = false;
  public isDoorOpen: boolean = false;
  
  public peepholePosition: THREE.Vector3 = new THREE.Vector3(0, 1.6, -4.9);
  public closetPosition: THREE.Vector3 = new THREE.Vector3(-3.2, 1.0, 1.5);
  
  /* Lighting */
  public ceilingLight!: THREE.PointLight;
  public tvLight!: THREE.PointLight;
  public corridorLight!: THREE.PointLight;
  public ambientLight!: THREE.AmbientLight;
  
  /* TV Screen Texture Canvas */
  private tvCanvas!: HTMLCanvasElement;
  private tvCtx!: CanvasRenderingContext2D;
  private tvTexture!: THREE.CanvasTexture;
  public tvMode: 'static' | 'warning' | 'face' | 'off' = 'warning';

  /* Breaker Box State */
  public breakerSwitches: boolean[] = [true, false, false, false];
  public isPowerRestored: boolean = false;

  /* Pickups */
  public hasIronBar: boolean = false;
  public batteryCount: number = 2;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initWorld();
  }

  private initWorld(): void {
    this.roomMesh = new THREE.Group();
    this.scene.add(this.roomMesh);

    this.buildRoomGeometry();
    this.buildOutsideCorridor();
    this.buildFrontDoorAndPeephole();
    this.buildVintageTV();
    this.buildBreakerBox();
    this.buildClosetHidingSpot();
    this.buildFurnitureAndAtmosphere();
    this.setupLighting();
  }

  /**
   * Builds the 3D walls, floor, and ceiling for Room 404.
   */
  private buildRoomGeometry(): void {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x242220,
      roughness: 0.85,
      metalness: 0.1
    });

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1a140e,
      roughness: 0.6,
      metalness: 0.2
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 0.9
    });

    // Floor (8m x 10m)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 10), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    this.roomMesh.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(8, 10), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.2, 0);
    this.roomMesh.add(ceiling);

    // Back Wall (+Z)
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.2), wallMat);
    backWall.position.set(0, 1.6, 5);
    backWall.rotation.y = Math.PI;
    this.roomMesh.add(backWall);

    // Left Wall (-X)
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), wallMat);
    leftWall.position.set(-4, 1.6, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.roomMesh.add(leftWall);

    // Right Wall (+X)
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), wallMat);
    rightWall.position.set(4, 1.6, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.roomMesh.add(rightWall);

    // Front Wall (-Z) with Doorway cutout
    const frontWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.2), wallMat);
    frontWallLeft.position.set(-2.35, 1.6, -5);
    this.roomMesh.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.2), wallMat);
    frontWallRight.position.set(2.35, 1.6, -5);
    this.roomMesh.add(frontWallRight);

    const frontWallTop = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), wallMat);
    frontWallTop.position.set(0, 2.75, -5);
    this.roomMesh.add(frontWallTop);

    // Ceiling Air Vent Grate
    const ventGeo = new THREE.BoxGeometry(0.8, 0.1, 0.8);
    const ventMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.3 });
    const vent = new THREE.Mesh(ventGeo, ventMat);
    vent.position.set(0, 3.15, 0);
    this.roomMesh.add(vent);
  }

  /**
   * The long, dark, ominous hallway visible outside the peephole.
   */
  private buildOutsideCorridor(): void {
    const corridorWallMat = new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.95
    });

    const corridorFloorMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d0d,
      roughness: 0.8
    });

    // Hallway extends 20 meters beyond front door (-Z)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(3, 20), corridorFloorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -15);
    this.roomMesh.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(3, 20), corridorWallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.2, -15);
    this.roomMesh.add(ceiling);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.2), corridorWallMat);
    leftWall.position.set(-1.5, 1.6, -15);
    leftWall.rotation.y = Math.PI / 2;
    this.roomMesh.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.2), corridorWallMat);
    rightWall.position.set(1.5, 1.6, -15);
    rightWall.rotation.y = -Math.PI / 2;
    this.roomMesh.add(rightWall);

    const backEnd = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.2), corridorWallMat);
    backEnd.position.set(0, 1.6, -25);
    this.roomMesh.add(backEnd);
  }

  /**
   * Heavy steel door with physical Peephole lens, lock mechanism, and barricade slot.
   */
  private buildFrontDoorAndPeephole(): void {
    this.frontDoorMesh = new THREE.Group();
    this.frontDoorMesh.position.set(0, 0, -5);

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x1f1612,
      roughness: 0.7,
      metalness: 0.4
    });

    // Door slab (1.4m x 2.3m x 0.08m)
    const doorSlab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.3, 0.08), doorMat);
    doorSlab.position.set(0, 1.15, 0);
    this.frontDoorMesh.add(doorSlab);

    // Peephole brass cylinder
    const peepholeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16);
    const peepholeMat = new THREE.MeshStandardMaterial({ color: 0x886622, metalness: 0.9, roughness: 0.2 });
    const peephole = new THREE.Mesh(peepholeGeo, peepholeMat);
    peephole.rotation.x = Math.PI / 2;
    peephole.position.set(0, 1.6, 0);
    this.frontDoorMesh.add(peephole);

    // Deadbolt Handle
    const lockGeo = new THREE.BoxGeometry(0.12, 0.18, 0.06);
    const lockMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
    const lock = new THREE.Mesh(lockGeo, lockMat);
    lock.position.set(-0.55, 1.3, 0.06);
    this.frontDoorMesh.add(lock);

    this.roomMesh.add(this.frontDoorMesh);
  }

  /**
   * Vintage CRT Television with dynamic Canvas static / emergency warning texture.
   */
  private buildVintageTV(): void {
    this.tvCanvas = document.createElement('canvas');
    this.tvCanvas.width = 256;
    this.tvCanvas.height = 256;
    this.tvCtx = this.tvCanvas.getContext('2d')!;

    this.tvTexture = new THREE.CanvasTexture(this.tvCanvas);

    // TV Housing
    const tvGroup = new THREE.Group();
    tvGroup.position.set(3.2, 0.9, -4.2);
    tvGroup.rotation.y = -Math.PI * 0.75;

    const caseGeo = new THREE.BoxGeometry(0.9, 0.8, 0.7);
    const caseMat = new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 0.7 });
    const tvCase = new THREE.Mesh(caseGeo, caseMat);
    tvGroup.add(tvCase);

    // Screen
    const screenGeo = new THREE.PlaneGeometry(0.65, 0.55);
    const screenMat = new THREE.MeshBasicMaterial({ map: this.tvTexture });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0, 0.36);
    tvGroup.add(screen);

    this.roomMesh.add(tvGroup);
  }

  /**
   * Electrical breaker box for Phase 1 puzzle.
   */
  private buildBreakerBox(): void {
    const boxGroup = new THREE.Group();
    boxGroup.position.set(-3.94, 1.6, -1.5);
    boxGroup.rotation.y = Math.PI / 2;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.9, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 })
    );
    boxGroup.add(frame);

    // 4 Switches
    for (let i = 0; i < 4; i++) {
      const sw = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.14, 0.06),
        new THREE.MeshStandardMaterial({ color: this.breakerSwitches[i] ? 0x22ff44 : 0xff2222, emissive: 0x111111 })
      );
      sw.position.set(-0.2 + i * 0.13, 0, 0.08);
      boxGroup.add(sw);
    }

    this.roomMesh.add(boxGroup);
  }

  /**
   * Wardrobe / Closet that the player can physically hide inside.
   */
  private buildClosetHidingSpot(): void {
    const closetGroup = new THREE.Group();
    closetGroup.position.copy(this.closetPosition);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x1e1510, roughness: 0.8 });

    // Closet frame (1.4m wide x 2.4m high x 1.2m deep)
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.05), woodMat);
    back.position.set(0, 0, -0.6);
    closetGroup.add(back);

    const left = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.4, 1.2), woodMat);
    left.position.set(-0.7, 0, 0);
    closetGroup.add(left);

    const right = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.4, 1.2), woodMat);
    right.position.set(0.7, 0, 0);
    closetGroup.add(right);

    const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 1.2), woodMat);
    top.position.set(0, 1.2, 0);
    closetGroup.add(top);

    this.roomMesh.add(closetGroup);
  }

  /**
   * Bed, desk, batteries, and iron pipe barricade pickup.
   */
  private buildFurnitureAndAtmosphere(): void {
    // Bed
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-2.5, 0.35, 3.5);
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.5, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.9 })
    );
    bedGroup.add(mattress);
    this.roomMesh.add(bedGroup);

    // Desk
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.8, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x1f1712, roughness: 0.8 })
    );
    desk.position.set(2.8, 0.4, 2.5);
    this.roomMesh.add(desk);

    // Iron Barricade Pipe Pickup (on desk)
    const pipeGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 12);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9, roughness: 0.3 });
    const ironPipe = new THREE.Mesh(pipeGeo, pipeMat);
    ironPipe.rotation.z = Math.PI / 2;
    ironPipe.position.set(2.8, 0.85, 2.5);
    ironPipe.name = 'pickup_iron_pipe';
    this.roomMesh.add(ironPipe);

    // Battery pack pickup (on bed nightstand)
    const battGeo = new THREE.BoxGeometry(0.12, 0.08, 0.15);
    const battMat = new THREE.MeshStandardMaterial({ color: 0x2266aa, emissive: 0x051535 });
    const batt = new THREE.Mesh(battGeo, battMat);
    batt.position.set(-3.6, 0.7, 2.0);
    batt.name = 'pickup_battery';
    this.roomMesh.add(batt);
  }

  /**
   * Set up dramatic atmospheric lights.
   */
  private setupLighting(): void {
    // Ambient baseline (very dark)
    this.ambientLight = new THREE.AmbientLight(0x0a0a0c, 0.2);
    this.scene.add(this.ambientLight);

    // Main Overhead Room Lamp
    this.ceilingLight = new THREE.PointLight(0xffddaa, 0.8, 9);
    this.ceilingLight.position.set(0, 2.9, 0);
    this.ceilingLight.castShadow = true;
    this.scene.add(this.ceilingLight);

    // TV Screen Light (Flickers blue-white)
    this.tvLight = new THREE.PointLight(0x4488ff, 1.2, 6);
    this.tvLight.position.set(3.0, 1.0, -4.0);
    this.scene.add(this.tvLight);

    // Distant Hallway Light
    this.corridorLight = new THREE.PointLight(0xff2200, 0.6, 15);
    this.corridorLight.position.set(0, 2.8, -16);
    this.scene.add(this.corridorLight);
  }

  /**
   * Updates TV screen canvas animation.
   */
  public updateTVTexture(time: number): void {
    if (!this.tvCtx) return;

    if (this.tvMode === 'warning') {
      this.tvCtx.fillStyle = '#0a0a0a';
      this.tvCtx.fillRect(0, 0, 256, 256);

      this.tvCtx.fillStyle = '#ff2200';
      this.tvCtx.font = 'bold 26px monospace';
      this.tvCtx.fillText('EMERGENCY', 45, 60);
      this.tvCtx.fillText('BROADCAST', 45, 95);

      this.tvCtx.fillStyle = '#ffeeaa';
      this.tvCtx.font = '16px monospace';
      this.tvCtx.fillText('ANOMALY ACTIVE', 45, 140);
      this.tvCtx.fillText('DO NOT LOOK OUT', 45, 170);
      this.tvCtx.fillText('SURVIVE 3:33 AM', 45, 200);

      // Scanline static overlay
      for (let y = 0; y < 256; y += 4) {
        if (Math.random() < 0.2) {
          this.tvCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          this.tvCtx.fillRect(0, y, 256, 2);
        }
      }
    } else if (this.tvMode === 'static') {
      const imgData = this.tvCtx.createImageData(256, 256);
      const buf = new Uint32Array(imgData.data.buffer);
      for (let i = 0; i < buf.length; i++) {
        const val = Math.floor(Math.random() * 255);
        buf[i] = (255 << 24) | (val << 16) | (val << 8) | val;
      }
      this.tvCtx.putImageData(imgData, 0, 0);
    }

    this.tvTexture.needsUpdate = true;

    // TV light flicker
    this.tvLight.intensity = 0.8 + Math.sin(time * 20) * 0.4 + Math.random() * 0.3;
  }
}
