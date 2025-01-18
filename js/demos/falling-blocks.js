import { dt, particles, advance, add_rnd_square } from '../mls-mpm.js';
import { createSimulation } from './simulation.js';

function initializeSimulation() {
    add_rnd_square([0.55,0.45], 0xED553B);
    add_rnd_square([0.45,0.65], 0xF2B134);
    add_rnd_square([0.55,0.85], 0x168587);
}

function advanceSimulation(iter) {
    advance(dt);
}

export const initFallingBlocks = createSimulation(initializeSimulation, advanceSimulation, particles);
