import { vec2, mat2, decomp, utils } from './algebra.js';
import { MpmSimulation } from './MpmSimulation.js';
import { Particle } from './particle.js';
import { Parameter } from '../library/Parameter.js';


export class FoldingSimulation extends MpmSimulation {
    constructor() {
        super();
        // Material constants mapping
        this.materialConstants = {
            0x168587: { // white matter, soft
                E: 100,
                nu: 0.2
            },
            0xED553B: { // grey matter, harder
                E: 3000,
                nu: 0.2
            }
        };

        // Compute derived constants for each material
        for (let color in this.materialConstants) {
            const { E, nu } = this.materialConstants[color];
            this.materialConstants[color].mu = E / (2 * (1 + nu));
            this.materialConstants[color].lambda = E * nu / ((1 + nu) * (1 - 2 * nu));
        }
    }

    initialize() {
        this.add_disc([0.5, 0.5], 0.22, 0.24, 0xED553B);
        this.add_disc([0.5, 0.5], 0.1, 0.22, 0x168587);
    }

    advance(iter) {
        this.advanceSimulation();

        // growth: obtained by shrinking the deformation tensor
        if (iter < 10) {
            for (let ind = 0; ind < this.particles.length; ind++) {
                const p = this.particles[ind];
                if(p.c == 0xED553B) {
                    p.F[0] *= 0.95;
                    p.F[1] *= 0.95;
                    p.F[2] *= 0.95;
                    p.F[3] *= 0.95;
                }
            }
        }

        // damping: obtaining by shrinking the particle's velocity
        for (let ind = 0; ind < this.particles.length; ind++) {
            const p = this.particles[ind];
            p.v[0] *= 0.9;
            p.v[1] *= 0.9;
        }
    }

    getMaterialProperties(particle) {
        return this.materialConstants[particle.c];
    }

    updateDeformationGradient(particle, F) {
        particle.F = F;
        particle.Jp = mat2.determinant(F);
    }

    add_disc(center, minRadius, maxRadius, color) {
        const res = 0.005;
        const maxRadiusSq = maxRadius * maxRadius;
        const minRadiusSq = minRadius * minRadius;

        for (let i = -maxRadius; i < maxRadius; i += res) {
            for (let j= -maxRadius; j < maxRadius; j += res) {
                if (i**2 + j**2 < maxRadiusSq && i**2 + j**2 > minRadiusSq) {
                    this.particles.push(new Particle(vec2.add([i, j], center), color));
                }
            }
        }
    }
}
