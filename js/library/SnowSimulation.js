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

    // Snow-like hardening
    getMaterialProperties(particle) {
        const e = Math.exp(this.hardening * (1.0 - particle.Jp));
        if (e <= 0) throw new Error("e = " + e);
        const mu = this.mu_0 * e;
        const lambda = this.lambda_0 * e;
        return { lambda, mu };
    }

    updateDeformationGradient(particle, F) {
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

    advanceSimulation() {
        this.resetGrid();

        this.particlesToGrid();
        this.updateGridVelocities(-200);
        this.gridToParticles();
    }

    add_rnd_square(center, color) {
        for (let i = 0; i < 1000; i++) {
            const offset = [(Math.random() * 2 - 1) * 0.08, (Math.random() * 2 - 1) * 0.08];
            const position = vec2.add(center, offset);
            this.particles.push(new Particle(position, color));
        }
    }
}