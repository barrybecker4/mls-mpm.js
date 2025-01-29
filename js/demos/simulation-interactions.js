export function createSimulationInteractions(canvas, MARGIN, simulation, onDragChange) {
    let isDragging = false;
    let lastDragPos = null;
    let size = canvas.width;

    function addObject(canvasX, canvasY) {
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

    function convertToSimCoords(canvasX, canvasY) {
        return [canvasX / size, 1 - (canvasY / size)];
    }

    function handleClick(event) {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        addObject(x, y);
    }

    function handleDragStart(event) {
        isDragging = true;
        const rect = canvas.getBoundingClientRect();
        lastDragPos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        onDragChange({ isDragging, lastDragPos });
    }

    function handleDragMove(event) {
        if (!isDragging || !lastDragPos) return;

        const rect = canvas.getBoundingClientRect();
        const currentPos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        const dragVector = {
            x: currentPos.x - lastDragPos.x,
            y: currentPos.y - lastDragPos.y
        };

        const simPos = convertToSimCoords(currentPos.x, currentPos.y);
        const simVector = [
            dragVector.x / size,
            -dragVector.y / size // Flip Y because simulation uses bottom-left origin
        ];

        simulation.applyForce(simPos, simVector);

        lastDragPos = currentPos;
        onDragChange({ isDragging, lastDragPos });
    }

    function handleDragEnd() {
        isDragging = false;
        lastDragPos = null;
        onDragChange({ isDragging, lastDragPos });
    }

    canvas.addEventListener('dblclick', handleClick);
    canvas.addEventListener('mousedown', handleDragStart);
    canvas.addEventListener('mousemove', handleDragMove);
    canvas.addEventListener('mouseup', handleDragEnd);
    canvas.addEventListener('mouseleave', handleDragEnd);

    return {
        cleanup: () => {
            canvas.removeEventListener('dblclick', handleClick);
            canvas.removeEventListener('mousedown', handleDragStart);
            canvas.removeEventListener('mousemove', handleDragMove);
            canvas.removeEventListener('mouseup', handleDragEnd);
            canvas.removeEventListener('mouseleave', handleDragEnd);
        }
    };
}
