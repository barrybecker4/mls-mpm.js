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
        let isDragging = false;
        let lastDragPos = null;

        document.documentElement.style.setProperty('--canvas-size', `${size}px`);
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext('2d', { alpha: false });

        function display() {
            renderFrame();
            renderParticles();
            if (isDragging && lastDragPos) {
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
            // Optional: visualize the drag force
            context.beginPath();
            context.arc(lastDragPos.x, lastDragPos.y, 10, 0, 2 * Math.PI);
            context.strokeStyle = '#ffffff';
            context.stroke();
        }

        function addObject(canvasX,  canvasY) {
            // Convert canvas coordinates to simulation space (0 to 1)
            const simX = canvasX / size;
            // Flip Y coordinate since simulation uses bottom-left origin
            const simY = 1 - (canvasY / size);

            // Check if click is within simulation bounds
            const margin = MARGIN / size;
            if (simX < margin || simX > (1 - margin) ||
                simY < margin || simY > (1 - margin)) {
                return;
            }

            simulation.addObject([simX, simY], 0.12, 0x33FFa2);
        }

        function handleClick(event) {
            event.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            addObject(x, y);
        }

        function convertToSimCoords(canvasX, canvasY) {
            return [canvasX / size, 1 - (canvasY / size)];
        }

        function handleDragStart(event) {
            isDragging = true;
            const rect = canvas.getBoundingClientRect();
            lastDragPos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }

        function handleDragMove(event) {
            if (!isDragging || !lastDragPos) return;

            const rect = canvas.getBoundingClientRect();
            const currentPos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };

            // Calculate the movement vector
            const dragVector = {
                x: currentPos.x - lastDragPos.x,
                y: currentPos.y - lastDragPos.y
            };

            // Convert current position and vector to simulation space
            const simPos = convertToSimCoords(currentPos.x, currentPos.y);
            const simVector = [
                dragVector.x / size,
                -dragVector.y / size // Flip Y because simulation uses bottom-left origin
            ];

            // Apply force at the current position
            simulation.applyForce(simPos, simVector);

            // Update last position
            lastDragPos = currentPos;
        }

        function handleDragEnd() {
            isDragging = false;
            lastDragPos = null;
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

        canvas.addEventListener('dblclick', handleClick);
        canvas.addEventListener('mousedown', handleDragStart);
        canvas.addEventListener('mousemove', handleDragMove);
        canvas.addEventListener('mouseup', handleDragEnd);
        canvas.addEventListener('mouseleave', handleDragEnd);

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
            cleanup: () => {
                canvas.removeEventListener('click', handleClick);
                canvas.removeEventListener('mousedown', handleDragStart);
                canvas.removeEventListener('mousemove', handleDragMove);
                canvas.removeEventListener('mouseup', handleDragEnd);
                canvas.removeEventListener('mouseleave', handleDragEnd);
            },
            simulation,
        };
    };
}