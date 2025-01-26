export class Particle {
    /**
     * @param {[number, number]} position - Initial position in x, y coordinates
     * @param {number} color - Color/material identifier
     */
    constructor(position, color) {
        this.position = position;
        this.velocity = [0, 0];               // velocity
        this.F = [1, 0, 0, 1];         // Deformation gradient tensor
        this.Cauchy = [0, 0, 0, 0];         // Cauchy tensor
        this.Jp = 1;                   // Jacobian determinant (scalar)
        this.color = color;                // color (int)
    }
}