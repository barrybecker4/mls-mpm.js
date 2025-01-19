import { vec2, vec3, mat2, decomp, utils } from './algebra.js';
import { Particle } from './Particle.js';

const n = 80; // grid resolution (cells)
export const dt = 1e-4; // time step for simulation
const dx = 1.0 / n; // cell width
const inv_dx = 1.0 / dx; // number of cells as a real number

// common material constants
const particle_mass = 1.0;
const vol = 1.0; // particle volume

// particular material constants
const CC = [];
CC[0x168587] = { // white matter, soft
    E: 100, // Young's modulus
    nu: 0.2 // Poisson's ratio
}
CC[0xED553B] = { // grey matter, harder
    E: 3000, // Young's modulus
    nu: 0.2 // Poisson's ratio
}
for (let c in CC) {
    const {E, nu} = CC[c];
    CC[c].mu = E / (2 * (1 + nu)); // Shear modulus (or Dynamic viscosity in fluids)
    CC[c].lambda = E * nu / ((1+nu) * (1 - 2 * nu)); // Lamé's 1st parameter \lambda=K-(2/3)\mu, where K is the Bulk modulus
}

export const particles = [];
const grid = []; // velocity + mass, node_res = cell_res + 1

function gridIndex(i, j, k) { return i + (n+1)*j; }

export function advance(dt) {
    // Reset grid
    for (let i = 0; i < (n + 1)**2; i++) {
        grid[i] = [0,0,0];
    }

    // 1. Particles to grid
    for (let p of particles) {
        const base_coord = vec2.sub(vec2.scale(p.x, inv_dx), [0.5, 0.5]).map(o => parseInt(o)); // element-wise floor
        const fx = vec2.sub(vec2.scale(p.x, inv_dx), base_coord); // base position in grid units

        // Quadratic kernels  [http://mpm.graphics   Eqn. 123, with x=fx, fx-1,fx-2]
        const w = utils.createKernel(fx);

        // Cauchy stress times dt and inv_dx
        // original taichi: stress = -4*inv_dx*inv_dx*dt*vol*( 2*mu*(p.F-r)*transposed(p.F) + lambda*(J-1)*J )
        // (in taichi matrices are coded transposed)
        const { mu, lambda } = CC[p.c];
        const J = mat2.determinant(p.F); // Current volume
        const { R:r, S:s } = decomp.polar(p.F);
        const k1 = -4 * inv_dx * inv_dx * dt * vol;
        const k2 = lambda * (J-1) * J;
        const stress = mat2.add(
            mat2.mul(mat2.sub(mat2.transpose(p.F), r), p.F).map(o => o * 2 * mu),
            [k2, 0, 0, k2]
        ).map(o => o * k1);

        const affine = mat2.add(stress, p.C.map(o => o * particle_mass));
        const mv = [p.v[0] * particle_mass, p.v[1] * particle_mass, particle_mass]; // translational momentum
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) { // scatter to grid
                const dpos = [(i - fx[0]) * dx, (j - fx[1]) * dx];
                const ii = gridIndex(base_coord[0] + i, base_coord[1] + j);
                const weight = w[i][0] * w[j][1];
                grid[ii] = vec3.add(grid[ii], vec3.scale(vec3.add(mv, [...mat2.mulVec(affine, dpos), 0]), weight));
            }
        }
    }

    // Modify grid velocities to respect boundaries
    const boundary = 0.05;
    for(let i = 0; i <= n; i++) {
        for(let j = 0; j <= n; j++) { // for all grid nodes
            const ii = gridIndex(i, j);
            if (grid[ii][2] > 0) { // no need for epsilon here
                grid[ii] = grid[ii].map(o => o / grid[ii][2]); // normalize by mass
                const x = i / n;
                const y = j / n; // boundary thickness, node coord

                // stick
                if (x < boundary || x > 1-boundary || y > 1-boundary || y < boundary) {
                    grid[ii] = [0,0,0];
                }
            }
        }
    }

    // 2. Grid to particle
    for (let ind = 0; ind < particles.length; ind ++) {
        const p = particles[ind];
        const base_coord = vec2.sub(p.x.map(o => o * inv_dx), [0.5,0.5]).map(o => parseInt(o));// element-wise floor
        const fx = vec2.sub(vec2.scale(p.x, inv_dx), base_coord); // base position in grid units
        const w = utils.createKernel(fx);
        p.C = [0,0, 0,0];
        p.v = [0, 0];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const dpos = vec2.sub([i, j], fx);
                const ii = gridIndex(base_coord[0] + i, base_coord[1] + j);
                const weight = w[i][0] * w[j][1];
                p.v = vec2.add(p.v, vec2.scale(grid[ii], weight)); // velocity
                // APIC C (Compatible affine particle-in-cell)
                p.C = mat2.add(p.C, mat2.outer(vec2.scale(grid[ii], weight), dpos).map(o => o * 4 * inv_dx));
            }
        }

        // advection
        p.x = vec2.add(p.x, vec2.scale(p.v, dt));

        // MLS-MPM F-update
        // original taichi: F = (Mat(1) + dt * p.C) * p.F
        p.F = mat2.mul(p.F, mat2.add([1,0, 0,1], p.C.map(o => o * dt)));
        p.Jp = mat2.determinant(p.F);
    }
}

export function add_rnd_disc(center, minRadius, maxRadius, c) {
  let n = 100000; // maximum number of particles (for a disc without hole)
  let i = 0;
  let p, x;
  const maxRadiusSq = maxRadius**2;
  const minRadiusSq = minRadius**2;
  let a = Math.PI * (maxRadiusSq - maxRadiusSq); // surface area of the disc
  n = parseInt(a * n); // actual number of particles
  while (i < n) {
    x = [2 * Math.random() - 1, 2 * Math.random() - 1];
    p = x[0]**2 + x[1]**2;
    if (p < maxRadiusSq && p > minRadiusSq) {
      particles.push(new Particle(vec2.add(x, center), c));
      i++;
    }
  }
}

export function add_disc(center, minRadius, maxRadius, color) {
  const res = 0.005;
  const maxRadiusSq = maxRadius**2;
  const minRadiusSq = minRadius**2;
  for (let i = -maxRadius; i < maxRadius; i += res) {
    for (let j= -maxRadius; j < maxRadius; j += res) {
      if (i**2 + j**2 < maxRadiusSq && i**2 + j**2 > minRadiusSq) {
        particles.push(new Particle(vec2.add([i, j], center), color));
      }
    }
  }
}
