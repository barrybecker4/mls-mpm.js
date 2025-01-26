import { runTest, expect } from './test-util.js';
import { SnowSimulation } from '../SnowSimulation.js';
import { Particle } from '../Particle.js';

const simulation = new SnowSimulation();

function testParticleCreation() {
    let passed = 0;
    let total = 0;

    total++;
    passed += runTest('Particle square creation', () => {
        const oldLength = simulation.particles.length;
        simulation.addSnowSquare([0.5, 0.5], 1);
        expect(simulation.particles.length - oldLength).toEqual(1000);

        // Test that particles are within bounds
        const lastParticle = simulation.particles[simulation.particles.length - 1];
        expect(lastParticle.color).toEqual(1);
        expect(lastParticle.Jp).toEqual(1);
        expect(lastParticle.F).toEqual([1, 0, 0, 1]);

        // Check position bounds
        const isInBounds = lastParticle.position.every((coord, i) => {
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
    simulation.particles.length = 0;
    const testParticle = new Particle([0.5, 0.5], 1);
    testparticle.velocity = [1, 0];
    testParticle.F = [1, 0, 0, 1];
    testParticle.C = [0, 0, 0, 0];
    testParticle.Jp = 1;

    simulation.particles.push(testParticle);

    total++;
    passed += runTest('Single particle advance', () => {
        const oldPos = [...testParticle.position];
        simulation.advanceSimulation();
        // Particle should move in x direction due to velocity
        expect(testParticle.position[0] > oldPos[0]).toEqual(true);
        // Should also move down due to gravity
        expect(testParticle.position[1] < oldPos[1]).toEqual(true);
    });

    total++;
    passed += runTest('Boundary conditions', () => {
        // Move particle near bottom boundary
        testParticle.position = [0.5, 0.01];
        testparticle.velocity = [0, -1];
        simulation.advanceSimulation();
        // Velocity should be constrained
        expect(testparticle.velocity[1] >= 0).toEqual(true);
    });

    console.log(`\nGrid Operations: ${passed}/${total} tests passed\n`);
}

function testParticleDeformation() {
    let passed = 0;
    let total = 0;

    simulation.particles.length = 0;
    const testParticle = new Particle([0.5, 0.5], 1);
    testparticle.velocity = [0, 0];
    testParticle.F = [1.1, 0, 0, 0.9];
    testParticle.C = [0, 0, 0, 0];
    testParticle.Jp = 1;

    simulation.particles.push(testParticle);

    total++;
    passed += runTest('Plasticity handling', () => {
        const oldF = [...testParticle.F];
        simulation.advanceSimulation();
        // F should change due to plasticity
        expect(testParticle.F).toNotEqual(oldF);

        // Determinant should be constrained by plasticity
        const det = testParticle.F[0] * testParticle.F[3] - testParticle.F[1] * testParticle.F[2];
        expect(det > 0.6 && det < 20.0).toEqual(true);
    });

    console.log(`\nDeformation Tests: ${passed}/${total} tests passed\n`);
}

// Run all tests
console.log('Starting MLS-MPM Tests...\n');
testParticleCreation();
testGridOperations();
testParticleDeformation();
