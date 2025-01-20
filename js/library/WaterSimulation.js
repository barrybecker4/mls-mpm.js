import { vec2, mat2, decomp, utils } from './algebra.js';
import { MpmSimulation } from './MpmSimulation.js';
import { Particle } from './particle.js';

export class WaterSimulation extends MpmSimulation {
    constructor() {
        super();
        // Material constants for water
        this.density0 = 1000.0;         // water density
        this.bulk_modulus = 200.0;      // bulk modulus of water (Pa). Resistance to compression
        this.dynamic_viscosity = 0.2;   // water viscosity
        this.gamma = 7.0;               // For nonlinear pressure response
    }

    getMaterialProperties(particle) {

        const J = mat2.determinant(particle.F);

        // Pressure directly proportional to volume change
        const pressure = this.bulk_modulus * (26.0 - Math.pow(J, -this.gamma));

        // For fluids, lambda should provide the pressure response
        // divide by J to get Kirchhoff stress. negative because pressure resists compression
        const lambda = pressure; // / J;
        const mu = this.dynamic_viscosity;

        return { lambda, mu };
    }

    updateDeformationGradient(particle, F) {
        // For water, mainly track volume changes
        const J = mat2.determinant(F);

        // Tighter bounds on volume change
        if (J < 0.7 || J > 1.3) {
            console.log("J out of bounds: ", J);
        }
        const newJ = Math.max(0.7, Math.min(J, 1.3));
        //const newJ = Math.max(0.96, Math.min(J, 1.04));
        const scale = Math.sqrt(newJ / J);
        particle.F = [F[0] * scale, F[1] * scale, F[2] * scale, F[3] * scale];
        particle.Jp = newJ;
    }

    advanceSimulation() {
        this.resetGrid();
        this.particlesToGrid();
        // Water typically needs higher gravity for realistic behavior
        this.updateGridVelocities(-200);
        this.gridToParticles();
    }

    // You might want to add methods for creating water drops or streams
    addWaterDrop(center, radius, color) {
        const num_particles = 1000;
        let c = 1000;
        for (let i = 0; i < num_particles; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const r = Math.sqrt(Math.random()) * radius;
            const offset = [r * Math.cos(theta), r * Math.sin(theta)];
            const position = vec2.add(center, offset);
            this.particles.push(new Particle(position, color));
        }
    }
}