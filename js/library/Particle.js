export class Particle {
    /**
     * @param {[number, number]} x - Initial position
     * @param {number} c - Color/material identifier
     */
    constructor(x, c) {
        this.x = x;                     // position
        this.v = [0, 0];               // velocity
        this.F = [1, 0, 0, 1];         // Deformation tensor
        this.C = [0, 0, 0, 0];         // Cauchy tensor
        this.Jp = 1;                   // Jacobian determinant (scalar)
        this.c = c;                    // color (int)
    }
}