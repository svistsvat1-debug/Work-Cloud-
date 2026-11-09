// Entry point: creates the game, keeps the canvas at 16:9, and runs the game loop.

import { Game } from './core/Game.js';
import { GameConfig } from './config/GameConfig.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

/** Scale the 1920x1080 canvas to fit the window while keeping 16:9 (letterboxing). */
function resize() {
  const scale = Math.min(window.innerWidth / GameConfig.width, window.innerHeight / GameConfig.height);
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
