"use strict";
import { dt, particles, advance, add_rnd_disc, add_disc } from '../folding.js';

const CANVAS_SIZE = 600;
const MARGIN = 48;
const renderEvery = 5;
const enableTiming = false;

document.documentElement.style.setProperty('--canvas-size', `${CANVAS_SIZE}px`);
const canvas = document.getElementById('canvas');
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

const context = canvas.getContext('2d', { alpha: false });
let iter = 0;

function display() {

    context.fillStyle = '#000000';
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    context.lineWidth = 1;
    context.strokeStyle = '#4FB99F';
    context.strokeRect(24, 24, CANVAS_SIZE - MARGIN, CANVAS_SIZE - MARGIN);

    for(let p of particles) {
        context.fillStyle = `#${p.c.toString(16)}`;
        context.fillRect(CANVAS_SIZE * p.x[0] - 1, CANVAS_SIZE - CANVAS_SIZE * p.x[1] - 1, 2, 2);
    }
}

function step() {
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

/* Start the simulation */
step();