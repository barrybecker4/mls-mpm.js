import { Parameter } from '../library/Parameter.js';

const parameters = [
    new Parameter('density0', 500, 2000, 10, 'Density'),
    new Parameter( 'bulk_modulus', 50, 500, 10, 'Bulk Modulus' ),
    new Parameter( 'dynamic_viscosity', 0.01, 1, 0.01, 'Viscosity' ),
    new Parameter( 'gamma', 1, 10, 0.1, 'Gamma' ),
    new Parameter( 'maxJ', 1, 2, 0.05, 'Max Volume Change' ),
    new Parameter( 'minJ', 0.1, 1, 0.05,  'Min Volume Change' ),
];


export function createParameterControls(simulation, containerId) {
    const container = document.getElementById(containerId);
    const content = document.getElementById('controls-content');

    addCollapseButton(container);
    addParameterSliders(container, content, simulation);
    addRestartButton(container, content, simulation);
}

function addCollapseButton(container) {
    const collapseButton = document.getElementById('collapse-toggle');

    collapseButton.addEventListener('click', () => {
        container.classList.toggle('controls-collapsed');
        collapseButton.textContent = container.classList.contains('controls-collapsed') ? '≡' : '×';
    });
}

function addParameterSliders(container, content, simulation) {
    content.innerHTML = parameters.map(param => `
        <div class="parameter-control">
            <label>${param.label}: <span id="${param.name}-value"></span></label>
            <input type="range"
                   id="${param.name}-slider"
                   min="${param.min}"
                   max="${param.max}"
                   step="${param.step}"
                   value="${simulation[param.name]}">
        </div>
    `).join('');

    parameters.forEach(param => {
        const slider = document.getElementById(`${param.name}-slider`);
        const valueDisplay = document.getElementById(`${param.name}-value`);
        valueDisplay.textContent = simulation[param.name];

        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            simulation[param.name] = value;
            valueDisplay.textContent = value;
        });
    });
}

function addRestartButton(container, content, simulation) {
    // Add restart button at the top
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart';
    restartButton.className = 'restart-button';
    restartButton.addEventListener('click', () => {
        simulation.reset();
    });

    content.insertBefore(restartButton, content.firstChild);
}