import React, { Component } from 'react';
import * as THREE from 'three';
import './RadialMenu.css';


class RadialMenu {
    constructor(container, camera) {
    this.container = container;
    this.camera = camera;
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.clickMeshes = [];
    this.INTERSECTED = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.CAMERA_X_OFFSET = -340;
    this.init();
}

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.renderer.domElement.style.position = 'fixed'; // Use 'fixed' instead of 'absolute' to ensure it covers the full viewport
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '-1'; // Ensure it's behind other content
        this.container.appendChild(this.renderer.domElement);

        // Bind event handlers
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);

        // Add event listeners
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('click', this.onClick);
        window.addEventListener('resize', this.onWindowResize);

        this.generateClickableMeshes();
        this.animate();
    }


    onWindowResize = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.checkIntersection();
    }

    onClick = (event) => {
        console.log("click!");
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.clickMeshes.forEach(mesh => {
            const intersects = this.raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                if (mesh.userData.url) {
                    console.log("navigating!");
                    window.location.href = mesh.userData.url; // Navigate to the stored URL
                }
            }
        });
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        this.renderer.render(this.scene, this.camera);
    }

    generateClickableMeshes(numVertices, deltaAngle, sections, numPerSection) {
        const vertexSets = this.regenerateMenuVertices(numVertices, deltaAngle, sections, numPerSection);
        this.clickMeshes = vertexSets.map(set => this.createMeshFromSet(set));
    }

    regenerateMenuVertices(numVertices, deltaAngle, sections, numPerSection) {
        let windingNumber = 2 * Math.round(Math.PI / deltaAngle);
        const vertexSets = [];

        for (let i = 0; i < windingNumber; i += 1 / numPerSection) {
            let vertex1 = deltaAngle * ((numVertices / 2) - (1 / sections) + i);
            let vertex2 = deltaAngle * ((numVertices / 2) + i);
            
            vertexSets.push({
                origin: [0, 0, 0],
                p1: [Math.pow(vertex1, 2) * Math.cos(vertex1) * (vertex1 / 180) * Math.PI,
                Math.pow(vertex1, 2) * Math.sin(vertex1) * (vertex1 / 180) * Math.PI, 0],
                p2: [Math.pow(vertex2, 2) * Math.cos(vertex2) * (vertex2 / 180) * Math.PI,
                Math.pow(vertex2, 2) * Math.sin(vertex2) * (vertex2 / 180) * Math.PI, 0]
            });
        }
        return vertexSets;
    }

    updateOrCreateMeshes(params, routes) {
        this.scene.children.forEach((child) => {
            if (child instanceof THREE.Sprite) {
                this.scene.remove(child);
                child.material.map.dispose();
                child.material.dispose();
            }
        });

        const vertexSets = this.regenerateMenuVertices(params.numVertices, params.deltaAngle, params.sections, params.numPerSection, params.opacity);
        const distanceFactor = 0.004;
        // Ensure there are enough routes for each mesh; otherwise, use a default value
        while (routes.length < vertexSets.length) {
            routes.push({ text: 'Default', url: '#' }); // Default route
        }
        while (this.clickMeshes.length < vertexSets.length) {
            console.log("creating new mesh for additional vertices");
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
            const material = new THREE.MeshBasicMaterial({
                color: Math.floor(Math.random() * 0xffffff),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: params.opacity
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

        this.clickMeshes.forEach((mesh, index) => {
            const set = vertexSets[index];
            const vertices = new Float32Array([
                this.CAMERA_X_OFFSET + set.origin[0], set.origin[1], set.origin[2],
                this.CAMERA_X_OFFSET + set.p1[0], set.p1[1], set.p1[2],
                this.CAMERA_X_OFFSET + set.p2[0], set.p2[1], set.p2[2],
            ]);
            mesh.geometry.attributes.position.copyArray(vertices);
            mesh.geometry.attributes.position.needsUpdate = true;
            mesh.geometry.computeBoundingSphere();

            // Calculate the average position (center) of the triangle for sprite placement
            const avgX = (set.origin[0] + set.p1[0] + set.p2[0]) / 3;
            const avgY = (set.origin[1] + set.p1[1] + set.p2[1]) / 3;
            const textPositionX = this.CAMERA_X_OFFSET + (avgX - this.CAMERA_X_OFFSET) * distanceFactor;
            const textPositionY = avgY * distanceFactor;
            const route = routes[index]; // Get the route object for this index
            let sprite = this.createTextSprite(route.text, params.deltaAngle * index);
            mesh.userData.url = route.url; // Store the URL in the sprite's userData for navigation

            // Position the sprite based on the average position of the mesh vertices
            // Adjust z position as needed to avoid z-fighting with the mesh
            sprite.position.set(textPositionX, textPositionY, 2);

            this.scene.add(sprite);
        });
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

    highlightMesh(mesh) {
        mesh.userData.originalMaterial = mesh.material;
        mesh.material = new THREE.MeshBasicMaterial({
            color: Math.floor(Math.random() * 0xffffff),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
    }

    resetHighlight() {
        if (this.INTERSECTED.current && this.INTERSECTED.current.userData.originalMaterial) {
            this.INTERSECTED.current.material = this.INTERSECTED.current.userData.originalMaterial;
        }
    }

    createTextSprite(message, deltaAngle) {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        const canvasWidth = 1024; // Smaller for performance, adjust as needed
        const canvasHeight = 512; // Adjust as needed
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Adjust text styling
        ctx.font = '48px Arial'; // Adjust font size based on your needs
        ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Text color
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Translate and rotate context for centered and rotated text
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.rotate(-deltaAngle); // Rotate text in opposite direction for correct orientation

        // Draw text at the center
        ctx.fillText(message, 0, 0);

        // Create texture and sprite
        let texture = new THREE.CanvasTexture(canvas);
        let material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        let sprite = new THREE.Sprite(material);

        // Adjust sprite scale to match your 3D world scale
        sprite.scale.set(400, 200, 20); // Adjust based on the scale of your meshes and scene

        return sprite;
    }



    cleanup() {
        window.removeEventListener('resize', this.onWindowResize);
        this.container.removeChild(this.renderer.domElement);

        this.clickMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });

        this.scene.children.forEach((child) => {
            if (child instanceof THREE.Sprite) {
                this.scene.remove(child);
                child.material.map.dispose();
                child.material.dispose();
            }
        });
    }
}

export default RadialMenu;

