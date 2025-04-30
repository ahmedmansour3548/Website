import React from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import * as Matter from 'matter-js';
import Home from '../Home/Home';
import './Physics.css';
import Effects, { generateRainbowColors, generatePathStep, createCustomBody, Effect } from '../utils/Effects'; 

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse;

// create an engine
var engine = Engine.create();

// create a renderer
var render = Render.create({
    element: document.body,
    engine: engine
});

// create two boxes and a ground
//var boxA = Bodies.rectangle(400, 200, 80, 80, { isStatic: false }); // Make boxA movable
//var boxB = Bodies.rectangle(450, 50, 80, 80, { isStatic: false }); // Make boxB movable
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
const pathVertices = [
    { x: 0, y: 0 },
    { x: 70, y: 0 },
    { x: 50, y: 50 },
    { x: 0, y: 50 }
];


/*const pathVertices = generateMatterVertices(
    2,    // T
    0,    // xCoord
    0,      // yCoord
    0,      // step
    1,      // xFunctionCode
    0,      // yFunctionCode
    1,      // deltaAngle
    1,      // scale
    1,      // xAngularFreq
    1,      // yAngularFreq
    0,      // xPhase
    0       // yPhase
);*/

const customBody = createCustomBody(400, 100, pathVertices, {
    isStatic: false,
    render: {
        fillStyle: '#ffFF00',
        strokeStyle: '#00FF00',
        lineWidth: 20
    }
});

// Add the custom body to the world
Composite.add(engine.world, customBody);
// add all of the bodies to the world
Composite.add(engine.world, [ground]);

// create mouse constraint
var mouse = Mouse.create(render.canvas);
var mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        render: {
            visible: false // Hide the constraint outline
        }
    }
});

// add mouse constraint to the world
Composite.add(engine.world, mouseConstraint);

// run the renderer
//Render.run(render);

// create runner
//var runner = Runner.create();

// run the engine
//Runner.run(runner, engine);

const Physics = () => {
    return (
        <div className="physics-container">
            <h1>Physics Page</h1>
            <p>This is a simple page dedicated to physics.</p>
            {/* Additional content for Physics page */}
        </div>
    );
};

export default Physics;
