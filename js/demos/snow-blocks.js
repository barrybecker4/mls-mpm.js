import { SnowSimulation } from '../library/SnowSimulation.js';
import { createSimulationRenderer } from './simulation-renderer.js';

const simulation = new SnowSimulation();

export const initSnowBlocks = createSimulationRenderer(simulation);
