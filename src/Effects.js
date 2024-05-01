import React, { useState, useEffect } from 'react';
import { Bodies } from 'matter-js';


export default function Effects({
    step,
    setStep,
    time,
    setTime,
    deltaAngle,
    setDeltaAngle,
    scale,
    setScale,
    xAngularFreq,
    setXAngularFreq,
    yAngularFreq,
    setYAngularFreq,
    xPhase,
    setXPhase,
    yPhase,
    setYPhase
    }) {


    useEffect(() => {
        const intervalId = setInterval(() => {
            setTime(prevTime => prevTime + 0.1); // Increment time each iteration

            const sinusoidalValue = Math.sin(time); // Sinusoidal modulation
            const adjustedStep = sinusoidalValue * step;

            setScale(prev => {
                let nextValue = prev + adjustedStep;
                if (nextValue <= 5 || nextValue >= 10) {
                    setStep(prevStep => -prevStep); // Reverse when at boundaries
                }
                return nextValue;
            });
        }, 10); // Adjust for smoother animation

        return () => clearInterval(intervalId);
    }, [setStep, setTime, setDeltaAngle, setScale, setXAngularFreq, setYAngularFreq, setXPhase, setYPhase, step, time, deltaAngle, scale, xAngularFreq, yAngularFreq, xPhase, yPhase]);
}



/**
 * 
 *  Function to generate the path at interpolation point @progress
 **/
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

    let path = `M${xCoord} ${yCoord} `;
    let functionX, functionY;

    switch (xFunctionCode) {
        case 0:
            functionX = Math.cos;
            break;
        case 1:
            functionX = Math.sin;
            break;
        case 2:
            functionX = Math.tan;
            break;
        case 3:
            functionX = Math.acos;
            break;
        case 4:
            functionX = Math.asin;
            break;
        case 5:
            functionX = Math.sinh;
            break;
        case 6:
            functionX = Math.cosh;
            break;
        case 7:
            functionX = Math.asinh;
            break;
        case 8:
            functionX = Math.acosh;
            break;
        case 9:
            functionX = Math.exp;
            break;
        case 10:
            functionX = Math.log10;
            break;
        case 11:
            functionX = Math.sqrt;
            break;
        case 12:
            functionX = Math.abs;
            break;
        case 13:
            functionX = Math.cbrt;
            break;
        case 14:
            functionX = linear;
            break;
        case 15:
            functionX = zero;
            break;
        default:
            functionX = Math.cos;
            break;
    }

    switch (yFunctionCode) {
        case 0:
            functionY = Math.cos;
            break;
        case 1:
            functionY = Math.sin;
            break;
        case 2:
            functionY = Math.tan;
            break;
        case 3:
            functionY = Math.acos;
            break;
        case 4:
            functionY = Math.asin;
            break;
        case 5:
            functionY = Math.sinh;
            break;
        case 6:
            functionY = Math.cosh;
            break;
        case 7:
            functionY = Math.asinh;
            break;
        case 8:
            functionY = Math.acosh;
            break;
        case 9:
            functionY = Math.exp;
            break;
        case 10:
            functionY = Math.log10;
            break;
        case 11:
            functionY = Math.sqrt;
            break;
        case 12:
            functionY = Math.abs;
            break;
        case 13:
            functionY = Math.cbrt;
            break;
        case 14:
            functionY = linear;
            break;
        case 15:
            functionY = zero;
            break;
        default:
            functionY = Math.sin;
            break;
    }

    for (let angle = 0.1; angle < progress; angle += deltaAngle) {
        const scaleFactor = (angle / 180) * scale;
        const newX = xCoord + angle * functionX((angle * xAngularFreq) + xPhase) * scaleFactor;
        const newY = yCoord + angle * functionY((angle * yAngularFreq) + yPhase) * scaleFactor;
        path += `L${newX} ${newY} `;
    }

    return path;
}

export function generateMatterVertices(
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

    let vertices = []; // Array to store vertices
    let functionX, functionY;

    functionX = selectFunction(xFunctionCode);
    functionY = selectFunction(yFunctionCode);

    for (let angle = 0.1; angle < progress; angle += deltaAngle) {
        const scaleFactor = (angle / 180) * scale;
        const newX = xCoord + angle * functionX((angle * xAngularFreq) + xPhase) * scaleFactor;
        const newY = yCoord + angle * functionY((angle * yAngularFreq) + yPhase) * scaleFactor;
        // Push the calculated vertex into the vertices array
        vertices.push({ x: newX, y: newY });
    }
    

    return vertices;
}

/**
 * Selects a mathematical function based on a given code.
 * 
 * @param {number} code - The code representing the mathematical function.
 * @returns {Function} - The selected mathematical function.
 */
