import * as THREE from 'three';

class Camera {
    constructor() {
        // Camera setup
        const aspectRatio = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 10000);

        // Initial camera position
        this.camera.position.set(0, 0, 500);

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize);
    }

    onWindowResize = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    getCamera = () => {
        return this.camera;
    }
}

const cameraInstance = new Camera();

export default cameraInstance;
