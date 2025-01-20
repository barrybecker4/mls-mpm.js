import { vec2, mat2, decomp, utils } from './algebra.js';
import { MpmSimulation } from './MpmSimulation.js';
import { Particle } from './particle.js';

export class FoldingSimulation extends MpmSimulation {
    constructor(config = {}) {
        super({
            ...config,
            gridResolution: config.gridResolution || 80
        });

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

        this.particle_mass = 1.0;
        this.vol = 1.0;
    }

    getMaterialProperties(particle) {
        return this.materialConstants[particle.c];
    }

    updateDeformationGradient(particle, F) {
        particle.F = F;
        particle.Jp = mat2.determinant(F);
    }

    advanceSimulation() {
        this.resetGrid();

        this.particlesToGrid();
        this.updateGridVelocities(0);
        this.gridToParticles();
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
