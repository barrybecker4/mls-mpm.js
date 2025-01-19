import { runTest, expect, expectArray } from './test-util.js';
import { vec2, mat2, decomp, utils } from '../algebra.js';


// Basic Matrix Operations Tests
function testBasicOperations() {
    let passed = 0;
    let total = 0;

    total++;
    passed += runTest('Vector addition', () => {
        const v1 = [1, 2];
        const v2 = [3, 4];
        expect(vec2.add(v1, v2)).toEqual([4, 6]);
    });

    total++;
    passed += runTest('Vector subtraction', () => {
        const v1 = [3, 4];
        const v2 = [1, 2];
        expect(vec2.sub(v1, v2)).toEqual([2, 2]);
    });

    total++;
    passed += runTest('Scalar multiplication', () => {
        const v = [1, 2];
        expect(vec2.scale(v, 3)).toEqual([3, 6]);
    });

    total++;
    passed += runTest('Hadamard product', () => {
        const v1 = [2, 3];
        const v2 = [4, 5];
        expect(vec2.hadamard(v1, v2)).toEqual([8, 15]);
    });

    console.log(`\nBasic Operations: ${passed}/${total} tests passed\n`);
}

// Matrix Operations Tests
function testMatrixOperations() {
    let passed = 0;
    let total = 0;

    total++;
    passed += runTest('Matrix addition', () => {
        const m1 = [1, 2, 3, 4];
        const m2 = [5, 6, 7, 8];
        expect(mat2.add(m1, m2)).toEqual([6, 8, 10, 12]);
    });

    total++;
    passed += runTest('Matrix transposition', () => {
        const m = [1, 2, 3, 4];  // [[1, 2], [3, 4]]
        expect(mat2.transpose(m)).toEqual([1, 3, 2, 4]); // [[1, 3], [2, 4]]
    });

    total++;
    passed += runTest('Matrix determinant', () => {
        const m = [1, 2, 3, 4];
        expect(mat2.determinant(m)).toEqual(-2); // 1*4 - 2*3
    });

    total++;
    passed += runTest('Matrix-vector multiplication', () => {
        const m = [1, 2, 3, 4];
        const v = [5, 6];
        expect(mat2.mulVec(m, v)).toEqual([23, 34]);
    });

    console.log(`\nMatrix Operations: ${passed}/${total} tests passed\n`);
}

// Advanced Matrix Operations Tests
function testAdvancedOperations() {
    let passed = 0;
    let total = 0;

    total++;
    passed += runTest('Polar decomposition of identity', () => {
        const I = [1, 0, 0, 1];
        const { R, S } = decomp.polar(I);
        expect(R).toEqual([1, 0, 0, 1]);
        expect(S).toEqual([1, 0, 0, 1]);
    });

    total++;
    passed += runTest('SVD of identity', () => {
        const I = [1, 0, 0, 1];
        const { U, sig, V } = decomp.svd(I);
        expect(U).toEqual([1, 0, 0, 1]);
        expect(sig).toEqual([1, 0, 0, 1]);
        expect(V).toEqual([1, 0, 0, 1]);
    });

    console.log(`\nAdvanced Operations: ${passed}/${total} tests passed\n`);
}

function testMatrixConvention() {
    let passed = 0;
    let total = 0;

    total++; passed += runTest('Matrix multiplication order', () => {
        const A = [1,2, 3,4];  // stored as [a11, a12, a21, a22]
        const B = [5,6, 7,8];
        const C = mat2.mul(A, B);
        expect(C).toEqual([19,22, 43,50]);
    });

    total++; passed += runTest('Matrix vector multiplication', () => {
        const A = [1, 2,  3, 4];
        const v = [5, 6];
        const w = mat2.mulVec(A, v);
        expect(w).toEqual([23, 34]);
    });

    total++; passed += runTest('Deformation gradient convention', () => {
        // Create a pure rotation matrix (90 degrees)
        const F = [0,-1, 1,0];
        const {R, S} = decomp.polar(F);
        // R should be the rotation, S should be identity
        expect(R).toEqual([0, 1,  -1, 0]);
        expectArray(S).toBeCloseTo2D([1, 0,  0, 1], 5);
    });

    console.log(`\nMatrix Convention Tests: ${passed}/${total} tests passed\n`);
}

function testKernelFunctions() {
    let passed = 0;
    let total = 0;

    total++;
    passed += runTest('Kernel weights sum', () => {
        const fx = [0.5, 0.5];
        const weights = utils.createKernel(fx);

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
console.log('Starting Matrix Operation Tests...\n');
testBasicOperations();
testMatrixOperations();
testAdvancedOperations();
testMatrixConvention();
testKernelFunctions();
