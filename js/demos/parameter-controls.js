export function createParameterControls(simulation, containerId) {
    const container = document.getElementById(containerId);
    const content = document.getElementById('controls-content');
    const collapseButton = document.getElementById('collapse-toggle');

    collapseButton.addEventListener('click', () => {
        container.classList.toggle('controls-collapsed');
        collapseButton.textContent = container.classList.contains('controls-collapsed') ? '≡' : '^';
    });
    const parameters = [
        { name: 'density0', min: 500, max: 2000, step: 10, label: 'Density' },
        { name: 'bulk_modulus', min: 50, max: 500, step: 10, label: 'Bulk Modulus' },
        { name: 'dynamic_viscosity', min: 0.01, max: 1, step: 0.01, label: 'Viscosity' },
        { name: 'gamma', min: 1, max: 10, step: 0.1, label: 'Gamma' },
        { name: 'maxJ', min: 1, max: 2, step: 0.05, label: 'Max Volume Change' },
        { name: 'minJ', min: 0.1, max: 1, step: 0.05, label: 'Min Volume Change' }
    ];

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