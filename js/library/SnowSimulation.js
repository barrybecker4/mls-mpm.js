import { vec2, mat2, decomp, utils } from './algebra.js';
import { MpmSimulation } from './MpmSimulation.js';
import { Particle } from './particle.js';

export class SnowSimulation extends MpmSimulation {
    constructor(config = {}) {
        super(config);

        // Material constants
        this.particle_mass = 1.0;
        this.vol = 1.0;
        this.hardening = 10.0;
        this.E = 1e4;
        this.nu = 0.2;
        this.mu_0 = this.E / (2 * (1 + this.nu));
        this.lambda_0 = this.E * this.nu / ((1 + this.nu) * (1 - 2 * this.nu));
        this.plastic = 1;
    }

    advanceSimulation() {
        this.resetGrid();

        // P2G
        for (const p of this.particles) {
            const base_coord = vec2.sub(vec2.scale(p.x, this.inv_dx), [0.5, 0.5])
                .map(o => parseInt(o));
            const fx = vec2.sub(vec2.scale(p.x, this.inv_dx), base_coord);
            const w = utils.createKernel(fx);

            // Snow-like hardening
            const e = Math.exp(this.hardening * (1.0 - p.Jp));
            if (e <= 0) throw new Error("e = " + e);
            const mu = this.mu_0 * e;
            const lambda = this.lambda_0 * e;

            // Stress computation
            const J = mat2.determinant(p.F);
            const { R: r } = decomp.polar(p.F);
            const k1 = -4 * this.inv_dx * this.inv_dx * this.dt * this.vol;
            const k2 = lambda * (J - 1) * J;

            const stress = mat2.add(
                mat2.mul(mat2.sub(mat2.transpose(p.F), r), p.F)
                    .map(o => o * 2 * mu),
                [k2, 0, 0, k2]
            ).map(o => o * k1);

            const affine = mat2.add(stress, p.C.map(o => o * this.particle_mass));

            // Transfer to grid
            this.transferToGrid(p, affine, this.particle_mass, base_coord, fx, w);
        }

        // P2G
        for (const p of this.particles) {
            const base_coord = vec2.sub(vec2.scale(p.x, this.inv_dx), [0.5, 0.5])
                .map(o => parseInt(o));
            const fx = vec2.sub(vec2.scale(p.x, this.inv_dx), base_coord);
            const w = utils.createKernel(fx);

            // Get material properties
            const { mu, lambda } = { mu: this.mu_0, lambda: this.lambda_0 }; //this.materialConstants[p.c];

            // Stress computation
            const J = mat2.determinant(p.F);
            const { R: r } = decomp.polar(p.F);
            const k1 = -4 * this.inv_dx * this.inv_dx * this.dt * this.vol;
            const k2 = lambda * (J - 1) * J;

            const stress = mat2.add(
                mat2.mul(mat2.sub(mat2.transpose(p.F), r), p.F)
                    .map(o => o * 2 * mu),
                [k2, 0, 0, k2]
            ).map(o => o * k1);

            const affine = mat2.add(stress, p.C.map(o => o * this.particle_mass));

            // Transfer to grid
            this.transferToGrid(p, affine, this.particle_mass, base_coord, fx, w);
        }

        // Update grid velocities
        this.updateGridVelocities(-200);

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
            let F = mat2.mul(p.F, mat2.add([1, 0, 0, 1], p.C.map(o => o * this.dt)));

            // Snow plasticity
            let { U: svd_u, sig: sig, V: svd_v } = decomp.svd(F);
            for (let i = 0; i < 2 * this.plastic; i++) {
                sig[i + 2 * i] = utils.clamp(sig[i + 2 * i], 1.0 - 2.5e-2, 1.0 + 7.5e-3);
            }
            const oldJ = mat2.determinant(F);
            F = mat2.mul(mat2.mul(svd_u, sig), mat2.transpose(svd_v));
            p.Jp = utils.clamp(p.Jp * oldJ / mat2.determinant(F), 0.6, 20.0);
            p.F = F;
        }
    }

    add_rnd_square(center, color) {
        for (let i = 0; i < 1000; i++) {
            const offset = [(Math.random() * 2 - 1) * 0.08, (Math.random() * 2 - 1) * 0.08];
            const position = vec2.add(center, offset);
            this.particles.push(new Particle(position, color));
        }
    }
}