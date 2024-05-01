import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSelector, useDispatch } from 'react-redux';
import cameraInstance from './utils/camera';

class Pattern {
    constructor(camera) {
        this.maxVertices = 5000;
        this.positionsArray = new Float32Array(this.maxVertices * 3);
        this.clickMeshes = [];
        this.INTERSECTED = null;
        this.raycaster = new THREE.Raycaster();
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.material = new THREE.LineBasicMaterial({ color: 0x00ffff });
        this.geometry = new THREE.BufferGeometry();
        this.camera = camera;
        this.mouse = new THREE.Vector2();
        this.CAMERA_X_OFFSET = -340;
        this.CAMERA_Y_OFFSET = 0;
        this.CAMERA_Z_OFFSET = 500;
        this.clickMeshes = []; 

        this.init();
    }

    init() {
        this.material = new THREE.LineBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
        this.geometry = new THREE.BufferGeometry();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.domElement.style.position = 'fixed'; 
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '0';
        document.body.appendChild(this.renderer.domElement);
        this.scene.add(new THREE.Line(this.geometry, this.material));

    
        //this.updateOrCreateMeshes(50, 3.14, 5, 2);
        this.animate();
    }

    regeneratePatternArea(params) {
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
            console.log(newParams.paramsToAdjust);
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
    }


    updateMaterialColor(r, g, b) {
        this.material.color.setRGB(r, g, b);
    }
    checkIntersection() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.clickMeshes);

        if (intersects.length > 0) {
            if (this.INTERSECTED !== intersects[0].object) {
                if (this.INTERSECTED) this.resetHighlight(this.INTERSECTED);
                this.INTERSECTED = intersects[0].object;
                this.highlightMesh(this.INTERSECTED);
            }
        } else {
            if (this.INTERSECTED) this.resetHighlight(this.INTERSECTED);
            this.INTERSECTED = null;
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        // Animation logic
        this.renderer.render(this.scene, this.camera);
    }
/*    generateClickableMeshes(numVertices, deltaAngle, sections, numPerSection) {
        const vertexSets = this.regenerateMenuVertices(numVertices, deltaAngle, sections, numPerSection);
        this.clickMeshes = vertexSets.map(set => this.createMeshFromSet(set));
    }

    regenerateMenuVertices(numVertices, deltaAngle, sections, numFilledSections) {
        let windingNumber = 2 * Math.round(Math.PI / deltaAngle);
        const vertexSets = [];

        for (let i = 0; i < windingNumber; i += 1 / numFilledSections) {
            let vertex1 = (deltaAngle * ((numVertices / 2) - (1 / sections) + i));
            let vertex2 = (deltaAngle * ((numVertices / 2) + i));
            vertexSets.push({
                origin: [0, 0, 0],
                p1: [this.CAMERA_X_OFFSET + (Math.pow(vertex1, 2) * Math.cos(vertex1) * (vertex1 / 180) * Math.PI),
                (Math.pow(vertex1, 2) * Math.sin(vertex1) * (vertex1 / 180) * Math.PI), 0],
                p2: [this.CAMERA_X_OFFSET + (Math.pow(vertex2, 2) * Math.cos(vertex2) * (vertex2 / 180) * Math.PI),
                (Math.pow(vertex2, 2) * Math.sin(vertex2) * (vertex2 / 180) * Math.PI), 0]
            })
        }
        return vertexSets;
    }

    updateOrCreateMeshes(params) {
        const vertexSets = this.regenerateMenuVertices(params.numVertices, params.deltaAngle, params.sections, params.numPerSection);

        // Adjust the number of meshes to match the number of vertex sets
        while (this.clickMeshes.length < vertexSets.length) {
            console.log("creating new mesh for additional vertices");
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
            const material = new THREE.MeshBasicMaterial({
                color: Math.floor(Math.random() * 0xffffff),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5,
            });
            const newMesh = new THREE.Mesh(geometry, material);
            this.clickMeshes.push(newMesh);
            this.scene.add(newMesh);
        }

        while (this.clickMeshes.length > vertexSets.length) {
            console.log("removing excess mesh");
            const meshToRemove = this.clickMeshes.pop();
            this.scene.remove(meshToRemove);
            meshToRemove.geometry.dispose();
            meshToRemove.material.dispose();
        }

        // Update each mesh with the corresponding vertex positions from vertexSets
        this.clickMeshes.forEach((mesh, index) => {
            const set = vertexSets[index];
            const vertices = new Float32Array([
                this.CAMERA_X_OFFSET + set.origin[0], set.origin[1], set.origin[2],
                this.CAMERA_X_OFFSET + set.p1[0], set.p1[1], set.p1[2],
                this.CAMERA_X_OFFSET + set.p2[0], set.p2[1], set.p2[2],
            ]);

            mesh.geometry.attributes.position.copyArray(vertices);
            mesh.geometry.attributes.position.needsUpdate = true;
            mesh.geometry.computeBoundingSphere(); // Useful if you're using raycasting
        });
    }*/


    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
/*
    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.checkIntersection();
    }

    onClick(event) {
        console.log("click!");
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.clickMeshes.forEach(mesh => {
            const intersects = this.raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                const meshIndex = this.clickMeshes.indexOf(mesh);
                console.log('Clicked mesh index:', meshIndex);
                // Handle click event for the mesh
            }
        });
    }


    highlightMesh(mesh) {
        mesh.userData.originalMaterial = mesh.material;
        mesh.material = new THREE.MeshBasicMaterial({
            color: Math.floor(Math.random() * 0xffffff),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
    }

    //const randomDelta = 0.785398163;
    //const vertexSets = regenerateMenuVertices(randomDelta, 45, 5, 1);
    //const newClickMeshes = vertexSets.map(set => createMeshFromSet(set));

    //setClickMeshes(newClickMeshes);
    //clickMeshesRef.current = newClickMeshes;

    resetHighlight() {
        if (this.INTERSECTED.current && this.INTERSECTED.current.userData.originalMaterial) {
            this.INTERSECTED.current.material = this.INTERSECTED.current.userData.originalMaterial;
        }
    }*/


    
    selectRandomPiDelta() {
        var rand = Math.floor(Math.random() * 10) + 1;
        return Math.PI / rand;
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
            case 15: return (x) => Math.sin(x) ** 2; // sin^2
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


    addDot(x, y, z, scene) {
        // Geometry for a single vertex
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([x, y, z], 3));

        // Material for the dot (you can change the color)
        const material = new THREE.PointsMaterial({ color: 0xff0000, size: 10 });

        // Create the dot as a Points object
        const dot = new THREE.Points(geometry, material);

        // Add the dot to the scene
        scene.add(dot);
    }

    linear(num) {
        return num;
    }

    zero(num) {
        return 0;
    }


    // Clean up
    cleanup() {
        document.body.removeChild(this.renderer.domElement);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.onClick);
    }

}



export default Pattern;