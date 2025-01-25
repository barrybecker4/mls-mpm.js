import { WaterSimulation } from '../library/WaterSimulation.js';
import { createSimulationRenderer } from './simulation-renderer.js';
import { createParameterControls } from './parameter-controls.js';

const simulation = new WaterSimulation();

function initializeSimulation() {
    simulation.addWaterDrop([0.40,0.75], 0.12, 0x1188FB);
    simulation.addWaterDrop([0.55,0.45], 0.10, 0x6611EE);
}

function advanceSimulation(iter) {
    simulation.advanceSimulation();
}

export const initWaterDrops = createSimulationRenderer(initializeSimulation, advanceSimulation, simulation.particles);
createParameterControls(simulation, 'parameter-controls');
