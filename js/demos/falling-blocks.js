"use strict";
import { dt, particles, advance, add_rnd_square } from '../mls-mpm.js';


export function initFallingBlocks(canvas, size) {

  let isRunning = true;
  const MARGIN = 48;
  const renderEvery = 5;
  const enableTiming = false;

  document.documentElement.style.setProperty('--canvas-size', `${size}px`);
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d', { alpha: false });
  let iter = 0;

  function display() {

      context.fillStyle = '#000000';
      context.fillRect(0, 0, size, size);

      context.lineWidth = 0.5;
      context.strokeStyle = '#CCCCCC';
      context.strokeRect(24, 24, size - MARGIN, size - MARGIN);

      for (let p of particles) {
          context.fillStyle = `#${p.c.toString(16)}`;
          context.fillRect(size * p.x[0] - 1, size - size * p.x[1] - 1, 2, 2);
      }
  }

  function step() {
      if (!isRunning) return;

      requestAnimationFrame(step);
      iter++;

      const mustRender = iter % renderEvery === 0;
      const mustTime = mustRender && enableTiming;

      // Advance simulation
      mustTime && console.time('advance');
      advance(dt);
      mustTime && console.timeEnd('advance');

      if (mustRender) {
          mustTime && console.time('display');
          display();
          mustTime && console.timeEnd('display');
      }
  }

  enableTiming && console.time('setup');
  add_rnd_square([0.55,0.45], 0xED553B);
  add_rnd_square([0.45,0.65], 0xF2B134);
  add_rnd_square([0.55,0.85], 0x168587);
  enableTiming && console.timeEnd('setup');

  step();

  return {
    pause: () => {
      isRunning = false;
    },
    resume: () => {
      if (!isRunning) {
        isRunning = true;
        step();
      }
    }
  };
}
