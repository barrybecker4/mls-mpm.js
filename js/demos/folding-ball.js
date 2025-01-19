import { FoldingSimulation } from '../library/FoldingSimulation.js';
import { createSimulationRenderer } from './simulation-renderer.js';


const simulation = new FoldingSimulation();

function initializeSimulation() {
    simulation.add_disc([0.5, 0.5], 0.22, 0.24, 0xED553B);
    simulation.add_disc([0.5, 0.5], 0.1, 0.22, 0x168587);
}

function advanceSimulation(iter) {
    simulation.advanceSimulation();

    // growth: obtained by shrinking the deformation tensor
    if (iter < 10) {
        for (let ind = 0; ind < simulation.particles.length; ind++) {
            const p = simulation.particles[ind];
            if(p.c == 0xED553B) {
                p.F[0] *= 0.95;
                p.F[1] *= 0.95;
                p.F[2] *= 0.95;
                p.F[3] *= 0.95;
            }
        }
    }

    // damping: obtaining by shrinking the particle's velocity
    for (let ind = 0; ind < simulation.particles.length; ind++) {
        const p = simulation.particles[ind];
        p.v[0] *= 0.9;
        p.v[1] *= 0.9;
    }
}

export const initFoldingBall = createSimulationRenderer(initializeSimulation, advanceSimulation, simulation.particles);
