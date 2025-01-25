import { vec2, mat2, decomp, utils } from './algebra.js';
import { MpmSimulation } from './MpmSimulation.js';
import { Particle } from './particle.js';
import { Parameter } from '../library/Parameter.js';


// try adding sliders for different parameters
export class WaterSimulation extends MpmSimulation {
    constructor() {
        super();
        // Material constants for water
        this.density0 = 1000.0;         // water density
        this.bulk_modulus = 200.0;      // bulk modulus of water (Pa). Resistance to compression
        this.dynamic_viscosity = 0.1;   // water viscosity
        this.gamma = 7.0;               // For nonlinear pressure response
        this.maxJ = 1.3;                // Maximum volume change factor
        this.minJ = 0.7;                // Minimum volume change factor
    }

    getParameters() {
        return super.getParameters().concat([
            new Parameter('density0', 500, 2000, 10, 'Density'),
            new Parameter( 'bulk_modulus', 50, 500, 10, 'Bulk Modulus' ),
            new Parameter( 'dynamic_viscosity', 0.01, 1, 0.01, 'Viscosity' ),
            new Parameter( 'gamma', 1, 10, 0.1, 'Gamma' ),
            new Parameter( 'maxJ', 1, 2, 0.05, 'Max Volume Change' ),
            new Parameter( 'minJ', 0.1, 1, 0.05,  'Min Volume Change' ),
        ]);
    }

    initialize() {
        this.addWaterDrop([0.40,0.75], 0.12, 0x1188FB);
        this.addWaterDrop([0.55,0.45], 0.10, 0x6611EE);
    }

    getMaterialProperties(particle) {
        const J = mat2.determinant(particle.F);

        // Pressure directly proportional to volume change
        const pressure = this.bulk_modulus * (26.0 - Math.pow(J, -this.gamma));

        // For fluids, lambda should provide the pressure response
        // divide by J to get Kirchhoff stress. negative because pressure resists compression
        const lambda = pressure / J;
        const mu = this.dynamic_viscosity;

        return { lambda, mu };
    }

    updateDeformationGradient(particle, F) {
        // For water, mainly track volume changes
        const J = mat2.determinant(F);

        // Tighter bounds on volume change
        if (J < this.minJ || J > this.maxJ) {
            console.log("J out of bounds: ", J);
        }
        const newJ = Math.max(this.minJ, Math.min(J, this.maxJ));
        //const newJ = Math.max(0.96, Math.min(J, 1.04));
        const scale = Math.sqrt(newJ / J);
        particle.F = [F[0] * scale, F[1] * scale, F[2] * scale, F[3] * scale];
        particle.Jp = newJ;
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