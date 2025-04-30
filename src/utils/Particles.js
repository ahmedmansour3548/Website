// src/utils/Particles.js
import Matter from 'matter-js';

class Particles {
  constructor(posX = 0, posY = 0, width = 500, height = 500) {
    this.canvasPosX = posX;
    this.canvasPosY = posY;
    this.canvasWidth = width;
    this.canvasHeight = height;

    // 1) Create engine and world
    this.engine = Matter.Engine.create();
    this.world  = this.engine.world;
    // Give a slight gravity downwards
    this.world.gravity.y = 0.00314;

    // 2) Create renderer on your existing <div id="particles-canvas"></div>
    this.render = Matter.Render.create({
      element: document.getElementById('particles-canvas'),
      engine: this.engine,
      options: {
        width: this.canvasWidth,
        height: this.canvasHeight,
        wireframes: false,      // fill shapes
        background: 'transparent'
      }
    });
    Matter.Render.run(this.render);

    // 3) Create runner (stepper)
    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);

    // 4) Keep reference to the canvas for cleanup
    this.canvasElement = this.render.canvas;
    this.canvasElement.style.position = 'absolute';
    this.canvasElement.style.left     = `${this.canvasPosX}px`;
    this.canvasElement.style.top      = `${this.canvasPosY}px`;
    this.canvasElement.style.zIndex   = '0';
  }

  addShard(x, y, vx, vy, fillColor) {
    const size = 10;
    const shard = Matter.Bodies.rectangle(x, y, size, size, {
      restitution: 0.3,   // bounciness
      friction: 0.2,
      render: {
        fillStyle: fillColor
      }
    });
    // set initial velocity
    Matter.Body.setVelocity(shard, { x: vx, y: vy });
    Matter.World.add(this.world, shard);
  }

  simulateShatter(fillColor) {
    console.log('Shattering with color:', fillColor);
    for (let i = 0; i < 100; i++) {
      const x  = Math.random() * this.canvasWidth;
      const y  = Math.random() * this.canvasHeight;
      const vx = (Math.random() - 0.5) * 2;
      const vy = (Math.random() - 0.5) * 2;
      this.addShard(x, y, vx, vy, fillColor);
    }
  }

  cleanup() {
    // Stop runner & renderer
    Matter.Runner.stop(this.runner);
    Matter.Render.stop(this.render);

    // Clear world
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);

    // Remove canvas DOM
    if (this.canvasElement && this.canvasElement.parentNode) {
      this.canvasElement.parentNode.removeChild(this.canvasElement);
    }
  }
}

export default Particles;
