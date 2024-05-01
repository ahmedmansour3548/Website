import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { NavLink, Routes, Route, BrowserRouter as Router } from 'react-router-dom'; // Correct import path
import './Thoughts.css';
import Notes from './Notes';

import Effects, { generateRainbowColors, generatePathStep, createCustomBody, Effect } from './Effects'; // Assuming Effects is a default export



export default function Thoughts() {

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


    }, []);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isContentDisplayed, setIsContentDisplayed] = useState(false);
    const [trigger, setTrigger] = useState(false);
    
    //console.log("totaldureation:" + totalDuration);
    const [patternSpringParams, patternSpring] = useState({
        d: 0,
        stroke: "green"
    });

    const [springProps, api] = useSpring(() => ({
        x: 0,
        originX: 400, // Initial origin X
        originY: 300, // Initial origin Y
        config: { duration: 1000 }
    }));
    const animatedPatternProps = useSpring(patternSpringParams);

    const [propsXPhase, apiXPhase] = useSpring(() => ({
        xPhase: 0,
        loop: true,
        to: { xPhase: 0 },
        config: { duration: 100 },
    }));

    const { strokeDashAnimator } = useSpring({
        from: {
            strokeDashAnimator: 0,
            originX: 400, // Initial origin X
            originY: 300, // Initial origin Y,
        },
        strokeDashAnimator: isContentDisplayed ? 1 : 0,
        config: { duration: 100 }
    });
    const colors = generateRainbowColors(360); // Generate rainbow colors


    const handleNextThoughtClick = (e) => {
        setTrigger(!trigger);

        // Reset and animate `x` to 600 immediately.
        api.start({
            x: 0,
            immediate: true, // Apply the reset immediately without animation
        });
        apiXPhase.start({
            xPhase: 0,
            immediate:true,
        });

        setTimeout(() => {
            // Start the `x` animation to 600
            api.start({
                x: 600,

                config: { duration: 2000 },
            });


        }, 10); // A short delay to ensure the immediate reset is visually applied

        setTimeout(() => {

            apiXPhase.start({
                xPhase: 10,
                loop:true,
                config: { duration: 2000 },
            });
        }, 10); // A short delay to ensure the immediate reset is visually applied


    };



    console.log("Yee " + propsXPhase.xPhase.get());

    const onContentDisplayed = () => {
        // Optionally handle the completion of the note display
        console.log("displayed!");

        
    };

    const onContentLength = () => {
        // Optionally handle the completion of the note display
        console.log("legnth!");
        


    };
    const [step, setStep] = useState(0); // Adjustable step variable
    const [time, setTime] = useState(0); // Time variable for sine wave modulation
    const [deltaAngle, setDeltaAngle] = useState(1); // Adjustable angle increment
    const [scale, setScale] = useState(0.1); // Adjustable scale factor multiplier
    const [xAngularFreq, setXAngularFreq] = useState(1);
    const [yAngularFreq, setYAngularFreq] = useState(1);
    const [xPhase, setXPhase] = useState(1);
    const [yPhase, setYPhase] = useState(1);

    var spiralPath = springProps
        .x
        .to(x => generatePathStep(x, springProps.originX.get(), springProps.originY.get(), 1, 0, deltaAngle, scale, xAngularFreq, yAngularFreq, propsXPhase.xPhase.get(), yPhase));

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

            <div className="home-container" style={{ fontSize: '50px', marginLeft: '800px' }}>
            </div>

            <div className="main" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                <animated.svg
                    width="800"
                    height="600"
                    viewBox="0 0 800 600"
                    style={{ overflow: 'visible', marginBottom: '20px' }}
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
                    <Notes trigger={trigger} onContentDisplayed={onContentDisplayed} onContentLength={onContentLength} />

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
                        step={0.01}
                    />
                    <SliderWithLabel
                        label="X Angular Frequency"
                        value={xAngularFreq}
                        setValue={setXAngularFreq}
                        min={0.1}
                        max={2}
                        step={0.001}
                    />
                    <SliderWithLabel
                        label="Y Angular Frequency"
                        value={yAngularFreq}
                        setValue={setYAngularFreq}
                        min={0.1}
                        max={2}
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
                    <button onClick={handleNextThoughtClick}>Next Thought</button>
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

