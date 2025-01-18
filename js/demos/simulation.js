
export function createSimulation(initializeSimulation, advanceSimulation, particles) {

    return function init(canvas, size) {
        let isRunning = true;
        const MARGIN = 48;
        const renderEvery = 5;
        const enableTiming = false;

        document.documentElement.style.setProperty('--canvas-size', `${size}px`);
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext('2d', { alpha: false });
        let iter = 0;

        function display() {
            context.fillStyle = '#000000';
            context.fillRect(0, 0, size, size);

            context.lineWidth = 1;
            context.strokeStyle = '#DDDDDD';
            context.strokeRect(24, 24, size - MARGIN, size - MARGIN);

            for (let p of particles) {
                context.fillStyle = `#${p.c.toString(16)}`;
                context.fillRect(size * p.x[0] - 1, size - size * p.x[1] - 1, 2, 2);
            }
        }

        function step() {
            if (!isRunning) return;
            requestAnimationFrame(step);
            iter++;

            const mustRender = iter % renderEvery === 0;
            const mustTime = mustRender && enableTiming;

            mustTime && console.time('advance');
            advanceSimulation(iter);
            mustTime && console.timeEnd('advance');

            if (mustRender) {
                mustTime && console.time('display');
                display();
                mustTime && console.timeEnd('display');
            }
        }

        enableTiming && console.time('setup');
        initializeSimulation();
        enableTiming && console.timeEnd('setup');

        step();

        return {
            pause: () => {
                isRunning = false;
            },
            resume: () => {
                if (!isRunning) {
                    isRunning = true;
                    step();
                }
            }
        };
    };
}