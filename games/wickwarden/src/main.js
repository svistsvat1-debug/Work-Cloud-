// Entry point: creates the game, keeps the canvas at 16:9, and runs the game loop.

import { Game } from './core/Game.js';
import { GameConfig } from './config/GameConfig.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

/**
 * Scale the 1920x1080 canvas to fit while keeping 16:9 (letterboxing).
 * Fits inside #stage when the page has one (it respects phone safe areas), otherwise the window.
 */
function resize() {
  const stage = document.getElementById('stage');
  const width = stage ? stage.clientWidth : window.innerWidth;
  const height = stage ? stage.clientHeight : window.innerHeight;
  const scale = Math.min(width / GameConfig.width, height / GameConfig.height);
  canvas.style.width = `${Math.floor(GameConfig.width * scale)}px`;
  canvas.style.height = `${Math.floor(GameConfig.height * scale)}px`;
}
window.addEventListener('resize', resize);
resize();

let lastTime = performance.now();
function loop(now) {
  const dt = (now - lastTime) / 1000; // delta time in seconds
  lastTime = now;
  game.frame(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Handy for experimenting in the browser console: window.game.player.health = 999
window.game = game;
