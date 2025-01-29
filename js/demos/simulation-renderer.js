const RENDER_EVERY = 10;
const ENABLE_TIMING = false;
const MARGIN = 48;
const BORDER_COLOR = '#DDDDDD';
const BG_COLOR = '#000000';
const PARTICLE_SIZE = 4;
const BORDER_WIDTH = 1;

import { createSimulationInteractions } from './simulation-interactions.js';

export function createSimulationRenderer(simulation) {

    return function init(canvas, size) {
        let isRunning = true;
        let dragState = { isDragging: false, lastDragPos: null };

        document.documentElement.style.setProperty('--canvas-size', `${size}px`);
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext('2d', { alpha: false });

        function display() {
            renderFrame();
            renderParticles();
            if (dragState.isDragging && dragState.lastDragPos) {
                renderDragIndicator();
            }
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

        function renderDragIndicator() {
            context.beginPath();
            const pos = dragState.lastDragPos;
            context.arc(pos.x, pos.y, 10, 0, 2 * Math.PI);
            context.strokeStyle = '#ffffff';
            context.stroke();
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

        const interactions = createSimulationInteractions(canvas, MARGIN, simulation, (newDragState) => {
            dragState = newDragState;
        });

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
            cleanup: () => {
                interactions.cleanup();
            },
            simulation,
        };
    };
}