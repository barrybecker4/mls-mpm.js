import { FoldingSimulation } from '../library/FoldingSimulation.js';
import { createSimulationRenderer } from './simulation-renderer.js';

const simulation = new FoldingSimulation();

export const initFoldingBall = createSimulationRenderer(simulation);
