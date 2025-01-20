import { initWaterDrops } from './water-drops.js';
import { initSnowBlocks } from './snow-blocks.js';
import { initFoldingBall } from './folding-ball.js';

const CANVAS_SIZE = 1000;
const DEMOS = [
    {
        id: 'water-drops',
        canvas: document.getElementById('water-drops-canvas'),
        init: initWaterDrops,
        active: false
    },
    {
        id: 'snow-blocks',
        canvas: document.getElementById('snow-blocks-canvas'),
        init: initSnowBlocks,
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

const tabButtons = document.querySelectorAll('.tab-button')

tabButtons.forEach(button => {
    button.addEventListener('click', () => tabClicked(button));
});

function tabClicked(button) {
    const demoId = button.dataset.demo;
    tabButtons.forEach(btn => btn.classList.toggle('active', btn === button));

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
}