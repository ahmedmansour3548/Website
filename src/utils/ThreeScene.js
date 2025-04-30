import * as THREE from 'three';

class ThreeScene {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.effect = null;

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = 5;

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    setEffect(effect) {
        this.effect = effect;
        if (this.container && this.effect.domElement) {
            this.container.appendChild(this.effect.domElement);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.effect) {
            this.effect.setSize(window.innerWidth, window.innerHeight);
        }
    }

    render() {
        if (this.effect) {
            this.effect.render(this.scene, this.camera);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

export default ThreeScene;
