import { WaterSimulation } from '../library/WaterSimulation.js';
import { createSimulationRenderer } from './simulation-renderer.js';

const simulation = new WaterSimulation();

export const initWaterDrops = createSimulationRenderer(simulation);
