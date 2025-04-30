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
      acc: { x: 0, y: 0.00314, z: 0 }
    });
    this.world.add(gravity);

    // Create the renderer (canvas) with the id 'viewport'
    const dummyRenderer = Physics.renderer('canvas', {
      el: 'particles-canvas',
      width: this.canvasWidth,
      height: this.canvasHeight,
      autoResize: false,
      hidden: false // Canvas is visible
    });
    this.world.add(dummyRenderer);

    // Store a reference to the canvas element so we can remove it later
    this.canvasElement = dummyRenderer.el;

    // Style the canvas so it's positioned on top as needed
    if (this.canvasElement) {
      this.canvasElement.style.position = 'absolute';
      this.canvasElement.style.left = `${this.canvasPosX}px`;
      this.canvasElement.style.top = `${this.canvasPosY}px`;
      // Keep it on top while in use
      this.canvasElement.style.zIndex = '0';
    }

    // Start the simulation
    this.startSimulation();
  }

  addShard(x, y, vx, vy, finalColor) {
    const width = 10; // Shard width
    const height = 10; // Shard height
    const shard = Physics.body('rectangle', {
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      width: width,
      height: height,
      restitution: 0.3, // Bounciness
      cof: 0.8,         // Friction coefficient
      styles: {
        fillStyle: finalColor
      }
    });
    this.world.add(shard);
  }

  simulateShatter(finalColor) {
    console.log("Simulating shatter with color:", finalColor);
    for (let i = 0; i < 100; i++) { // Create 100 shards
      let x = Math.random() * this.canvasWidth;
      let y = Math.random() * this.canvasHeight;
      let vx = (Math.random() - 0.5) * 2;
      let vy = (Math.random() - 0.5) * 2;
      this.addShard(x, y, vx, vy, finalColor);
    }
  }

  startSimulation() {
    // Render the world on each physics step
    this.world.on('step', () => {
      this.world.render();
    });
    // Start the simulation ticker
    Physics.util.ticker.on((time) => {
      this.world.step(time);
    }).start();
  }

  cleanup() {
    // Stop the physics simulation
    Physics.util.ticker.stop();
    // Remove the canvas from the DOM so it doesn't block clicks on other pages
    if (this.canvasElement && this.canvasElement.parentNode) {
      this.canvasElement.parentNode.removeChild(this.canvasElement);
    }
  }
}

export default Particles;
