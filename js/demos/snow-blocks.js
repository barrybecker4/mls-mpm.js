import { SnowSimulation } from '../library/SnowSimulation.js';
import { createSimulationRenderer } from './simulation-renderer.js';

const simulation = new SnowSimulation();

function initializeSimulation() {
    simulation.addSnowSquare([0.55,0.45], 0xED553B);
    simulation.addSnowSquare([0.45,0.65], 0xF2B134);
    simulation.addSnowSquare([0.55,0.85], 0x168587);
}

function advanceSimulation(iter) {
    simulation.advanceSimulation();
}

export const initSnowBlocks = createSimulationRenderer(initializeSimulation, advanceSimulation, simulation.particles);
