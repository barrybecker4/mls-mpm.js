import { initFallingBlocks } from './falling-blocks.js';
import { initFoldingBall } from './folding-ball.js';

const CANVAS_SIZE = 900;
const DEMOS = [
    {
        id: 'falling-blocks',
        canvas: document.getElementById('falling-blocks-canvas'),
        init: initFallingBlocks,
        active: false
    },
    {
        id: 'folding-ball',
        canvas: document.getElementById('folding-ball-canvas'),
        init: initFoldingBall,
        active: false
    }
];

// Initialize the first demo
const firstDemo = DEMOS[0];
firstDemo.instance = firstDemo.init(DEMOS[0].canvas, CANVAS_SIZE);
firstDemo.active = true;

// Handle tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const demoId = button.dataset.demo;

        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn === button);
        });

        DEMOS.forEach(demo => {
            const isActive = demoId === demo.id;
            demo.canvas.classList.toggle('active', isActive);

            if (isActive) {
                if (!demo.instance) {
                    // Initialize if first time
                    demo.instance = demo.init(demo.canvas, CANVAS_SIZE);
                } else {
                    // Resume if already initialized
                    demo.instance.resume();
                }
            } else if (demo.instance) {
                demo.instance.pause();
            }
            demo.active = isActive;
        });
    });
});