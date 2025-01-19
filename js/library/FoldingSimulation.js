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

    advanceSimulation() {
        this.resetGrid();

        this.p2g();
        this.updateGridVelocities(0);

        // G2P
        for (const p of this.particles) {
            const base_coord = vec2.sub(p.x.map(o => o * this.inv_dx), [0.5, 0.5])
                .map(o => parseInt(o));
            const fx = vec2.sub(vec2.scale(p.x, this.inv_dx), base_coord);
            const w = utils.createKernel(fx);

            p.C = [0, 0, 0, 0];
            p.v = [0, 0];

            // Gather from grid
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const dpos = vec2.sub([i, j], fx);
                    const ii = this.gridIndex(base_coord[0] + i, base_coord[1] + j);
                    const weight = w[i][0] * w[j][1];
                    p.v = vec2.add(p.v, vec2.scale(this.grid[ii], weight));
                    p.C = mat2.add(
                        p.C,
                        mat2.outer(vec2.scale(this.grid[ii], weight), dpos)
                            .map(o => o * 4 * this.inv_dx)
                    );
                }
            }

            // Advection
            p.x = vec2.add(p.x, vec2.scale(p.v, this.dt));

            // F update
            p.F = mat2.mul(p.F, mat2.add([1, 0, 0, 1], p.C.map(o => o * this.dt)));
            p.Jp = mat2.determinant(p.F);
        }
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
