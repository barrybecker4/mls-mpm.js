import { SnowSimulation } from '../library/SnowSimulation.js';
import { createSimulationRenderer } from './simulation-renderer.js';

const simulation = new SnowSimulation();

function initializeSimulation() {
    simulation.add_rnd_square([0.55,0.45], 0xED553B);
    simulation.add_rnd_square([0.45,0.65], 0xF2B134);
    simulation.add_rnd_square([0.55,0.85], 0x168587);
}

function advanceSimulation(iter) {
    simulation.advanceSimulation();
}

export const initFallingBlocks = createSimulationRenderer(initializeSimulation, advanceSimulation, simulation.particles);
