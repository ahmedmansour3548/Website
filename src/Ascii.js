import * as THREE from 'three';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';

class Ascii {
    constructor(container, camera) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = camera;
        this.renderer = new THREE.WebGLRenderer();
        this.effect = null;
        this.textures = {}
;
        this.mesh = null;
        this.frameCount = 13;
        this.currentFrame = 0;
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.effect = new AsciiEffect(this.renderer, ' .,:;!|', { invert: true, resolution: 0.25 });
        this.effect.setSize(window.innerWidth, window.innerHeight);
        this.effect.domElement.style.color = 'white';


        this.effect.domElement.style.position = 'absolute';
        this.effect.domElement.style.top = '100px';
        this.effect.domElement.style.zIndex = '-1';
        if (this.container) {
            this.container.appendChild(this.effect.domElement);
        }
        this.loadTextures();
    }

    loadTextures() {
        const loader = new THREE.TextureLoader();
        const promises = [];
        const bookPromises = [];

        for (let i = 1; i <= this.frameCount; i++) {
            const promise = loader.loadAsync(`/assets/animation1/f${i}.png`);
            promises.push(promise);
        }


        Promise.all(promises).then((loadedTextures) => {
            this.textures['animation1'] = loadedTextures;
        });


        //book
        for (let i = 1; i <= 1; i++) {
            const promise = loader.loadAsync(`/assets/animation2/f${i}.png`);
            bookPromises.push(promise);
        }

        
        this.textures['animation2'] = loader.load(`/assets/animation2/f1.png`);

        Promise.all(bookPromises).then((loadedTextures) => {
            this.textures['animation2'] = loadedTextures;
            this.createMesh();
            this.animate();
        });


    }

    createMesh() {
        const geometry = new THREE.PlaneGeometry(1920, 1080);
        this.mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: this.textures['animation1'][this.currentFrame] }));
        this.mesh.position.set(-220, -200, 0);
        this.scene.add(this.mesh);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.effect.render(this.scene, this.camera);
    }

    setFrameByProgress(animationSetName, progress) {
        const frameIndex = progress * this.frameCount;
        this.updateFrame(animationSetName, frameIndex);
    }

    updateFrame(animationSetName, frameIndex) {
        
        // Ensure animationSetName is valid before attempting to access its frames
        if (!this.textures[animationSetName]) return;
        console.log(this.textures[animationSetName].length);
        this.currentFrame = Math.floor(frameIndex) % this.textures[animationSetName].length;
        console.log("frame: " + this.currentFrame + " set : " + animationSetName);
        this.mesh.material.map = this.textures[animationSetName][this.currentFrame];
        this.mesh.material.needsUpdate = true;
    }

    translateMesh(pos) {
        this.mesh.position.x = pos;
    }

    // Clean up
    cleanup() {
        if (this.container && this.effect.domElement) {
            this.container.removeChild(this.effect.domElement);
        }
    }
    // Additional methods for animation control, resizing, etc.
}



export default Ascii;