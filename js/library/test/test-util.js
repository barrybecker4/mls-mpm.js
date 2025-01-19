export function runTest(name, testFn) {
    try {
        testFn();
        console.log(`✅ ${name} passed\n`);
        return true;
    } catch (error) {
        console.error(`❌ ${name} failed:\n`, error.message);
        return false;
    }
}

// Simple test framework
export function expect(actual) {
    return {
        toEqual: (expected) => {
            const result = JSON.stringify(actual) === JSON.stringify(expected);
            if (!result) {
                throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
            }
            return result;
        },
        toNotEqual: (expected) => {
            const result = JSON.stringify(actual) !== JSON.stringify(expected);
            if (!result) {
                throw new Error(`${JSON.stringify(expected)} was unexpected equal to ${JSON.stringify(actual)}`);
            }
            return result;
        },
        toBeCloseTo: (expected, precision = 5) => {
            const result = Math.abs(actual - expected) < Math.pow(10, -precision);
            if (!result) {
                throw new Error(`Expected ${expected} to be close to ${actual}`);
            }
            return result;
        }
    };
}

export function expectArray(actual) {
    return {
        ...expect(actual),
        toBeCloseTo2D: (expected, precision = 5) => {
            if (actual.length !== expected.length) {
                throw new Error(`Arrays have different lengths: ${actual.length} vs ${expected.length}`);
            }
            for (let i = 0; i < actual.length; i++) {
                if (Math.abs(actual[i] - expected[i]) >= Math.pow(10, -precision)) {
                    throw new Error(`Array differs at index ${i}: ${actual[i]} vs ${expected[i]}`);
                }
            }
            return true;
        }
    };
}