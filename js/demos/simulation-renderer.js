const MARGIN = 48;
const BORDER_COLOR = '#DDDDDD';
const BG_COLOR = '#000000';
const RENDER_EVERY = 10;
const ENABLE_TIMING = false;
const PARTICLE_SIZE = 4;
const BORDER_WIDTH = 1;


export function createSimulationRenderer(simulation) {

    return function init(canvas, size) {
        let isRunning = true;

        document.documentElement.style.setProperty('--canvas-size', `${size}px`);
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext('2d', { alpha: false });

        function display() {
            renderFrame();
            renderParticles();
        }

        function renderFrame() {
            context.fillStyle = BG_COLOR;
            context.fillRect(0, 0, size, size);

            context.lineWidth = BORDER_WIDTH;
            context.strokeStyle = BORDER_COLOR;
            context.strokeRect(MARGIN / 2, MARGIN / 2, size - MARGIN, size - MARGIN);
        }

        function renderParticles() {
            const halfSize = PARTICLE_SIZE / 2;
            for (let particle of simulation.particles) {
                context.fillStyle = particle.stability > 0 ? `#ff0000` : `#${particle.color.toString(16)}`;
                const x = size * particle.position[0] - halfSize;
                const y = size - size * particle.position[1] - halfSize;
                context.fillRect(x, y, PARTICLE_SIZE, PARTICLE_SIZE);
            }
        }

        function step() {
            if (!isRunning) return;
            requestAnimationFrame(step);

            const mustRender = simulation.iter % RENDER_EVERY === 0;
            const mustTime = mustRender && ENABLE_TIMING && !simulation.isPaused

            mustTime && console.time('advance');
            simulation.advance();
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