function selectFunction(code) {
    switch (code) {
        case 0: return Math.cos;
        case 1: return Math.sin;
        case 2: return Math.tan;
        case 3: return Math.acos;
        case 4: return Math.asin;
        case 5: return Math.sinh;
        case 6: return Math.cosh;
        case 7: return Math.exp;
        case 8: return Math.log10;
        case 9: return Math.sqrt;
        case 10: return Math.abs;
        case 11: return Math.cbrt;
        case 12: return linear;
        case 13: return zero;
        default: return Math.sin;
    }
}

function linear(num) {
    return num;
}

function zero(num) {
    return 0;
}
// Function to generate rainbow colors
export function generateRainbowColors(steps) {
    const colors = [];
    for (let i = 0; i < steps; i++) {
        const hue = i / steps * 360; // Calculate hue value
        const color = `hsl(${hue}, 100%, 50%)`; // Convert hue to HSL color
        colors.push(color);
    }
    return colors;
}

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}
export class Effect {

    
    constructor() {
        this.xCoord = window.innerWidth / 2;
        this.yCoord = window.innerHeight / 2;
        this.startValue = 0;
        this.endValue = 500;
        this.step = 10;
        this.lifespan = 99999;
        this.fadeOutDuration = 10000;
        this.xFunctionCode = 0;
        this.yFunctionCode = 1;
        this.deltaAngle = 0.9;
        this.scale = 0.1;
        this.xAngularFreq = 1;
        this.yAngularFreq = 1;
        this.xPhase = 1;
        this.yPhase = 1;
        this.pulseID = 0;
        this.pulseAmplitude = 0.0001;
        this.pulseFrequency = 100000;
        this.pulseLowerBound = 1;
        this.pulseUpperBound = 1.1;

        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("width", window.innerWidth);
        this.svg.setAttribute("height", window.innerHeight);
        this.svg.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);

        this.svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.svgPath.setAttribute("stroke", "blue"); // Example stroke color
        this.svgPath.setAttribute("stroke-width", "2");
        this.svgPath.setAttribute("fill", "none");

        // Append the SVG path to the SVG element
        this.svg.appendChild(this.svgPath);

