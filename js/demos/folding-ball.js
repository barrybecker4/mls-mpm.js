import { dt, particles, advance, add_rnd_disc, add_disc } from '../library/folding.js';
import { createSimulation } from './simulation.js';

function initializeSimulation() {
    add_disc([0.5, 0.5], 0.22, 0.24, 0xED553B);
    add_disc([0.5, 0.5], 0.1, 0.22, 0x168587);
}

function advanceSimulation(iter) {
    advance(dt);

    // growth: obtained by shrinking the deformation tensor
    if (iter < 10) {
        for (let ind = 0; ind < particles.length; ind++) {
            const p = particles[ind];
            if(p.c == 0xED553B) {
                p.F[0] *= 0.95;
                p.F[1] *= 0.95;
                p.F[2] *= 0.95;
                p.F[3] *= 0.95;
            }
        }
    }

    // damping: obtaining by shrinking the particle's velocity
    for (let ind = 0; ind < particles.length; ind++) {
        const p = particles[ind];
        p.v[0] *= 0.9;
        p.v[1] *= 0.9;
    }
}

export const initFoldingBall = createSimulation(initializeSimulation, advanceSimulation, particles);
