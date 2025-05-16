import './Home.css';
import React, { useState, useEffect, useRef } from 'react';
import Pattern from '../utils/Pattern';
import Ascii from '../ASCII/Ascii';
import Particles from '../utils/Particles';
import RadialMenu from '../utils/RadialMenu';
import { gsap } from 'gsap';
import * as THREE from 'three';
import cameraInstance from '../utils/camera';
import '../Timeline/TimelineController.css'

const Home = () => {
    const asciiMountRef = useRef(null);
    const radialMenuMountRef = useRef(null);
    const patternRef = useRef();
    const asciiRef = useRef();
    const particlesRef = useRef();
    const radialMenuRef = useRef();
    const patternProgressRef = useRef({
        value: 0,
        xAxis: 0,
        yAxis: 0,
        color: 0,
        deltaAngle: 0,
        opacity: 0
    });

    const asciiProgressRef = useRef({
        frame: 0,
        posX: 0,
        posY: 0,
        posZ: 0
    });
    const radialMenuProgressRef = useRef();
    const timeline = useRef(gsap.timeline({
        paused: false,
    }));
    const repeatRotationRef = useRef(true);
    const [isNotesVisible, setIsNotesVisible] = useState(true);

    //
    //   █████╗ ███╗   ██╗██╗███╗   ███╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗███████╗
    //  ██╔══██╗████╗  ██║██║████╗ ████║██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
    //  ███████║██╔██╗ ██║██║██╔████╔██║███████║   ██║   ██║██║   ██║██╔██╗ ██║███████╗
    //  ██╔══██║██║╚██╗██║██║██║╚██╔╝██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║╚════██║
    //  ██║  ██║██║ ╚████║██║██║ ╚═╝ ██║██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║███████║
    //  ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
    //
    const animate = () => {
        timeline.current.seek("test");
    };

    useEffect(() => {
        const colors = [
            { r: 1, g: 0, b: 0 },        // Red
            { r: 1, g: 0.5, b: 0 },      // Orange
            { r: 1, g: 1, b: 0 },        // Yellow
            { r: 0, g: 1, b: 0 },        // Green
            { r: 0, g: 0, b: 1 },        // Blue
            { r: 0.29, g: 0, b: 0.51 },  // Indigo
            { r: 0.58, g: 0, b: 0.83 },  // Violet
            { r: 0.29, g: 0, b: 0.51 },  // Indigo
            { r: 0, g: 0, b: 1 },        // Blue
            { r: 0, g: 1, b: 0 },        // Green
            { r: 1, g: 1, b: 0 },        // Yellow
            { r: 1, g: 0.5, b: 0 },      // Orange
            { r: 1, g: 0, b: 0 }         // Red
        ];

        timeline.current.to(patternProgressRef.current, {
            value: 50,
            duration: 1.5,
            ease: "linear",
            onUpdate: () => patternRef.current.regenerate({
                maxVertices: patternProgressRef.current.value,
                xPos: 0,
                yPos: 0,
                xFunctionCode: 0,
                yFunctionCode: 1,
                deltaAngle: 1.05,
                scale: 2,
                xAngularFreq: 1,
                yAngularFreq: 1,
                xPhase: 0,
                yPhase: 0,
                loopVertex: 1000,
                paramsToAdjust: [],
                adjustAmounts: []
            }),
        })
            .to({}, { duration: 1 })
            .addLabel("rotation")
            .to(patternProgressRef.current, {
                xAxis: 0,
                yAxis: 0,
                deltaAngle: 1,
                color: 0,
                duration: 0
            })
            .to(patternProgressRef.current, {
                xAxis: 3.1415 * 2,
                yAxis: 0,
                deltaAngle: 1,
                color: 12,
                duration: 6.2834,
                ease: "none",
                onUpdate: () => {
                    const currentColor = colors[Math.floor(patternProgressRef.current.color) % colors.length];
                    const nextColor = colors[Math.ceil(patternProgressRef.current.color) % colors.length];
                    const lerpFactor = patternProgressRef.current.color % 1;

                    const r = THREE.MathUtils.lerp(currentColor.r, nextColor.r, lerpFactor);
                    const g = THREE.MathUtils.lerp(currentColor.g, nextColor.g, lerpFactor);
                    const b = THREE.MathUtils.lerp(currentColor.b, nextColor.b, lerpFactor);

                    // Apply the color to the material
                    patternRef.current.updateMaterialColor(r, g, b);

                    patternRef.current.regenerate({
                        maxVertices: patternProgressRef.current.value,
                        xPos: 0,
                        yPos: 0,
                        xFunctionCode: 0,
                        yFunctionCode: 1,
                        deltaAngle: 1.05,
                        scale: 2,
                        xAngularFreq: 1,
                        yAngularFreq: 1,
                        xPhase: patternProgressRef.current.xAxis,
                        yPhase: patternProgressRef.current.yAxis,
                        loopVertex: 1000,
                        paramsToAdjust: [],
                        adjustAmounts: []
                    });
                    console.log("updating!!?? ", repeatRotationRef.current);
                    if (!repeatRotationRef.current) {
                        console.log("not yet");
                        gsap.to(timeline.current, {
                            timeScale: 3,
                            duration: 0.5,
                            ease: "sine.inOut"
                        });
                    }
                    timeline.current.timeScale(1);
                },
                onComplete: () => {
                    timeline.current.timeScale(1);
                    if (repeatRotationRef.current) {
                        console.log("not moving it");
                        timeline.current.seek("rotation");
                    } else {
                        console.log("movin on for good");
                    }
                }
            })
            .addLabel("test")
            // ASCII
            .to(asciiProgressRef.current, {
                frame: 1,
                duration: 2,
                ease: "none",
                onUpdate: () => {
                    timeline.current.timeScale(1);
                    asciiRef.current.updateFrame('animation1', asciiProgressRef.current.frame);
                }
            })
            .to({}, {
                duration: 0,
                onComplete: () => {
                    // Get the final color of the pattern right before shattering
                    const finalColorIndex = Math.floor(patternProgressRef.current.color % colors.length);
                    const finalColor = `rgb(${colors[finalColorIndex].r * 255}, ${colors[finalColorIndex].g * 255}, ${colors[finalColorIndex].b * 255})`;
                    particlesRef.current.simulateShatter(finalColor);
                }
            })
            .to(patternProgressRef.current, {
                value: 0,
                duration: 0,
                ease: "linear",
                onUpdate: () => patternRef.current.regenerate({
                    maxVertices: patternProgressRef.current.value,
                    xPos: 0,
                    yPos: 0,
                    xFunctionCode: 0,
                    yFunctionCode: 1,
                    deltaAngle: 1,
                    scale: 1,
                    xAngularFreq: 1,
                    yAngularFreq: 1,
                    xPhase: patternProgressRef.current.xAxis,
                    yPhase: patternProgressRef.current.yAxis,
                    loopVertex: 1000,
                    paramsToAdjust: [],
                    adjustAmounts: []
                })
            })
            .to({}, { duration: 1 })
            .to(asciiProgressRef.current, {
                frame: 3,
                duration: 2,
                ease: "none",
                onUpdate: () => {
                    asciiRef.current.updateFrame('animation1', asciiProgressRef.current.frame);
                }
            })

            .to(asciiProgressRef.current, {
                posX: -500,
                duration: 2,
                ease: "none",
                onUpdate: () => {
                    asciiRef.current.setMeshPosition(asciiProgressRef.current.posX, -200, asciiProgressRef.current.posZ);
                }
            })
            .to(patternProgressRef.current, {
                value: 1000,
                opacity: 0.8,
                duration: 4,
                ease: "linear",
                onUpdate() {
                    patternRef.current.regenerate({
                        maxVertices: patternProgressRef.current.value,
                        xPos: 0,
                        yPos: 0,
                        xFunctionCode: 0,
                        yFunctionCode: 1,
                        deltaAngle: 0.785398163,
                        scale: 1,
                        xAngularFreq: 1,
                        yAngularFreq: 1,
                        xPhase: 0,
                        yPhase: 0,
                        loopVertex: 1000,
                        paramsToAdjust: [],
                        adjustAmounts: []
                    });
                },
                onComplete() {
                    radialMenuRef.current.updateOrCreateMeshes({
                        numVertices: 1000,
                        deltaAngle: Math.PI / 8,
                        sections: 1,
                        numPerSection: 1,
                        opacity: patternProgressRef.current.opacity
                    }, [
                        { text: 'Pattern Factory', url: '/patternfactory' },
                        { text: 'About', url: '/about' },
                        { text: 'Contact', url: '/contact' },
                        { text: 'Thoughts', url: '/thoughts' }
                    ]);
                    setIsNotesVisible(true);
                }
            })
            .to(asciiProgressRef.current, {
                frame: 12,
                duration: 0.6,
                ease: "none",
                onUpdate: () => {
                    asciiRef.current.updateFrame('animation1', asciiProgressRef.current.frame);
                },
                onComplete: () => {
                    asciiRef.current.setMeshPosition(-250, 0, 0);
                }
            })
            .to({}, { onComplete: () => timeline.current.pause() }, "notes")
            .addLabel("notes")
            .to(asciiProgressRef.current, {
                frame: 0,
                posX: 0,
                posY: 0,
                posZ: 0,
                duration: 0,
            })
            .to(asciiProgressRef.current, {
                frame: 1,
                duration: 0.6,
                ease: "none",
                onUpdate: () => {
                    asciiRef.current.updateFrame('animation2', asciiProgressRef.current.frame);
                }
            });
    });

    useEffect(() => {
        const sharedCamera = cameraInstance.getCamera();
        patternRef.current = new Pattern(sharedCamera); // Instantiate the pattern
        asciiRef.current = new Ascii(asciiMountRef.current, sharedCamera, 'animation1', -220, -220, 0, 1920, 1080);
        particlesRef.current = new Particles(500, 0, 1000, 1000);// Instantiate the particle system
        radialMenuRef.current = new RadialMenu(radialMenuMountRef.current, sharedCamera);

        return () => {
            patternRef.current.cleanup();
            asciiRef.current.cleanup();
            particlesRef.current.cleanup();
            radialMenuRef.current.cleanup();
        };
    }, []);

    // DEBUG click handlers
    const handlePlay = () => timeline.current.play();

    const handlePause = () => timeline.current.pause();

    const handleRewind = () => timeline.current.seek(0);

    const handleResume = () => timeline.current.resume();

    const handleReverse = () => timeline.current.reverse();

    const handleSliderChange = (e) => {
        const sliderValue = e.target.value;
        const progress = sliderValue / 100;
        timeline.current.progress(progress).pause();
    };

    const handleProjectButtonClick = () => {
        repeatRotationRef.current = false;
    };

    const handleAboutMeButtonClick = () => {
        repeatRotationRef.current = false;
    };

    const handleStuffButtonClick = () => {
        repeatRotationRef.current = false;
    };

    const handleImStuffButtonClick = () => {
        repeatRotationRef.current = false;
    };

    return (
        <div className="home-page">
            <div className="ascii-container" ref={asciiMountRef} />
            <div className="radialmenu-container" ref={radialMenuMountRef} />
            <div className="progressBarContainer">
                <button className="progressBarButton" onClick={handlePlay} >Play</button>
                <button className="progressBarButton" onClick={handlePause}>Pause</button>
                <button className="progressBarButton" onClick={handleRewind}>Rewind</button>
                <button className="progressBarButton" onClick={handleResume}>Resume</button>
                <button className="progressBarButton" onClick={handleReverse}>Reverse</button>
                <button className="progressBarButton" onClick={handleProjectButtonClick}>Continue</button>
                <button className="progressBarButton" onClick={animate}>Set Pattern</button>
            </div>
            <div className="homepage-button-container">
                <button className="homepage-button" onClick={handleAboutMeButtonClick}>Who I am</button>
                <button className="homepage-button" onClick={handleProjectButtonClick}>Projects</button>
                <button className="homepage-button" onClick={handleStuffButtonClick}>Got Stuff to do</button>
                <button className="homepage-button" onClick={handleImStuffButtonClick}>I'm Stuff</button>
            </div>
        </div>
    );
};
export default Home;