        // Append the SVG element to a container within the 'background-container' element
        const backgroundContainer = document.getElementById("root");
        //backgroundContainer.innerHTML = ""; // Clear previous content
        backgroundContainer.appendChild(this.svg);
    }

    setXCoord(xCoord) {
        this.xCoord = xCoord;
        return this;
    }

    setYCoord(yCoord) {
        this.yCoord = yCoord;
        return this;
    }

    setStartValue(startValue) {
        this.startValue = startValue;
        return this;
    }

    setEndValue(endValue) {
        this.endValue = endValue;
        return this;
    }

    setStep(step) {
        this.step = step;
        return this;
    }

    setLifespan(lifespan) {
        this.lifespan = lifespan;
        return this;
    }

    setFadeOutDuration(fadeOutDuration) {
        this.fadeOutDuration = fadeOutDuration;
        return this;
    }

    setXFunctionCode(xFunctionCode) {
        this.xFunctionCode = xFunctionCode;
        return this;
    }

    setYFunctionCode(yFunctionCode) {
        this.yFunctionCode = yFunctionCode;
        return this;
    }

    setDeltaAngle(deltaAngle) {
        this.deltaAngle = deltaAngle;
        return this;
    }

    setScale(scale) {
        this.scale = scale;
        return this;
    }

    setXAngularFreq(xAngularFreq) {
        this.xAngularFreq = xAngularFreq;
        return this;
    }

    setYAngularFreq(yAngularFreq) {
        this.yAngularFreq = yAngularFreq;
        return this;
    }

    setXPhase(xPhase) {
        this.xPhase = xPhase;
        return this;
    }

    setYPhase(yPhase) {
        this.yPhase = yPhase;
        return this;
    }

    setPulseID(pulseID) {
        this.pulseID = pulseID;
        return this;
    }

    setPulseAmplitude(pulseAmplitude) {
        this.pulseAmplitude = pulseAmplitude;
        return this;
    }

    setPulseFrequency(pulseFrequency) {
        this.pulseFrequency = pulseFrequency;
        return this;
    }

    setPulseLowerBound(pulseLowerBound) {
        this.pulseLowerBound = pulseLowerBound;
        return this;
    }

    setPulseUpperBound(pulseUpperBound) {
        this.pulseUpperBound = pulseUpperBound;
        return this;
    }

    // Constructor to generate random parameters
    static random() {
        const xCoord = Math.random() * window.innerWidth;
        const yCoord = Math.random() * window.innerHeight;
        const startValue = 0;
        const endValue = 600;
        const step = 10;
        const xFunctionCode = parseInt(Math.random() * 15);
        const yFunctionCode = parseInt(Math.random() * 15);
        const deltaAngle = Math.random() * 2;
        const scale = Math.random() * 10;
        const xAngularFreq = Math.random() * 5;
        const yAngularFreq = Math.random() * 5;
        const xPhase = Math.random() * 10;
        const yPhase = Math.random() * 10;
        return new Effect(xCoord, yCoord, startValue, endValue, step, xFunctionCode, yFunctionCode, deltaAngle, scale, xAngularFreq, yAngularFreq, xPhase, yPhase);
    }

    // Method to start the animation
    play(stopValue = Infinity) {
        let progress = this.startValue; // Initialize progress
        const startTime = Date.now(); // Get the start time
        this.intervalId = setInterval(() => {
            progress += this.step; // Increment progress each iteration
            const elapsedTime = Date.now() - startTime; // Calculate the elapsed time
            const adjustedPulse = this.pulseAmplitude * Math.sin(elapsedTime / this.pulseFrequency); // Adjusted pulse value based on elapsed time
            console.log(this.yCoord);
            switch (this.pulseID) {
                case 0:
                    this.xCoord = this.scaleValueToRange(this.xCoord + adjustedPulse, this.pulseLowerBound, this.pulseUpperBound);
                    break;
                case 1:
                    this.yCoord = this.scaleValueToRange(this.yCoord + adjustedPulse, this.pulseLowerBound, this.pulseUpperBound);
                    break;
                case 2:
                    this.step = this.scaleValueToRange(this.step + adjustedPulse, this.pulseLowerBound, this.pulseUpperBound);
                    break;
                case 3:
                    this.xFunctionCode = this.scaleValueToRange(this.xFunctionCode + adjustedPulse, this.pulseLowerBound, this.pulseUpperBound);
                    break;
                case 4:
                    this.yFunctionCode = this.scaleValueToRange(this.yFunctionCode + adjustedPulse, this.pulseLowerBound, this.pulseUpperBound);
                    break;
                case 5:
                    this.deltaAngle = this.scaleValueToRange(this.deltaAngle + adjustedPulse, this.pulseLowerBound, this.pulseUpperBound);
                    break;
                case 6:
                    this.scale = this.scaleValueToRange(this.scale + adjustedPulse, this.pulseLowerBound, this.pulseUpperBound);
                    break;
                case 7:
                    this.xPhase = this.scaleValueToRange(this.xPhase + adjustedPulse, this.pulseLowerBound, this.pulseUpperBound);
                    break;
                case 8:
                    this.yPhase = this.scaleValueToRange(this.yPhase + adjustedPulse, this.pulseLowerBound, this.pulseUpperBound);
                    break;
                default:
                    this.xCoord += adjustedPulse;
                    this.xCoord = Math.max(this.pulseLowerBound, Math.min(this.pulseUpperBound, this.xCoord)); // Ensure xCoord stays within bounds
                    break;
            }

            // Call a method to update the effect
            this.updateEffect(progress);
            // Check if the progress has reached the stop value
            if (progress >= stopValue || progress >= this.endValue) {
                this.stop(); // Stop the animation
            }
        }, 100); // Adjust for smoother animation
    }
    stop(duration = this.lifespan, fadeOutDuration = this.fadeOutDuration) {
        // Clear the interval associated with the animation loop immediately
        clearInterval(this.intervalId);

        // Hold the effect for the specified duration before starting the fade-out
        setTimeout(() => {
            // Start fading out the effect gradually over the specified fade-out duration
            let opacity = 0.5;
            const fadeOutInterval = setInterval(() => {
                // Reduce the opacity gradually
                opacity -= 0.005;
                this.svg.style.opacity = opacity;

                // If opacity becomes zero or negative, stop the fade-out animation and destroy the effect
                if (opacity <= 0) {
                    clearInterval(fadeOutInterval);
                    // Remove the SVG element from the DOM
                    this.svg.remove();
                }
            }, fadeOutDuration / 200); // Adjust the number of steps for smoother fading
        }, duration);
    }

    // Helper function to scale a value to a specified range
    scaleValueToRange(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

// Method to update the effect
    updateEffect(progress) {
        
        const { xCoord, yCoord, xFunctionCode, yFunctionCode, deltaAngle, scale, xAngularFreq, yAngularFreq, xPhase, yPhase } = this;
        // Implement logic for generating the background effect based on the parameters
        const path = generatePathStep(
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
            yPhase,
        );

        // Update the 'd' attribute of the path with the new path data
        this.svgPath.setAttribute("d", path);
    }


}
export function createCustomBody(x, y, vertices, options) {
    // Shift the vertices to the provided position (x, y)
    const shiftedVertices = vertices.map(vertex => ({
        x: vertex.x + x,
        y: vertex.y + y
    }));

    // Create a body from the shifted vertices
    return Bodies.fromVertices(x, y, [shiftedVertices], options);
}