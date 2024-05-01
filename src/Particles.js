import Physics from 'physicsjs';

class Particles {
    constructor(posX = 0, posY = 0, width = 500, height = 500) {
        this.canvasPosX = posX;
        this.canvasPosY = posY;
        this.canvasWidth = width;
        this.canvasHeight = height;

        // Initialize the Physics world
        this.world = Physics();
        
        // Add gravity to the world
        const gravity = Physics.behavior('constant-acceleration', {
            acc: { x: 0, y: 0.00314, z: 0 } // Gravity acceleration
        });
        this.world.add(gravity);

        // Dummy renderer
        const dummyRenderer = Physics.renderer('canvas', {
            el: 'viewport',
            width: this.canvasWidth,
            height: this.canvasHeight,
            autoResize: false,
            hidden: true // Hide since we won't actually use this for rendering
        });
        this.world.add(dummyRenderer);

        // Start the simulation
        this.startSimulation();

        if (dummyRenderer.el) {
            dummyRenderer.el.style.position = 'absolute';
            dummyRenderer.el.style.left = `${this.canvasPosX}px`;
            dummyRenderer.el.style.top = `${this.canvasPosY}px`;
            dummyRenderer.el.style.zIndex = `-1`;
        }
    }

    addShard(x, y, vx, vy, finalColor) {
        const width = 3; // Width of the shard
        const height = 3; // Height of the shard

        const shard = Physics.body('rectangle', {
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            width: width,
            height: height,
            restitution: 0.3, // Bounciness
            cof: 0.8, // Friction coefficient
            styles: {
                fillStyle: finalColor
            }
        });

        this.world.add(shard);
    }

    simulateShatter(finalColor) {
        console.log("simulatig!");
        for (let i = 0; i < 100; i++) { // Create 100 shards
            // Random position and velocity for each shard
            let x = Math.random() * 500,
                y = (Math.random() * 500) + 200,
                vx = (Math.random() - 0.5) * 2,
                vy = (Math.random() - 0.5) * 2;

            this.addShard(x, y, vx, vy, finalColor);
        }
    }

    startSimulation() {
        this.world.on('step', () => {
            this.world.render();
        });
        // Start the physics simulation
        Physics.util.ticker.on((time) => {
            this.world.step(time);
        }).start();
    }

    cleanup() {
        Physics.util.ticker.stop();
    }
}

export default Particles;
