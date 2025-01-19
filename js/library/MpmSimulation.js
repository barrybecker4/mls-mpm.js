import { vec2, vec3, mat2, utils, decomp } from './algebra.js';

export class MpmSimulation {

    constructor(config = {}) {
        this.n = config.gridResolution || 90; // grid resolution
        this.dt = config.timeStep || 1e-4;    // time step
        this.dx = 1.0 / this.n;              // cell width
        this.inv_dx = 1.0 / this.dx;         // inverse cell width
        this.boundary = config.boundary || 0.05;

        this.particles = [];
        this.grid = [];
    }

    // Advance simulation - must be implemented by subclasses
    advanceSimulation() {
        throw new Error('advanceSimulation must be implemented by subclass');
    }

    getMaterialProperties(particle) {
        throw new Error('getMaterialProperties must be implemented by subclass');
    }

    p2g() {
        for (const p of this.particles) {
            const base_coord = vec2.sub(vec2.scale(p.x, this.inv_dx), [0.5, 0.5])
                .map(o => parseInt(o));
            const fx = vec2.sub(vec2.scale(p.x, this.inv_dx), base_coord);
            const w = utils.createKernel(fx);

            const { mu, lambda } = this.getMaterialProperties(p);

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
    }

    // Utility methods shared by all simulations
    resetGrid() {
        for(let i = 0; i < (this.n + 1) * (this.n + 1); i++) {
            this.grid[i] = [0, 0, 0];
        }
    }

    gridIndex(i, j) {
        return i + (this.n + 1) * j;
    }

    transferToGrid(p, stress, mass, base_coord, fx, w) {
        const mv = [p.v[0] * mass, p.v[1] * mass, mass];

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const dpos = [(i - fx[0]) * this.dx, (j - fx[1]) * this.dx];
                const ii = this.gridIndex(base_coord[0] + i, base_coord[1] + j);
                const weight = w[i][0] * w[j][1];
                this.grid[ii] = vec3.add(
                    this.grid[ii],
                    vec3.scale(vec3.add(mv, [...mat2.mulVec(stress, dpos), 0]), weight)
                );
            }
        }
    }

    // Update grid velocities (no gravity for folding)
    updateGridVelocities(gravity = -200) {
        for (let i = 0; i <= this.n; i++) {
            for (let j = 0; j <= this.n; j++) {
                const ii = this.gridIndex(i, j);
                if (this.grid[ii][2] > 0) {
                    // Normalize by mass
                    this.grid[ii] = this.grid[ii].map(o => o / this.grid[ii][2]);
                    // Add gravity
                    this.grid[ii] = vec3.add(this.grid[ii], [0, gravity * this.dt, 0]);

                    const x = i / this.n;
                    const y = j / this.n;

                    // Apply boundary conditions
                    if (x < this.boundary || x > 1-this.boundary || y > 1-this.boundary) {
                        this.grid[ii] = [0, 0, 0];
                    }
                    if (y < this.boundary) {
                        this.grid[ii][1] = Math.max(0.0, this.grid[ii][1]);
                    }
                }
            }
        }
    }
}