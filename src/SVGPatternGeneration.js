

/**
 * Generates path data for drawing a spirograph-like shape.
 * This function calculates the path based on parameters that define the shape's geometry and style.
 * 
 * @param {number} progress - The progress or extent of the path to generate.
 * @param {number} xCoord - The starting x-coordinate for the path.
 * @param {number} yCoord - The starting y-coordinate for the path.
 * @param {number} xFunctionCode - A code indicating the mathematical function to use for x-coordinate calculations.
 * @param {number} yFunctionCode - A code indicating the mathematical function to use for y-coordinate calculations.
 * @param {number} deltaAngle - The increment angle for each step in the path.
 * @param {number} scale - The scaling factor for the path size.
 * @param {number} xAngularFreq - Angular frequency for the x-coordinate calculations.
 * @param {number} yAngularFreq - Angular frequency for the y-coordinate calculations.
 * @param {number} xPhase - Phase shift for the x-coordinate calculations.
 * @param {number} yPhase - Phase shift for the y-coordinate calculations.
 * @returns {string} - A string representing the SVG path data.
 */
export function generatePathStep(
    progress,
    xCoord,
    yCoord,
    xFunctionCode,
    yFunctionCode,
    deltaAngle,
    scale,
    xAngularFreq,
    yAngularFreq,
    xPhase,
    yPhase
) {
    let vertices = [];
    const functionX = selectFunction(xFunctionCode);
    const functionY = selectFunction(yFunctionCode);

    for (let angle = 0.1; angle < progress; angle += deltaAngle) {
        const scaleFactor = (angle / 180) * scale;
        const x = xCoord + angle * functionX((angle * xAngularFreq) + xPhase) * scaleFactor;
        const y = yCoord + angle * functionY((angle * yAngularFreq) + yPhase) * scaleFactor;
        vertices.push({ x, y });
    }

    return vertices;
}

export const createSvgPath = (progress, centerX, centerY, xFunction, yFunction, deltaAngle, scale, xAngularFreq, yAngularFreq, xPhase, yPhase) => {
    const vertices = generatePathStep(progress, centerX, centerY, xFunction, yFunction, deltaAngle, scale, xAngularFreq, yAngularFreq, xPhase, yPhase);
    const pathData = vertices.map((vertex, index) => `${index === 0 ? 'M' : 'L'}${vertex.x},${vertex.y}`).join(' ') + ' Z';
    return pathData;
};

export const createMatterBody = (progress, centerX, centerY, xFunction, yFunction, deltaAngle, scale, xAngularFreq, yAngularFreq, xPhase, yPhase, options) => {
    const { Bodies } = require('matter-js'); // Use require here for simplicity; adjust as necessary for your project setup
    const vertices = generatePathStep(progress, centerX, centerY, xFunction, yFunction, deltaAngle, scale, xAngularFreq, yAngularFreq, xPhase, yPhase);
    return Bodies.fromVertices(centerX, centerY, [vertices], options, true);
};

function selectFunction(code) {
    switch (code) {
        case 0: return Math.cos;
        case 1: return Math.sin;
        case 2: return Math.tan;
        case 3: return Math.acos;
        case 4: return Math.asin;
        case 5: return Math.sinh;
        case 6: return Math.cosh;
        // Add more cases for other functions as needed
        default: return Math.sin; // Default to sine if an unrecognized code is provided
    }
}
