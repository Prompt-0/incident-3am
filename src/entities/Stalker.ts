/**
 * INCIDENT: 3:07 AM — The Smiling Stalker Entity
 * Uncanny emaciated 2.8m tall entity with a pale porcelain grinning face,
 * elongated claw limbs, writhing tendrils, and stop-motion jitter animations.
 */

import * as THREE from 'three';

export class Stalker {
  public mesh: THREE.Group;
  public faceMesh!: THREE.Mesh;
  public leftArmGroup!: THREE.Group;
  public rightArmGroup!: THREE.Group;
  public tendrils: THREE.Mesh[] = [];

  public position: THREE.Vector3 = new THREE.Vector3(0, 0, -18);
  public isVisibleInNormalLight: boolean = false;
  public isChasing: boolean = false;
  public isOutsideDoor: boolean = false;

  private twitchTimer: number = 0;

  constructor() {
    this.mesh = new THREE.Group();
    this.buildStalkerMesh();
    this.mesh.position.copy(this.position);
  }

  private buildStalkerMesh(): void {
    const voidMat = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.9,
      metalness: 0.1
    });

    // 1. Emaciated Torso & Spine (2.8m tall)
    const spineGeo = new THREE.CylinderGeometry(0.1, 0.06, 1.8, 8);
    const spine = new THREE.Mesh(spineGeo, voidMat);
    spine.position.y = 1.6;
    this.mesh.add(spine);

    // Ribcage rings
    for (let i = 0; i < 6; i++) {
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(0.35 - i * 0.04, 0.03, 6, 12, Math.PI * 1.5),
        voidMat
      );
      rib.rotation.x = Math.PI / 2 + 0.2;
      rib.rotation.z = -Math.PI * 0.25;
      rib.position.set(0, 2.0 - i * 0.18, 0);
      this.mesh.add(rib);
    }

    // Long thin legs
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 1.3, 6), voidMat);
    leftLeg.position.set(-0.16, 0.65, 0);
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 1.3, 6), voidMat);
    rightLeg.position.set(0.16, 0.65, 0);
    this.mesh.add(leftLeg);
    this.mesh.add(rightLeg);

    // 2. The Uncanny Pale Grinning Face
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 128;
    faceCanvas.height = 128;
    const ctx = faceCanvas.getContext('2d')!;

    // Draw horrifying white mask face with hollow eyes and wide sickening smile
    ctx.fillStyle = '#eaeaea';
    ctx.beginPath();
    ctx.ellipse(64, 64, 55, 62, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deep hollow black eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(42, 50, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(86, 50, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red pinpoint pupils
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(42, 50, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(86, 50, 3, 0, Math.PI * 2);
    ctx.fill();

    // Horrifying wide stitched / jagged smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 75, 38, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.stroke();

    // Teeth stitches
    for (let x = 32; x <= 96; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 90);
      ctx.lineTo(x, 105);
      ctx.stroke();
    }

    const faceTexture = new THREE.CanvasTexture(faceCanvas);
    const faceMat = new THREE.MeshBasicMaterial({ map: faceTexture, transparent: true });

    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    this.faceMesh = new THREE.Mesh(headGeo, faceMat);
    this.faceMesh.position.set(0, 2.6, 0.05);
    this.faceMesh.rotation.y = Math.PI; // Face forward
    this.mesh.add(this.faceMesh);

    // 3. Elongated Spindly Arms & Razor Claws
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.35, 2.3, 0);
    const armGeo = new THREE.CylinderGeometry(0.03, 0.02, 1.4, 6);
    const leftArm = new THREE.Mesh(armGeo, voidMat);
    leftArm.position.y = -0.7;
    this.leftArmGroup.add(leftArm);
    this.mesh.add(this.leftArmGroup);

    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.35, 2.3, 0);
    const rightArm = new THREE.Mesh(armGeo, voidMat);
    rightArm.position.y = -0.7;
    this.rightArmGroup.add(rightArm);
    this.mesh.add(this.rightArmGroup);

    // 4. Writhing Shadow Tendrils on Back
    for (let t = 0; t < 6; t++) {
      const tendrilGeo = new THREE.CylinderGeometry(0.02, 0.005, 1.8, 5);
      const tendril = new THREE.Mesh(tendrilGeo, voidMat);
      tendril.position.set((t % 2 === 0 ? -1 : 1) * 0.18, 1.9 + (t * 0.1), -0.15);
      tendril.rotation.x = -Math.PI * 0.35;
      tendril.rotation.z = (t % 2 === 0 ? -1 : 1) * (0.3 + t * 0.15);
      this.tendrils.push(tendril);
      this.mesh.add(tendril);
    }
  }

  public update(dt: number, isNightVisionActive: boolean): void {
    // Visibility rules: If not visible in normal light, hide unless night vision is ON
    if (!this.isVisibleInNormalLight) {
      this.mesh.visible = isNightVisionActive;
    } else {
      this.mesh.visible = true;
    }

    const time = performance.now() * 0.003;

    // Writhing tendrils
    for (let i = 0; i < this.tendrils.length; i++) {
      const tendril = this.tendrils[i];
      const wave = Math.sin(time * 3 + i) * 0.25;
      tendril.rotation.z = (i % 2 === 0 ? -1 : 1) * (0.3 + i * 0.15 + wave);
    }

    // Arm reach animation
    if (this.isChasing) {
      this.leftArmGroup.rotation.x = -Math.PI * 0.45 + Math.sin(time * 10) * 0.2;
      this.rightArmGroup.rotation.x = -Math.PI * 0.45 + Math.cos(time * 10) * 0.2;
    } else {
      this.leftArmGroup.rotation.x = Math.sin(time * 2) * 0.1;
      this.rightArmGroup.rotation.x = -Math.sin(time * 2) * 0.1;
    }

    // Stop-motion Uncanny Twitch Jitter
    this.twitchTimer += dt;
    if (this.twitchTimer > 0.07) {
      this.twitchTimer = 0;
      if (Math.random() < 0.35) {
        this.faceMesh.rotation.z = (Math.random() - 0.5) * 0.4;
        this.faceMesh.rotation.x = (Math.random() - 0.5) * 0.3;
      } else {
        this.faceMesh.rotation.z = 0;
        this.faceMesh.rotation.x = 0;
      }
    }
  }
}
