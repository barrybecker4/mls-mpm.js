import { vec2, vec3, mat2, utils, decomp } from './algebra.js';

export class MpmSimulation {

    constructor() {
        this.particle_mass = 1.0;
        this.vol = 1.0;
        this.gravity = -200;

        this.n = 90;                  // grid resolution
        this.dt = 1e-4;               // time step
        this.dx = 1.0 / this.n;       // cell width
        this.inv_dx = 1.0 / this.dx;  // inverse cell width
        this.boundary = 0.05;

        this.particles = [];
        this.grid = [];
    }

    advanceSimulation() {
        this.resetGrid();
        this.particlesToGrid();
        this.updateGridVelocities(this.gravity);
        this.gridToParticles();
    }

    // return { lambda, mu ) for a particle
    getMaterialProperties(particle) {
        throw new Error('getMaterialProperties must be implemented by subclass');
    }

    updateDeformationGradient(particle, F) {
        throw new Error('updateDeformationGradient must be implemented by subclass');
    }

    particlesToGrid() {
        for (const p of this.particles) {
            const base_coord = this.calcBaseCoord(p);
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

            this.transferToGrid(p, affine, this.particle_mass, base_coord, fx, w);
        }
    }

    gridToParticles() {
        for (const p of this.particles) {
            const base_coord = this.calcBaseCoord(p);
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
            this.updateDeformationGradient(p, F);
        }
    }

    calcBaseCoord(p) {
        return vec2.sub(vec2.scale(p.x, this.inv_dx), [0.5, 0.5]).map(o => parseInt(o));
    }

    // Utility methods shared by all simulations
    resetGrid() {
        const maxIndex = (this.n + 1) * (this.n + 1);
        for (let i = 0; i < maxIndex; i++) {
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
                const idx = this.gridIndex(base_coord[0] + i, base_coord[1] + j);
                const weight = w[i][0] * w[j][1];
                this.grid[idx] = vec3.add(
                    this.grid[idx],
                    vec3.scale(vec3.add(mv, [...mat2.mulVec(stress, dpos), 0]), weight)
                );
            }
        }
    }

    // Update grid velocities
    updateGridVelocities(gravity) {
        for (let i = 0; i <= this.n; i++) {
            for (let j = 0; j <= this.n; j++) {
                const idx = this.gridIndex(i, j);
                this.updateGridVelocity(idx, i, j, gravity);
            }
        }
    }

    updateGridVelocity(idx, i, j, gravity) {
        if (this.grid[idx][2] > 0) {
            // Normalize by mass
            this.grid[idx] = this.grid[idx].map(o => o / this.grid[idx][2]);
            // Add gravity
            this.grid[idx] = vec3.add(this.grid[idx], [0, gravity * this.dt, 0]);

            const x = i / this.n;
            const y = j / this.n;

            // Apply boundary conditions
            if (x < this.boundary || x > 1.0 - this.boundary || y > 1.0 - this.boundary) {
                this.grid[idx] = [0, 0, 0];
            }
            if (y < this.boundary) {
                this.grid[idx][1] = Math.max(0.0, this.grid[idx][1]);
            }
        }
    }
}