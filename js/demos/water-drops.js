import { WaterSimulation } from '../library/WaterSimulation.js';
import { createSimulationRenderer } from './simulation-renderer.js';
import { createParameterControls } from './parameter-controls.js';

const simulation = new WaterSimulation();


export const initWaterDrops = createSimulationRenderer(simulation);
createParameterControls(simulation, 'parameter-controls');
