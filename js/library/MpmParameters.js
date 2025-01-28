
export class MpmParameters {

    constructor() {
        this.particle_mass = 1.0;
        this.vol = 1.0;
        this.gravity = -200;
        this.n = 90;                  // grid resolution
        this.dt = 1e-4;               // time step
        this.dx = 1.0 / this.n;       // cell width
        this.inv_dx = 1.0 / this.dx;  // inverse cell width
        this.boundary = 0.05;
    }
}
