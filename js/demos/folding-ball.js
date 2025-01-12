"use strict";
import { dt, particles, advance, add_rnd_disc, add_disc } from '../folding.js';


export function initFoldingBall(canvas, size) {

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

      context.lineWidth = 1;
      context.strokeStyle = '#4FB99F';
      context.strokeRect(24, 24, size - MARGIN, size - MARGIN);

      for(let p of particles) {
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

      // growth: obtained by shrinking the deformation tensor
      if (iter < 10) {
          for (let ind = 0; ind < particles.length; ind++) {
              const p = particles[ind];
              if(p.c == 0xED553B) {
                  p.F[0] *= 0.95;
                  p.F[1] *= 0.95;
                  p.F[2] *= 0.95;
                  p.F[3] *= 0.95;
              }
          }
      }

      // damping: obtaining by shrinking the particle's velocity
      for (let ind = 0; ind < particles.length; ind++) {
          const p = particles[ind];
          p.v[0] *= 0.9;
          p.v[1] *= 0.9;
      }

      mustTime && console.timeEnd('advance');

      if(mustRender) {
          mustTime && console.time('display');
          display();
          mustTime && console.timeEnd('display');
      }
  }

  enableTiming && console.time('setup');
  add_disc([0.5, 0.5], 0.22, 0.24, 0xED553B);
  add_disc([0.5, 0.5], 0.1, 0.22, 0x168587);
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
