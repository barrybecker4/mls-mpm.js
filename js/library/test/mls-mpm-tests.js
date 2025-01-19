import { runTest, expect, expectArray } from './test-util.js';
import {
    particles,
    add_rnd_square,
    advance,
    dt,
    createKernal
} from '../mls-mpm.js';


function testParticleCreation() {
    let passed = 0;
    let total = 0;

    total++;
    passed += runTest('Particle square creation', () => {
        const oldLength = particles.length;
        add_rnd_square([0.5, 0.5], 1);
        expect(particles.length - oldLength).toEqual(1000);

        // Test that particles are within bounds
        const lastParticle = particles[particles.length - 1];
        expect(lastParticle.c).toEqual(1);
        expect(lastParticle.Jp).toEqual(1);
        expect(lastParticle.F).toEqual([1, 0, 0, 1]);

        // Check position bounds
        const isInBounds = lastParticle.x.every((coord, i) => {
            const center = 0.5;
            return Math.abs(coord - center) <= 0.08 + 1e-12;  // Add small epsilon for floating point
        });
        expect(isInBounds).toEqual(true);
    });

    console.log(`\nParticle Creation: ${passed}/${total} tests passed\n`);
}

function testGridOperations() {
    let passed = 0;
    let total = 0;

    // Clear particles and add a single test particle
    particles.length = 0;
    const testParticle = {
        x: [0.5, 0.5],
        v: [1, 0],
        F: [1, 0, 0, 1],
        C: [0, 0, 0, 0],
        Jp: 1,
        c: 1
    };
    particles.push(testParticle);

    total++;
    passed += runTest('Single particle advance', () => {
        const oldPos = [...testParticle.x];
        advance(dt);
        // Particle should move in x direction due to velocity
        expect(testParticle.x[0] > oldPos[0]).toEqual(true);
        // Should also move down due to gravity
        expect(testParticle.x[1] < oldPos[1]).toEqual(true);
    });

    total++;
    passed += runTest('Boundary conditions', () => {
        // Move particle near bottom boundary
        testParticle.x = [0.5, 0.01];
        testParticle.v = [0, -1];
        advance(dt);
        // Velocity should be constrained
        expect(testParticle.v[1] >= 0).toEqual(true);
    });

    console.log(`\nGrid Operations: ${passed}/${total} tests passed\n`);
}

function testParticleDeformation() {
    let passed = 0;
    let total = 0;

    particles.length = 0;
    const testParticle = {
        x: [0.5, 0.5],
        v: [0, 0],
        F: [1.1, 0, 0, 0.9],  // Slightly deformed
        C: [0, 0, 0, 0],
        Jp: 1,
        c: 1
    };
    particles.push(testParticle);

    total++;
    passed += runTest('Plasticity handling', () => {
        const oldF = [...testParticle.F];
        advance(dt);
        // F should change due to plasticity
        expect(testParticle.F).toNotEqual(oldF);

        // Determinant should be constrained by plasticity
        const det = testParticle.F[0] * testParticle.F[3] - testParticle.F[1] * testParticle.F[2];
        expect(det > 0.6 && det < 20.0).toEqual(true);
    });

    console.log(`\nDeformation Tests: ${passed}/${total} tests passed\n`);
}

function testKernelFunctions() {
    let passed = 0;
    let total = 0;

    total++;
    passed += runTest('Kernel weights sum', () => {
        const fx = [0.5, 0.5];
        const weights = createKernal(fx);

        // Sum of weights in each dimension should be close to 1
        let sumX = 0, sumY = 0;
        for (let i = 0; i < 3; i++) {
            sumX += weights[i][0];
            sumY += weights[i][1];
        }
        expectArray([sumX, sumY]).toBeCloseTo2D([1, 1], 5);
    });

    console.log(`\nKernel Functions: ${passed}/${total} tests passed\n`);
}

// Run all tests
console.log('Starting MLS-MPM Tests...\n');
testParticleCreation();
testGridOperations();
testParticleDeformation();
testKernelFunctions();