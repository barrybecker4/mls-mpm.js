import { vec2, vec3, mat2, utils, decomp } from './algebra.js';
import { Parameter } from './Parameter.js';

export class MpmSimulation {

    constructor() {
        this.isPaused = false;
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
        this.iter = 0;
    }

    getParameters() {
        return [
            new Parameter('particle_mass', 0.5, 2.0, 0.1, 'Particle Mass'),
            new Parameter( 'vol', 0.5, 2.0, 0.1, 'Volume' ),
            new Parameter( 'gravity', -400.0, 400, 20.0, 'Gravity' ),
            new Parameter( 'dt', 0.00005, 0.0004, 0.000001, 'time step (dt)' ),
        ];
    }

    initialize() {
        throw new Error('initialize must be implemented by subclass');
    }

    advance() {
        if (!this.isPaused) {
            this.advanceSimulation();
            this.iter++;
        }
    }

    restart() {
        this.particles = [];
        this.grid = [];
        this.iter = 0;
        this.resetGrid();
        this.initialize();
    }

    advanceSimulation() {
        this.resetGrid();
        this.particlesToGrid();
        this.updateGridVelocities(this.gravity);
        this.gridToParticles();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    // return { lambda, mu ) for a particle
    getMaterialProperties(particle) {
        throw new Error('getMaterialProperties must be implemented by subclass');
    }

    updateDeformationGradient(particle, F) {
        throw new Error('updateDeformationGradient must be implemented by subclass');
    }

    particlesToGrid() {
        for (const particle of this.particles) {
            const base_coord = this.calcBaseCoord(particle);
            const fx = vec2.sub(vec2.scale(particle.position, this.inv_dx), base_coord);
            const w = utils.createKernel(fx);

            const { mu, lambda } = this.getMaterialProperties(particle);

            // Stress computation
            const J = mat2.determinant(particle.F);
            const { R: r } = decomp.polar(particle.F);
            const k1 = -4 * this.inv_dx * this.inv_dx * this.dt * this.vol;
            const k2 = lambda * (J - 1) * J;

            const stress = mat2.add(
                mat2.mul(mat2.sub(mat2.transpose(particle.F), r), particle.F).map(o => o * 2 * mu),
                [k2, 0, 0, k2]
            ).map(o => o * k1);

            const affine = mat2.add(stress, particle.C.map(o => o * this.particle_mass));
            if (isNaN(affine[0]) || isNaN(affine[1])) {
                throw new Error(`Invalid affine: ${affine} stress=${stress} p.v=${p.v} p.C=${p.C} p.F=${p.F} p.x=${p.x} k1=${k1} k2=${k2} lambda=${lambda} mu=${mu}`);
            }

            this.transferToGrid(particle, affine, this.particle_mass, base_coord, fx, w);
        }
    }

    gridToParticles() {
        for (const particle of this.particles) {
            const base_coord = this.calcBaseCoord(particle);
            const fx = vec2.sub(vec2.scale(particle.position, this.inv_dx), base_coord);
            const w = utils.createKernel(fx);

            particle.C = [0, 0, 0, 0];
            particle.v = [0, 0];

            // Gather from grid
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const dpos = vec2.sub([i, j], fx);
                    const ii = this.gridIndex(base_coord[0] + i, base_coord[1] + j);
                    const weight = w[i][0] * w[j][1];
                    particle.v = vec2.add(particle.v, vec2.scale(this.grid[ii], weight));
                    if (isNaN(particle.v[0]) || isNaN(particle.v[1])) {
                        throw new Error(`Invalid velocity: ${particle.v[0]} ${particle.v[1]} weight=${weight} ii:${ii} grid[ii]=${this.grid[ii]}`);
                    }
                    particle.C = mat2.add(
                        particle.C,
                        mat2.outer(vec2.scale(this.grid[ii], weight), dpos)
                            .map(o => o * 4 * this.inv_dx)
                    );
                    if (isNaN(particle.C[0] || isNaN(particle.C[1]))) {
                        throw new Error(`Invalid p.C: ${particle.C} dpos=${dpos} weight=${weight} ii:${ii} grid[ii]=${this.grid[ii]}`);
                    }
                }
            }

            // Advection
            particle.position = vec2.add(particle.position, vec2.scale(particle.v, this.dt));

            // F update
            let F = mat2.mul(particle.F, mat2.add([1, 0, 0, 1], particle.C.map(o => o * this.dt)));
            if (isNaN(F[0]) || isNaN(F[1])) {
                throw new Error(`Invalid F: ${F} particle.F=${particle.F} particle.C=${particle.C} p.v=${p.v} particle.x=${particle.x}`);
            }
            this.updateDeformationGradient(particle, F);
        }
    }

    calcBaseCoord(particle) {
        const base_coord = vec2.sub(vec2.scale(particle.position, this.inv_dx), [0.5, 0.5]).map(o => parseInt(o));
        if (base_coord[0] < 0 || isNaN(base_coord[0])) {
            console.log(`Invalid base_coord: ${base_coord[0]} ${base_coord[1]} p.x=${p.x} inv_dx=${this.inv_dx}`);
        }
        return base_coord;
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

    transferToGrid(particle, affine, mass, base_coord, fx, w) {
        const mv = [particle.v[0] * mass, particle.v[1] * mass, mass];

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const dpos = [(i - fx[0]) * this.dx, (j - fx[1]) * this.dx];
                const idx = this.gridIndex(base_coord[0] + i, base_coord[1] + j);
                if (idx < 0 || idx >= this.grid.length || isNaN(idx)) {
                    console.log(`Invalid grid index: ${idx} base_coord[0]=${base_coord[0]} i=${i} base_coord[1]=${base_coord[1]} j=${j}`);
                }
                if (!this.grid[idx]) {
                    console.log(`Invalid grid index: ${idx} grid[idx]=${this.grid[idx]} grid.length=${this.grid.length}`);
                }
                const weight = w[i][0] * w[j][1];
                const change = vec3.scale(vec3.add(mv, [...mat2.mulVec(affine, dpos), 0]), weight);
                if (isNaN(change[0]) || isNaN(change[1])) {
                    throw new Error(`Invalid change: ${change} p.v=${p.v} mv=${mv} dpos=${dpos} affine=${affine} weight=${weight} idx=${idx}`);
                }
                this.grid[idx] = vec3.add(this.grid[idx], change);
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