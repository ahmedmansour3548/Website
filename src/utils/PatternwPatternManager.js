import * as THREE from 'three';
import { gsap } from 'gsap';

class Pattern {
    constructor(camera, renderer, transparent = false, opacity = 1, className = '', initalColor = 0xffffff, isFadeIn = false, fadeInDuration = 1000, isFadeOut = false, fadeOutDuration = 1000) {
        this.maxVertices = 5000;
        this.positionsArray = new Float32Array(this.maxVertices * 3);
        this.clickMeshes = [];
        this.INTERSECTED = null;
        this.raycaster = new THREE.Raycaster();
        this.scene = new THREE.Scene();
        this.renderer = renderer; // Use the passed renderer
        this.material = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: transparent, opacity: 0 }); // Start with 0 opacity
        this.geometry = new THREE.BufferGeometry();
        this.camera = camera;
        this.mouse = new THREE.Vector2();
        this.CAMERA_X_OFFSET = 0;
        this.CAMERA_Y_OFFSET = 0;
        this.CAMERA_Z_OFFSET = 500;
        this.clickMeshes = [];
        this.className = className;
        this.initalColor = initalColor;
        this.isFadeIn = isFadeIn;
        this.fadeInDuration = fadeInDuration;
        this.isFadeOut = isFadeOut;
        this.fadeOutDuration = fadeOutDuration;

        this.init();
    }

    init() {
        this.material = new THREE.LineBasicMaterial({ color: this.initalColor, side: THREE.DoubleSide, transparent: true, opacity: 0 }); // Start with 0 opacity
        this.geometry = new THREE.BufferGeometry();
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '0'; // Ensure it appears in the background
        if (this.className) {
            this.renderer.domElement.classList.add(this.className);
        }
        this.scene.add(new THREE.Line(this.geometry, this.material));

        this.animate();
    }

    regenerate(params) {
        let newParams = { ...params };
        let index = 0;
        const positions = this.positionsArray;
        const functionX = this.selectFunction(newParams.xFunctionCode);
        const functionY = this.selectFunction(newParams.yFunctionCode);

        // Ensure paramsToAdjust and adjustAmounts are arrays
        if (!Array.isArray(newParams.paramsToAdjust)) {
            params.paramsToAdjust = [newParams.paramsToAdjust];
        }
        if (!Array.isArray(newParams.adjustAmounts)) {
            newParams.adjustAmounts = [newParams.adjustAmounts];
        }

        for (let angle = 0; index < newParams.maxVertices * 3; angle += newParams.deltaAngle) {
            const scaleFactor = (angle / 180) * Math.PI * newParams.scale;
            const newX = newParams.xPos + angle * functionX((angle * newParams.xAngularFreq) + newParams.xPhase) * scaleFactor;
            const newY = newParams.yPos + angle * functionY((angle * newParams.yAngularFreq) + newParams.yPhase) * scaleFactor;

            if (index + 2 < positions.length) {
                positions[index++] = newX;
                positions[index++] = newY;
                positions[index++] = 0;
            } else {
                console.warn("Max vertices reached, stopping at index: ", index);
                break;
            }
            // Apply adjustments
            if (index % (Math.floor(newParams.loopVertex) * 3) === 0)
                newParams.paramsToAdjust.forEach((param, idx) => {
                    if (newParams[param] !== undefined && newParams.adjustAmounts[idx] !== undefined)
                        newParams[param] += newParams.adjustAmounts[idx];
                    angle = 0;
                });
        }
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.setDrawRange(0, index / 3);

        // Fade in the pattern if required
        if (this.isFadeIn) {
            this.fadeIn(this.fadeInDuration);
        } else {
            this.material.opacity = 1; // Set to default opacity if no fade-in
        }
    }

    updateMaterialColor(r, g, b) {
        this.material.color.setRGB(r, g, b);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        // Animation logic
        this.renderer.render(this.scene, this.camera);
    }

    fadeOut(duration) {
        gsap.to(this.material, {
            opacity: 0,
            duration: duration / 1000,
            onComplete: () => {
                this.cleanup();
            }
        });
    }

    fadeIn(duration) {
        gsap.to(this.material, {
            opacity: 1,
            duration: duration / 1000
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    cleanup() {
        this.scene.remove(this.geometry);
        this.geometry.dispose();
        this.material.dispose();
    }

    selectFunction(code) {
        switch (Math.floor(code)) {
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
            case 12: return this.linear;
            case 13: return this.zero;
            case 14: return (x) => Math.cos(x) ** 2; // cos^2
            case 15: return (x) => Math.sin(x) ** 2; // sin^^2
            case 16: return (x) => Math.tan(x) ** 2; // tan^2
            case 17: return (x) => Math.sin(x) * Math.cos(x);
            case 18: return (x) => Math.cos(x) * Math.sin(x);
            case 19: return (x) => 1 / (1 + Math.exp(-x)); // Sigmoid function
            case 20: return (x) => Math.log(x + 1); // Natural log(x+1) for positive x
            case 21: return (x) => Math.sin(Math.sqrt(x ** 2 + x ** 2)); // A spiral-like pattern
            case 22: return (x) => Math.cos(x) / Math.sin(x); // cot
            case 23: return (x) => (x ** 2 - 1) / (x ** 1 + 1); // Polynomial example
            case 24: return (x) => Math.exp(-x) * Math.sin(x); // Damped sine wave
            case 25: return (x) => Math.atan(x); // Arctan, can create spirals
            case 26: return (x) => Math.sin(x) * Math.exp(Math.cos(x)) - Math.cos(x) * Math.exp(Math.sin(x)); // Complex oscillation
            default: return Math.sin;
        }
    }

    linear(num) {
        return num;
    }

    zero() {
        return 0;
    }
}

export default Pattern;