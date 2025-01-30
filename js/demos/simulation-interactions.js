const EFFECT_RADIUS = 0.07;
const FAUCET_VELOCITY = 10.0;

export function createSimulationInteractions(canvas, MARGIN, simulation, onDragChange) {
    let isDragging = false;
    let lastDragPos = null;
    let size = canvas.width;
    let faucetPos = [ 0.5, 0.5 ];
    let faucetRunning = false;


    function addObject(coords) {
        const [simX, simY] = this.convertToSimCoords(coords);

        // Check if click is within simulation bounds
        const margin = MARGIN / size;
        if (simX < margin || simX > (1 - margin) ||
            simY < margin || simY > (1 - margin)) {
            return;
        }

        simulation.addObject([simX, simY], 0.12, 0x33FFa2);
    }

    function convertToSimCoords(canvasCoords) {
        return [canvasCoords[0] / size, 1 - (canvasCoords[1] / size)];
    }

    function handleDblClick(event) {
        event.preventDefault();
        addObject(getCoords(event));
    }

    function getCoords(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return [ x, y ];
    }

    function handleDragStart(event) {
        isDragging = true;

        lastDragPos = getCoords(event);
        faucetPos = convertToSimCoords(lastDragPos);
        onDragChange({ isDragging, lastDragPos });
    }

    function handleDragMove(event) {
        if (!isDragging || !lastDragPos) return;

        const currentPos = getCoords(event);

        const dragVector = {
            x: currentPos[0] - lastDragPos[0],
            y: currentPos[1] - lastDragPos[1]
        };

        const simPos = convertToSimCoords(currentPos);
        const simVector = [
            dragVector.x / size,
            -dragVector.y / size // Flip Y because simulation uses bottom-left origin
        ];

        simulation.applyForce(simPos, simVector, EFFECT_RADIUS);

        lastDragPos = currentPos;
        onDragChange({ isDragging, lastDragPos });
    }

    function handleDragEnd() {
        isDragging = false;
        lastDragPos = null;
        onDragChange({ isDragging, lastDragPos });
    }

    function handleKeyDown(event) {
        if (event.key === 'f' || event.key === 'F') {
            faucetRunning = !faucetRunning;
            if (faucetRunning) simulation.startFaucet(faucetPos, [FAUCET_VELOCITY, 0], EFFECT_RADIUS / 2);
            else simulation.stopFaucet();
        }
    }

    canvas.addEventListener('dblclick', handleDblClick);
    canvas.addEventListener('mousedown', handleDragStart);
    canvas.addEventListener('mousemove', handleDragMove);
    canvas.addEventListener('mouseup', handleDragEnd);
    canvas.addEventListener('mouseleave', handleDragEnd);
    canvas.setAttribute('tabindex', '0');
    canvas.addEventListener('keydown', handleKeyDown);
    canvas.focus();

    return {
        cleanup: () => {
            canvas.removeEventListener('dblclick', handleDblClick);
            canvas.removeEventListener('mousedown', handleDragStart);
            canvas.removeEventListener('mousemove', handleDragMove);
            canvas.removeEventListener('mouseup', handleDragEnd);
            canvas.removeEventListener('mouseleave', handleDragEnd);
            canvas.removeEventListener('keydown', handleKeyDown)
        }
    };
}
