import {
    add2D, sca2D, sub2D,had2D,
    addMat,subMat,
    add3D, sca3D,
    determinant, transposed,
    mulMat, mulMatVec,
    polar_decomp, outer_product, clamp, svd, createKernal,
} from './algebra.js';
import { Particle } from './Particle.js';

const n = 90; // grid resolution (cells)
export const dt = 1e-4; // time step for simulation
const dx = 1.0 / n; // cell width
const inv_dx = 1.0 / dx; // number of cells as a real number

// material constants
const particle_mass = 1.0;
const vol = 1.0; // particle volume
const hardening = 10.0; // hardening constant for snow plasticity under compression
const E = 1e+4; // Young's modulus
const nu = 0.2; // Poisson's ratio
const mu_0 = E / (2 * (1 + nu)); // Shear modulus (or Dynamic viscosity in fluids)
const lambda_0 = E * nu / ((1 + nu) * (1 - 2 * nu)); // Lamé's 1st parameter \lambda=K-(2/3)\mu, where K is the Bulk modulus
const plastic = 1; // whether (1=true) or not (0=false) to simulate plasticity

export const particles = [];
const grid = []; // velocity + mass, node_res = cell_res + 1

export function advance(dt) {
    // Reset grid
    for(let i = 0; i < (n + 1) * (n + 1); i++) {
        grid[i] = [0, 0, 0];
    }

    // 1. Particles to grid
    for (let p of particles) {
        const base_coord = sub2D(sca2D(p.x, inv_dx), [0.5, 0.5]).map(o => parseInt(o)); // element-wise floor
        const fx = sub2D(sca2D(p.x, inv_dx), base_coord); // base position in grid units
        // Quadratic kernels  [http://mpm.graphics   Eqn. 123, with x=fx, fx-1, fx-2]
        const w = createKernal(fx);

        // Snow-like hardening
        const e = Math.exp(hardening * (1.0 - p.Jp));
        if (e <= 0) throw new Error("e = " + e);
        const mu = mu_0 * e;
        const lambda=lambda_0 * e;

        // Cauchy stress times dt and inv_dx
        // original taichi: stress = -4 * inv_dx * inv_dx * dt * vol * ( 2 * mu * (p.F - r) * transposed(p.F) + lambda * (J-1) * J )
        // (in taichi matrices are coded transposed)
        const J = determinant(p.F); // Current volume
        const { R:r, S:s } = polar_decomp(p.F); // Polar decomp. for fixed corotated model
        const k1 = -4 * inv_dx * inv_dx * dt * vol;
        const k2 = lambda * (J - 1) * J;

        const stress = addMat(
            mulMat(subMat(transposed(p.F), r), p.F).map(o=> o * 2 * mu),
            [k2, 0, 0, k2]
        ).map(o => o * k1);

        const affine = addMat(stress, p.C.map(o=> o * particle_mass));

        const mv = [p.v[0] * particle_mass, p.v[1] * particle_mass, particle_mass]; // translational momentum
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) { // scatter to grid
                const dpos = [(i - fx[0]) * dx, (j - fx[1]) * dx];
                const ii = gridIndex(base_coord[0] + i, base_coord[1] + j);
                const weight = w[i][0] * w[j][1];
                grid[ii] = add3D(grid[ii], sca3D(add3D(mv, [...mulMatVec(affine, dpos), 0]), weight));
            }
        }
    }

    // Modify grid velocities to respect boundaries
    const boundary = 0.05;

    for ( let i = 0; i <= n; i++) {
        for (let j = 0; j <= n; j++) { // for all grid nodes
            const ii = gridIndex(i, j);
            if (grid[ii][2] > 0) { // no need for epsilon here
                grid[ii] = grid[ii].map(o => o / grid[ii][2]); // normalize by mass
                grid[ii] = add3D(grid[ii], [0, -200 * dt, 0]); // add gravity
                const x = i / n;
                const y = j / n; // boundary thickness, node coord

                // stick
                if (x < boundary || x > 1-boundary || y > 1 - boundary) {
                    grid[ii] = [0, 0, 0];
                }

                // separate
                if (y < boundary) {
                    grid[ii][1] = Math.max(0.0, grid[ii][1]);
                }
            }
        }
    }

    // 2. Grid to particle
    for (let p of particles) {
        const base_coord = sub2D(p.x.map(o => o * inv_dx), [0.5, 0.5]).map(o => parseInt(o)); // element-wise floor
        const fx = sub2D(sca2D(p.x, inv_dx), base_coord); // base position in grid units
        const w = createKernal(fx);

        p.C = [0, 0,  0, 0];
        p.v = [0, 0];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const dpos = sub2D([i, j], fx);
                const ii = gridIndex(base_coord[0] + i, base_coord[1] + j);
                const weight = w[i][0] * w[j][1];
                p.v = add2D(p.v, sca2D(grid[ii], weight)); // velocity
                // APIC (affine particle-in-cell); p.C is the affine momentum
                p.C = addMat(p.C, outer_product(sca2D(grid[ii], weight), dpos).map(o => o * 4 * inv_dx));
            }
        }

        // advection
        p.x = add2D(p.x, sca2D(p.v, dt));

        // MLS-MPM F-update
        // original taichi: F = (Mat(1) + dt * p.C) * p.F
        let F = mulMat(p.F, addMat([1, 0,  0, 1], p.C.map(o => o * dt)));
        //let F = mulMat(addMat([1, 0,  0, 1], p.C.map(o => o * dt)), p.F);

        // Snow-like plasticity
        let {U:svd_u, sig:sig, V:svd_v} = svd(F);
        for (let i = 0; i < 2 * plastic; i++) {
            sig[i + 2 * i] = clamp(sig[i + 2 * i], 1.0 - 2.5e-2, 1.0 + 7.5e-3);
        }
        const oldJ = determinant(F);
        // original taichi: F = svd_u * sig * transposed(svd_v)
        F = mulMat(mulMat(svd_u, sig), transposed(svd_v));
        const Jp_new = clamp(p.Jp * oldJ / determinant(F), 0.6, 20.0);
        p.Jp = Jp_new;
        p.F = F;
    }
}

// Randomly sample 1000 particles in the square
export function add_rnd_square(center, color) {
    for (let i = 0; i < 1000; i++) {
        const offset = [(Math.random() * 2 - 1) * 0.08, (Math.random() * 2 - 1) * 0.08];
        const position = add2D(center, offset);
        particles.push(new Particle(position, color));
    }
}

function gridIndex(i, j) { return i + (n + 1) * j; }
