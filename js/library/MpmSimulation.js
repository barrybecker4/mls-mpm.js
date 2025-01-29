import { vec2, vec3, mat2, utils, decomp } from './algebra.js';
import { UiParameter } from './UiParameter.js';
import { MpmParameters } from './MpmParameters.js';

export class MpmSimulation {

    constructor() {
        this.isPaused = false;
        this.params = new MpmParameters();
        this.particles = [];
        this.grid = [];
        this.iter = 0;
    }

    getUiParameters() {
        return [
            new UiParameter('particle_mass', 0.5, 2.0, 0.1, 'Particle Mass'),
            new UiParameter( 'vol', 0.5, 2.0, 0.1, 'Volume' ),
            new UiParameter( 'gravity', -400.0, 400, 20.0, 'Gravity' ),
            new UiParameter( 'forceScale', 50, 300, 10, 'Force Scale' ),
            new UiParameter( 'dt', 0.00005, 0.0004, 0.000001, 'time step (dt)' ),
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
        this.updateGridVelocities(this.params.gravity);
        this.gridToParticles();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    addObject(center, color) {
        throw new Error('addObject must be implemented by subclass');
    }

    applyForce(center, forceVector, radius) {
        for (const particle of this.particles) {
            const dist = vec2.distance(center, particle.position);
            if (dist < radius) {
                particle.externalForce = forceVector;
            }
        }
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
            this.particleToGrid(particle);
        }
    }

    particleToGrid(particle) {
        const base_coord = this.calcBaseCoord(particle);
        const inv_dx = this.params.inv_dx;
        const fx = vec2.sub(vec2.scale(particle.position, inv_dx), base_coord);
        const w = utils.createKernel(fx);

        const { mu, lambda } = this.getMaterialProperties(particle);

        // Stress computation
        const J = mat2.determinant(particle.F);
        const { R: r } = decomp.polar(particle.F);
        const k1 = -4 * inv_dx * inv_dx * this.params.dt * this.params.vol;
        const k2 = lambda * (J - 1) * J;

        const stress = mat2.add(
            mat2.mul(mat2.sub(mat2.transpose(particle.F), r), particle.F).map(o => o * 2 * mu),
            [k2, 0, 0, k2]
        ).map(o => o * k1);

        const affine = mat2.add(stress, particle.Cauchy.map(o => o * this.params.particle_mass));
        if (isNaN(affine[0]) || isNaN(affine[1])) {
            throw new Error(`Invalid affine: ${affine} stress=${stress} p.velocity=${particle.velocity} ` +
                `p.Cauchy=${particle.Cauchy} p.F=${particle.F} p.position=${particle.position} k1=${k1} k2=${k2} lambda=${lambda} mu=${mu}`);
        }

        this.transferToGrid(particle, affine, this.params.particle_mass, base_coord, fx, w);
    }

    gridToParticles() {
        for (const particle of this.particles) {
            this.gridToParticle(particle);
        }
    }

    gridToParticle(particle) {
        const base_coord = this.calcBaseCoord(particle);
        const fx = vec2.sub(vec2.scale(particle.position, this.params.inv_dx), base_coord);
        const w = utils.createKernel(fx);

        particle.Cauchy = [0, 0, 0, 0];
        particle.velocity = [0, 0];

        // Gather from grid
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const dpos = vec2.sub([i, j], fx);
                const ii = this.gridIndex(base_coord[0] + i, base_coord[1] + j);
                const weight = w[i][0] * w[j][1];
                particle.velocity = vec2.add(particle.velocity, vec2.scale(this.grid[ii], weight));
                if (isNaN(particle.velocity[0]) || isNaN(particle.velocity[1])) {
                    throw new Error(`Invalid velocity: ${particle.velocity[0]} ${particle.velocity[1]} weight=${weight} ii:${ii} grid[ii]=${this.grid[ii]}`);
                }
                particle.Cauchy = mat2.add(
                    particle.Cauchy,
                    mat2.outer(vec2.scale(this.grid[ii], weight), dpos)
                        .map(o => o * 4 * this.params.inv_dx)
                );
                if (isNaN(particle.Cauchy[0] || isNaN(particle.Cauchy[1]))) {
                    throw new Error(`Invalid p.C: ${particle.Cauchy} dpos=${dpos} weight=${weight} ii:${ii} grid[ii]=${this.grid[ii]}`);
                }
            }
        }

        // change velocity be external force, if any
        if (particle.externalForce) {
            //console.log('old velocity:', particle.velocity, 'external force:', particle.externalForce);
            particle.velocity = vec2.add(particle.velocity, vec2.scale(particle.externalForce, this.params.forceScale));
            //console.log('new velocity:', particle.velocity);
            particle.externalForce = null;
        }
        // Advection
        particle.position = vec2.add(particle.position, vec2.scale(particle.velocity, this.params.dt));

        // F update
        let F = mat2.mul(particle.F, mat2.add([1, 0, 0, 1], particle.Cauchy.map(o => o * this.params.dt)));
        if (isNaN(F[0]) || isNaN(F[1])) {
            throw new Error(`Invalid F: ${F} particle.F=${particle.F} particle.Cauchy=${particle.Cauchy} p.v=${p.v} particle.x=${particle.x}`);
        }
        this.updateDeformationGradient(particle, F);
    }

    calcBaseCoord(particle) {
        const base_coord = vec2.sub(vec2.scale(particle.position, this.params.inv_dx), [0.5, 0.5]).map(o => parseInt(o));
        if (base_coord[0] < 0 || isNaN(base_coord[0])) {
            console.log(`Invalid base_coord: ${base_coord[0]} ${base_coord[1]} particle.pos=${particle.position} inv_dx=${this.params.inv_dx}`);
        }
        return base_coord;
    }

    resetGrid() {
        const maxIndex = (this.params.n + 1) * (this.params.n + 1);
        for (let i = 0; i < maxIndex; i++) {
            this.grid[i] = [0, 0, 0];
        }
    }

    gridIndex(i, j) {
        return i + (this.params.n + 1) * j;
    }

    transferToGrid(particle, affine, mass, base_coord, fx, w) {
        const mv = [particle.velocity[0] * mass, particle.velocity[1] * mass, mass];

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const dpos = [(i - fx[0]) * this.params.dx, (j - fx[1]) * this.params.dx];
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
                    throw new Error(`Invalid change: ${change} p.v=${particle.v} mv=${mv} dpos=${dpos} affine=${affine} weight=${weight} idx=${idx}`);
                }
                this.grid[idx] = vec3.add(this.grid[idx], change);
            }
        }
    }

    // Update grid velocities
    updateGridVelocities(gravity) {
        const n = this.params.n
        for (let i = 0; i <= n; i++) {
            for (let j = 0; j <= n; j++) {
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
            this.grid[idx] = vec3.add(this.grid[idx], [0, gravity * this.params.dt, 0]);

            const x = i / this.params.n;
            const y = j / this.params.n;

            // Apply boundary conditions
            const boundary = this.params.boundary;
            if (x < boundary || x > 1.0 - boundary || y > 1.0 - boundary) {
                this.grid[idx] = [0, 0, 0];
            }
            if (y < boundary) {
                this.grid[idx][1] = Math.max(0.0, this.grid[idx][1]);
            }
        }
    }
}