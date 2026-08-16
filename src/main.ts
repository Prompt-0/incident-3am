/**
 * INCIDENT: 3:07 AM — Application Entry Point
 */

import { IncidentGame } from './core/IncidentGame';

window.addEventListener('DOMContentLoaded', () => {
  const game = IncidentGame.getInstance();
  game.init();
});
