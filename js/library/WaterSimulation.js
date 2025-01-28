import { vec2, mat2 } from './algebra.js';
import { MpmSimulation } from './MpmSimulation.js';
import { Particle } from './particle.js';
import { UiParameter } from './UiParameter.js';


// try adding sliders for different parameters
export class WaterSimulation extends MpmSimulation {
    constructor() {
        super();
        // Material constants for water
        this.density0 = 1000.0;         // water density
        this.bulk_modulus = 200.0;      // bulk modulus of water (Pa). Resistance to compression
        this.dynamic_viscosity = 0.1;   // water viscosity
        this.gamma = 7.0;               // For nonlinear pressure response
        this.maxJ = 1.1;                // Maximum volume change factor
        this.minJ = 0.9;                // Minimum volume change factor
        this.maxNewJ = 1.05;                // Maximum volume change factor
        this.minNewJ = 0.95;                // Minimum volume change factor
    }

    getUiParameters() {
        return super.getUiParameters().concat([
            new UiParameter('density0', 500, 2000, 10, 'Density'),
            new UiParameter( 'bulk_modulus', 50, 4000, 10, 'Bulk Modulus' ),
            new UiParameter( 'dynamic_viscosity', 0.01, 1, 0.01, 'Viscosity' ),
            new UiParameter( 'gamma', 1, 10, 0.1, 'Gamma' ),
            new UiParameter( 'maxJ', 1, 1.9, 0.05, 'Max Volume Change' ),
            new UiParameter( 'minJ', 0.2, 1, 0.05,  'Min Volume Change' ),
        ]);
    }

    initialize() {
        this.addWaterDrop([0.40,0.75], 0.12, 0x51B8FF);
        this.addWaterDrop([0.55,0.45], 0.10, 0xA681FE);
    }

    getMaterialProperties(particle) {
        let J = mat2.determinant(particle.F);
        if (isNaN(J)) {
            throw new Error(`J should never NaN. J=${J} particle.F=${particle.F}`);
        }
        if (J < this.minJ || J > this.maxJ) {
            console.log(`Problem with the determinant J=${J} particle.F=${particle.F}. Constraining it`);
            J = Math.max(this.minJ, Math.min(J, this.maxJ));
        }

        // Pressure directly proportional to volume change
        const pressure = this.bulk_modulus * (26.0 - Math.pow(J, -this.gamma));
        if (isNaN(pressure)) throw new Error(`pressure=${pressure} J=${J} particle.F=${particle.F} pow=${Math.pow(J, -this.gamma)}`);

        // For fluids, lambda should provide the pressure response
        // divide by J to get Kirchhoff stress. negative because pressure resists compression
        const lambda = pressure / J;
        if (!Number.isFinite(lambda)) {
            throw new Error(`lambda: ${lambda} pressure: pressure=${pressure} J=${J}`);
        }
        const mu = this.dynamic_viscosity;

        return { lambda, mu };
    }

    updateDeformationGradient(particle, F) {
        // For water, mainly track volume changes
        let J = mat2.determinant(F);
        if (isNaN(J)) {
            throw new (`J should never NaN. J=${J} F=${F} particle.F=${particle.F}`);
        }

        // Tighter bounds on volume change
        if (J < this.minJ || J > this.maxJ) {
            console.log("J out of bounds: ", J);
            //particle.stability = J > this.maxJ ? J - this.maxJ : this.minJ - J;
            particle.stability = J > this.maxJ ? J - this.maxJ : this.minJ - J;
            J = Math.max(this.minJ, Math.min(J, this.maxJ));
        } else {
            particle.stability = 0;
        }
        const newJ = Math.max(this.minNewJ, Math.min(J, this.maxNewJ));
        //const newJ = Math.max(0.96, Math.min(J, 1.04));
        if (isNaN(newJ) || isNaN(J) || J === 0) throw new Error(`newJ=${newJ} J=${J} particle.F=${particle.F}`);
        const scale = Math.sqrt(newJ / J);
        if (isNaN(scale) || scale < 0) throw new Error(`scale=${scale} newJ=${newJ} J=${J}`);
        //if (F[0] < 0 || F[1] < 0 || F[2] < 0 || F[3] < 0) throw new Error(`F should never be negative. F=${F}`);
        //particle.F = [Math.max(0.001, F[0]) * scale, Math.max(0.001, F[1]) * scale, Math.max(0.001, F[2]) * scale, Math.max(0.001, F[3]) * scale];
        particle.F = [F[0] * scale, F[1] * scale, F[2] * scale, F[3] * scale];
        particle.Jp = newJ;
    }

    addWaterDrop(center, radius, color) {
        const num_particles = 1000;
        for (let i = 0; i < num_particles; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const r = Math.sqrt(Math.random()) * radius;
            const offset = [r * Math.cos(theta), r * Math.sin(theta)];
            const position = vec2.add(center, offset);
            this.particles.push(new Particle(position, color));
        }
    }
}