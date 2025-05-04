import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import './Physics.css';

const Physics = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);

  useEffect(() => {
    // Module aliases
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const Runner = Matter.Runner;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;

    // Create engine
    const engine = Engine.create();
    engineRef.current = engine;

    // Create and attach renderer to our div
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
      },
    });
    renderRef.current = render;

    // Create bodies
    const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    Composite.add(engine.world, ground);

    // Custom body code here (imported logic)
    // Example: a simple rectangle
    const boxA = Bodies.rectangle(400, 200, 80, 80);
    Composite.add(engine.world, boxA);

    // Mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { render: { visible: false } }
    });
    Composite.add(engine.world, mouseConstraint);

    // Run renderer and engine
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    runnerRef.current = runner;

    // Cleanup on unmount
    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, []);

  return (
    <div className="physics-container">
      <h1>Physics Page</h1>
      <p>This is a simple page dedicated to physics.</p>
      <div ref={sceneRef} />
    </div>
  );
};

export default Physics;
