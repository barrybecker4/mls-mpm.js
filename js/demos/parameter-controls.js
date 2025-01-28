
export function createParameterControls(containerId) {

    function updateControls(simulation) {
       const container = document.getElementById(containerId);
       const content = document.getElementById('controls-content');

       addCollapseButton(container);
       addParameterSliders(container, content, simulation);
       addRestartButton(container, content, simulation);
       addPauseButton(content, simulation);
    }

    return {
        updateControls
    };
}

function addCollapseButton(container) {
    const collapseButton = document.getElementById('collapse-toggle');

    collapseButton.addEventListener('click', () => {
        container.classList.toggle('controls-collapsed');
        collapseButton.textContent = container.classList.contains('controls-collapsed') ? '≡' : '×';
    });
}

function addParameterSliders(container, content, simulation) {
    const parameters = simulation.getUiParameters();
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
        valueDisplay.textContent = simulation.params[param.name];

        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            simulation.params[param.name] = value;
            valueDisplay.textContent = value;
        });
    });
}

function addPauseButton(content, simulation) {
    const pauseButton = document.createElement('button');
    pauseButton.textContent = simulation.isPaused ? 'Resume' : 'Pause';
    pauseButton.className = 'control-button';
    if (simulation.isPaused) {
        pauseButton.classList.toggle('controls-paused');
    }
    pauseButton.addEventListener('click', () => {
        if (pauseButton.classList.contains('controls-paused')) {
            simulation.resume();
            pauseButton.textContent =  'Pause';
        } else {
            simulation.pause();
            pauseButton.textContent = 'Resume';
        }
        pauseButton.classList.toggle('controls-paused');
    });

    content.insertBefore(pauseButton, content.firstChild);
}

function addRestartButton(container, content, simulation) {
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart';
    restartButton.className = 'control-button';
    restartButton.addEventListener('click', () => {
        simulation.restart();
    });

    content.insertBefore(restartButton, content.firstChild);
}