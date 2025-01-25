const MARGIN = 48;
const BORDER_COLOR = '#DDDDDD';
const BG_COLOR = '#000000';
const RENDER_EVERY = 5;
const ENABLE_TIMING = false;
const PARTICLE_SIZE = 2;
const BORDER_WIDTH = 1;


export function createSimulationRenderer(simulation) {

    return function init(canvas, size) {
        let isRunning = true;

        document.documentElement.style.setProperty('--canvas-size', `${size}px`);
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext('2d', { alpha: false });
        let iter = 0;

        function display() {
            renderFrame();
            renderParticles();
        }

        function renderFrame() {
            context.fillStyle = BG_COLOR;
            context.fillRect(0, 0, size, size);

            context.lineWidth = 1;
            context.strokeStyle = BORDER_COLOR;
            context.strokeRect(MARGIN / 2, MARGIN / 2, size - MARGIN, size - MARGIN);
        }

        function renderParticles() {
            const halfSize = PARTICLE_SIZE / 2;
            for (let p of simulation.particles) {
                context.fillStyle = `#${p.c.toString(16)}`;
                context.fillRect(size * p.x[0] - halfSize, size - size * p.x[1] - halfSize, PARTICLE_SIZE, PARTICLE_SIZE);
            }
        }

        function step() {
            if (!isRunning) return;
            requestAnimationFrame(step);
            iter++;

            const mustRender = iter % RENDER_EVERY === 0;
            const mustTime = mustRender && ENABLE_TIMING;

            mustTime && console.time('advance');
            simulation.advance(iter);
            mustTime && console.timeEnd('advance');

            if (mustRender) {
                mustTime && console.time('display');
                display();
                mustTime && console.timeEnd('display');
            }
        }

        ENABLE_TIMING && console.time('setup');
        simulation.initialize();
        ENABLE_TIMING && console.timeEnd('setup');

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
            },
            simulation,
        };
    };
}