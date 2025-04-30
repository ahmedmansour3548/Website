import * as THREE from 'three';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';

class Ascii {
    constructor(mountRef, sharedCamera, folderName, posX, posY, posZ, width, height) {
        this.scene = new THREE.Scene();
        this.camera = sharedCamera;
        this.renderer = new THREE.WebGLRenderer();
        this.mountRef = mountRef;
        this.effect = new AsciiEffect(this.renderer, ' .,:;!|', { invert: true, resolution: 0.25 });
        this.textures = {};
        this.mesh = null;
        this.frameCount = 0;
        this.currentFrame = 0;
        this.folderName = folderName;
        this.posX = posX;
        this.posY = posY;
        this.posZ = posZ;
        this.width = width;
        this.height = height;

        this.init();
    }

    async init() {
        this.effect.setSize(window.innerWidth, window.innerHeight);
        this.effect.domElement.style.color = 'white';
        this.effect.domElement.style.position = 'absolute';
        this.effect.domElement.style.top = '100px';
        this.effect.domElement.style.zIndex = '-1';
        this.mountRef.appendChild(this.effect.domElement); // Append the effect's DOM element to the mount reference

        await this.loadTextures();
    }

    async loadTextures() {
        try {
            const response = await fetch(`./assets/${this.folderName}/fileList.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const fileList = await response.json();
            this.frameCount = fileList.length;

            const loader = new THREE.TextureLoader();
            const promises = fileList.map(fileName => loader.loadAsync(`/assets/${this.folderName}/${fileName}`));
            Promise.all(promises).then((loadedTextures) => {
                this.textures[this.folderName] = loadedTextures;
                this.createMesh();
                this.animate();
            });
        } catch (error) {
            console.error('Failed to load textures:', error);
        }
    }

    createMesh() {
        const geometry = new THREE.PlaneGeometry(this.width, this.height);
        this.mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: this.textures[this.folderName][this.currentFrame] }));
        this.mesh.position.set(this.posX, this.posY, this.posZ);
        console.log("creating mesh");
        this.scene.add(this.mesh);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.effect.render(this.scene, this.camera); // Render the scene using the AsciiEffect
    }

    setFrameByProgress(animationSetName, progress) {
        const frameIndex = progress * this.frameCount;
        this.updateFrame(animationSetName, frameIndex);
    }

    updateFrame(animationSetName, frameIndex) {
        if (!this.textures[animationSetName]) return;
        this.currentFrame = Math.floor(frameIndex) % this.textures[animationSetName].length;
        this.mesh.material.map = this.textures[animationSetName][this.currentFrame];
        this.mesh.material.needsUpdate = true;
    }

    setMeshPosition(x, y, z) {
        if (this.mesh) {
            console.log("setting x, y, z" + x + ", " + y + ", " + z);
            this.mesh.position.set(x, y, z);
        }
    }

    // Clean up
    cleanup() {
        if (this.scene.container && this.effect.domElement) {
            this.scene.container.removeChild(this.effect.domElement);
        }
    }
    // Additional methods for animation control, resizing, etc.
}

export default Ascii;