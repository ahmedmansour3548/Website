﻿import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { NavLink, Routes, Route, BrowserRouter as Router } from 'react-router-dom'; // Correct import path
import './App.css';
import Notes from './Notes';

import Effects, { generateRainbowColors, generatePathStep, createCustomBody, Effect } from './Effects'; // Assuming Effects is a default export



export default function App() {

    /**
     * 
     *  ██   ██  ██████   ██████  ██   ██ ███████ 
     *  ██   ██ ██    ██ ██    ██ ██  ██  ██      
     *  ███████ ██    ██ ██    ██ █████   ███████ 
     *  ██   ██ ██    ██ ██    ██ ██  ██       ██ 
     *  ██   ██  ██████   ██████  ██   ██ ███████                                           
     *
     */

    useEffect(() => {
    }, [1]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isContentDisplayed, setIsContentDisplayed] = useState(false);
    

    const notesContentLength = 1000; // Replace with dynamic length if needed
    const totalDuration = notesContentLength * 50; // Total duration to display all characters

    const [springProps, api] = useSpring(() => ({
        x: totalDuration,
        originX: 400, // Initial origin X
        originY: 300, // Initial origin Y
        config: { duration: 1000 }
    }));

    const { strokeDashAnimator } = useSpring({
        from: {
            strokeDashAnimator: 0,
            originX: 400, // Initial origin X
            originY: 300, // Initial origin Y,
        },
        strokeDashAnimator: isContentDisplayed ? 1 : 0,
        config: { duration: totalDuration }
    });
    const colors = generateRainbowColors(360); // Generate rainbow colors

    const handleClick = (e) => {
        // Toggle the animation state using the function form of state setter
        setIsAnimating(prev => !prev);

        //const rect = e.currentTarget.getBoundingClientRect();
        //const clickX = e.clientX - rect.left; // Calculate the click position relative to the SVG element
        //const clickY = e.clientY - rect.top;

        if (!isAnimating) {
            api.start({
                x: 600,
                originX: 400, // Set new origin X
                originY: 300, // Set new origin Y
                config: { duration: 2000 }
            });
        } else {
            api.start({
                x: 0,

                config: { duration: 1 }
            });
        }
    };

    const handleBackgroundEffectClick = () => {
        // Instantiate a BackgroundEffect object with desired parameters
        /*const backgroundEffect = new Effect(
            400,    // xCoord
            0,      // yCoord
            0,      // step
            2,      // xFunctionCode
            1,      // yFunctionCode
            1,      // deltaAngle
            1,      // scale
            468,      // xAngularFreq
            120,      // yAngularFreq
            20,      // xPhase
            2       // yPhase
        );*/
        const bE = Effect.random();
        // Call the play method to start the effect
        bE.play(200);
    };

    const handleShadeClick = () => {
        // Instantiate a BackgroundEffect object with desired parameters
        const backgroundEffect = new Effect()
            .setXCoord(500)
            .setYCoord(500)
            .setStartValue(500)
            .setEndValue(10000)
            .setStep(1)
            .setLifespan(99999)
            .setFadeOutDuration(10000)
            .setXFunctionCode(0)
            .setYFunctionCode(1)
            .setDeltaAngle(1)
            .setScale(0.1)
            .setXAngularFreq(1)
            .setYAngularFreq(1)
            .setXPhase(1)
            .setYPhase(1)
            .setPulseID(5)
            .setPulseAmplitude(0.0001)
            .setPulseFrequency(100000)
            .setPulseLowerBound(1)
            .setPulseUpperBound(1.1);
        // Call the play method to start the effect
        backgroundEffect.play();
    };

    const [step, setStep] = useState(0); // Adjustable step variable
    const [time, setTime] = useState(0); // Time variable for sine wave modulation
    const [deltaAngle, setDeltaAngle] = useState(1); // Adjustable angle increment
    const [scale, setScale] = useState(0.1); // Adjustable scale factor multiplier
    const [xAngularFreq, setXAngularFreq] = useState(1);
    const [yAngularFreq, setYAngularFreq] = useState(1);
    const [xPhase, setXPhase] = useState(1);
    const [yPhase, setYPhase] = useState(1);

    const spiralPath = springProps
        .x
        .to(x => generatePathStep(x, springProps.originX.get(), springProps.originY.get(), 1, 0, deltaAngle, scale, xAngularFreq, yAngularFreq, xPhase, yPhase));

    const colorIndex = springProps
        .x
        .to(x => Math.round((x / 600) * (colors.length - 1))); // Calculate color index based on animation progress



    /**
     *
     *   ██████  ██████  ███    ██ ████████ ███████ ███    ██ ████████ 
     *  ██      ██    ██ ████   ██    ██    ██      ████   ██    ██    
     *  ██      ██    ██ ██ ██  ██    ██    █████   ██ ██  ██    ██    
     *  ██      ██    ██ ██  ██ ██    ██    ██      ██  ██ ██    ██    
     *   ██████  ██████  ██   ████    ██    ███████ ██   ████    ██    
     *                                                        
     */

    return (
        <>
            <Effects
                step={step}
                setStep={setStep}
                time={time}
                setTime={setTime}
                deltaAngle={deltaAngle}
                setDeltaAngle={setDeltaAngle}
                setScale={setScale}
                xAngularFreq={xAngularFreq}
                setXAngularFreq={setXAngularFreq}
                yAngularFreq={yAngularFreq}
                setYAngularFreq={setYAngularFreq}
                xPhase={xPhase}
                yPhase={yPhase}
            />
            <div className="home-container" style={{ fontSize: '50px', marginLeft: '800px' }}>
            </div>
            
            <div className="main" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                <animated.svg
                    width="800"
                    height="600"
                    viewBox="0 0 800 600"
                    style={{ overflow: 'visible', marginBottom: '20px' }}
                    onClick={handleClick}
                >
                    <animated.path
                        d={spiralPath}
                        stroke={colorIndex.to(index => colors[index])}
                        strokeWidth="2"
                        fill="none"
                        style={{
                            strokeDasharray: 0, // Adjust based on your path's length
                            strokeDashoffset: strokeDashAnimator.to(x => (1 - x) * 1000),
                        }}
                    />
                </animated.svg>

                <div className="note">
                    <Notes onContentDisplayed={setIsContentDisplayed} />
                </div>
                
                <div className="controls">

                    <SliderWithLabel
                        label="Step"
                        value={step}
                        setValue={setStep}
                        min={0}
                        max={1}
                        step={0.05}
                    />
                    <SliderWithLabel
                        label="Scale Factor Multiplier"
                        value={scale}
                        setValue={setScale}
                        min={0.001}
                        max={100}
                        step={0.01}
                    />
                    <SliderWithLabel
                        label="Angle Increment"
                        value={deltaAngle}
                        setValue={setDeltaAngle}
                        min={0.05}
                        max={100}
                        step={0.0001}
                    />
                    <SliderWithLabel
                        label="X Angular Frequency"
                        value={xAngularFreq}
                        setValue={setXAngularFreq}
                        min={0.1}
                        max={100}
                        step={0.001}
                    />
                    <SliderWithLabel
                        label="Y Angular Frequency"
                        value={yAngularFreq}
                        setValue={setYAngularFreq}
                        min={0.1}
                        max={100}
                        step={0.001}
                    />
                    <SliderWithLabel
                        label="X Phase"
                        value={xPhase}
                        setValue={setXPhase}
                        min={0.1}
                        max={20}
                        step={0.1}
                    />
                    <SliderWithLabel
                        label="Y Phase"
                        value={yPhase}
                        setValue={setYPhase}
                        min={0.1}
                        max={20}
                        step={0.1}
                    />
                    <button onClick={handleBackgroundEffectClick}>Start Background Effect</button>
                    <button onClick={handleShadeClick}>Shading Test</button>
                </div>
            </div>
        </>
    );
}


function SliderWithLabel({ label, value, setValue, min = 0, max = 1, step = 0.05 }) {
    const handleChange = (e) => {
        let newValue = parseFloat(e.target.value);
        if (!isNaN(newValue) && newValue >= min && newValue <= max) {
            setValue(newValue);
        }
    };

    const handleIncrement = () => {
        const newValue = Math.min(value + step, max);
        setValue(newValue);
    };

    const handleDecrement = () => {
        const newValue = Math.max(value - step, min);
        setValue(newValue);
    };

    return (
        <div className="slider-container">
            <label className="label">{label}</label>
            <div className="slider-input-container">
                <button className="arrow-button" onClick={handleDecrement}>&#9666;</button>
                <input
                    type="number"
                    className="slider-input"
                    value={value}
                    onChange={handleChange}
                />
                <button className="arrow-button" onClick={handleIncrement}>&#9656;</button>
            </div>
        </div>
    );
}

