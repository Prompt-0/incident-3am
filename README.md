# INCIDENT: 3:07 AM

[![Three.js](https://img.shields.io/badge/three.js-0.170-black?style=for-the-badge&logo=threedotjs)](https://github.com/Prompt-0/incident-3am)
[![TypeScript](https://img.shields.io/badge/typescript-5.7-blue?style=for-the-badge&logo=typescript)](https://github.com/Prompt-0/incident-3am)
[![Vite](https://img.shields.io/badge/vite-6.0-purple?style=for-the-badge&logo=vite)](https://github.com/Prompt-0/incident-3am)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

An atmospheric, browser-native 3D found-footage psychological horror experience built with Three.js and TypeScript. Presented through the lens of a handheld VHS camcorder during an emergency containment breach at 3:07 AM.

---

## 📹 Core Features & Shaders

- **Found-Footage VHS Pipeline**: Custom GLSL post-processing passes creating authentic 1990s camcorder artifacts—interlaced CRT scanlines, dynamic tape head tracking jitter, chromatic aberration, and night vision phosphor amplification.
- **Physical Camcorder Simulation**: Dynamic lens fisheye curvature, battery decay UI, manual optical zoom, and procedural camera inertia / handheld sway.
- **Auditory AI Stalker**: An adaptive shadow entity that navigates towards sounds created by the player (footstep frequency, opening security doors, battery charging hum).
- **Spatial Audio Architecture**: Procedural binaural sound synthesis powered by the Web Audio API—analog magnetic tape hiss, distant metallic groans, heart rate monitors, and acoustic interference.
- **Interactive Environment**: Explorable research facility with functional keycard access panels, emergency power switches, and log terminals.

---

## 🕹️ Controls

| Key | Action |
| :--- | :--- |
| `W` / `A` / `S` / `D` | Movement |
| `Mouse` | Look around (Pointer Lock) |
| `Shift` | Sprint |
| `Right Click` / `Z` | Camcorder Optical Zoom |
| `F` | Night Vision / IR Light Toggle |
| `E` | Interact / Keycard Doors |
| `Esc` | Pause Menu |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/Prompt-0/incident-3am.git
cd incident-3am

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build production bundle
npm run build
```

---

## 📄 License
Licensed under the MIT License.
