//"use strict";
import { dt, particles, advance, add_rnd_square } from '../mls-mpm.js';

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

    context.lineWidth = 0.5;
    context.strokeStyle = '#CCCCCC';
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
    mustTime && console.timeEnd('advance');

    if(mustRender) {
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