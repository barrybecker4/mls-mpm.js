// Linear algebra library optimized for 2D and 3D operations.
const EPSILON = 1e-6;

/** 2D Vector operations */
export const vec2 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    scale: (a, t) => [a[0] * t, a[1] * t],
    hadamard: (a, b) => [a[0] * b[0], a[1] * b[1]],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1]
};

/** 3D Vector operations */
export const vec3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    scale: (a, t) => [a[0] * t, a[1] * t, a[2] * t]
};

/** Matrix operations (2x2) */
export const mat2 = {
    identity: () => [1, 0, 0, 1],
    add: (a, b) => [
        a[0] + b[0], a[1] + b[1],
        a[2] + b[2], a[3] + b[3]
    ],
    sub: (a, b) => [
        a[0] - b[0], a[1] - b[1],
        a[2] - b[2], a[3] - b[3]
    ],
    mul: (a, b) => [
        a[0] * b[0] + a[1] * b[2],
        a[0] * b[1] + a[1] * b[3],
        a[2] * b[0] + a[3] * b[2],
        a[2] * b[1] + a[3] * b[3]
    ],
    mulVec: (m, v) => [
        m[0] * v[0] + m[2] * v[1],
        m[1] * v[0] + m[3] * v[1]
    ],
    determinant: (m) => m[0] * m[3] - m[1] * m[2],
    transpose: (m) => [m[0], m[2], m[1], m[3]],
    outer: (a, b) => [
        a[0] * b[0], a[1] * b[0],
        a[0] * b[1], a[1] * b[1]
    ]
};

/** Matrix decomposition operations */
export const decomp = {
    /** Compute polar decomposition M = RS */
    polar: (m) => {
        const x = m[0] + m[3];
        const y = m[2] - m[1];
        const scale = 1.0 / Math.sqrt(x * x + y * y);
        const c = x * scale;
        const s = y * scale;
        const R = [c, s, -s, c];
        const S = mat2.mul(m, R);
        return { R, S };
    },

    /** Compute SVD decomposition M = U∑V^T */
    svd: (m) => {
        let { R: U, S } = decomp.polar(m);
        let c, s, sig, V;

        if (Math.abs(S[1]) < EPSILON) {
            sig = S;
            c = 1;
            s = 0;
        } else {
            const tao = 0.5 * (S[0] - S[3]);
            const w = Math.sqrt(tao * tao + S[1] * S[1]);
            const t = tao > 0 ? S[1] / (tao + w) : S[1] / (tao - w);
            c = 1.0 / Math.sqrt(t * t + 1);
            s = -t * c;
            sig = [
                c * c * S[0] - 2 * c * s * S[1] + s * s * S[3], 0,
                0, s * s * S[0] + 2 * c * s * S[1] + c * c * S[3]
            ];
        }

        if (sig[0] < sig[3]) {
            const tmp = sig[0];
            sig[0] = sig[3];
            sig[3] = tmp;
            V = [-s, -c, c, -s];
        } else {
            V = [c, -s, s, c];
        }
        V = mat2.transpose(V);
        U = mat2.mul(U, V);

        return { U, sig, V };
    }
};

export const utils = {
    /** Clamp a value between min and max */
    clamp: (x, min, max) => Math.min(Math.max(x, min), max),

    /**
     * Create quadratic kernels for MPM
     * @param {Vec2} fx Base position in grid units
     * @returns {[Vec2, Vec2, Vec2]} Array of kernel weights
     */
    createKernel: (fx) => [
        vec2.hadamard([0.5, 0.5], vec2.sub([1.5, 1.5], fx).map(o => o * o)),
        vec2.sub([0.75, 0.75], vec2.sub(fx, [1.0, 1.0]).map(o => o * o)),
        vec2.hadamard([0.5, 0.5], vec2.sub(fx, [0.5, 0.5]).map(o => o * o))
    ]
};
