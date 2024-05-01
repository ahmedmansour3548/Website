import React, { useState, useEffect, useRef } from 'react';
import Pattern from './Pattern';
import Ascii from './Ascii';
import Particles from './Particles';
import RadialMenu from './RadialMenu';
import Notes from './Notes';
import { gsap } from 'gsap';
import * as THREE from 'three';
import cameraInstance from './utils/camera';
import { useAnimationControl } from './AnimationControlContext';
import './TimelineController.css';

const TimelineController = () => {
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
        opacity : 0
    });
    
    const asciiProgressRef = useRef({
        frame: 0,
        pos: 0
    });
    const radialMenuProgressRef = useRef();
    const timeline = useRef(gsap.timeline({
        paused: false,
    }));
    const { repeatRotation, toggleRepeatRotation } = useAnimationControl();
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
        const colors = [
            { r: 1, g: 0, b: 0 },       // Red
            { r: 1, g: 0.5, b: 0 },     // Orange
            { r: 1, g: 1, b: 0 },       // Yellow
            { r: 0, g: 1, b: 0 },       // Green
            { r: 0, g: 0, b: 1 },       // Blue
            { r: 0.29, g: 0, b: 0.51 }, // Indigo
            { r: 0.58, g: 0, b: 0.83 },  // Violet
            { r: 0.29, g: 0, b: 0.51 }, // Indigo
            { r: 0, g: 0, b: 1 },       // Blue
            { r: 0, g: 1, b: 0 },       // Green
            { r: 1, g: 1, b: 0 },       // Yellow
            { r: 1, g: 0.5, b: 0 },     // Orange
            { r: 1, g: 0, b: 0 }       // Red
        ];

        timeline.current.to(patternProgressRef.current, {
            value: 50,
            duration: 1.5,
            ease: "linear",
            onUpdate: () => patternRef.current.regeneratePatternArea({
                maxVertices: patternProgressRef.current.value,
                xPos: -340,
                yPos: 0,
                xFunctionCode: 0,
                yFunctionCode: 1,
                deltaAngle: 1.05,
                scale: 1,
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
                xAxis: 6.2834,
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

                    patternRef.current.regeneratePatternArea({
                        maxVertices: patternProgressRef.current.value,
                        xPos: -340,
                        yPos: 0,
                        xFunctionCode: 0,
                        yFunctionCode: 1,
                        deltaAngle: 1.05,
                        scale: 1,
                        xAngularFreq: 1,
                        yAngularFreq: 1,
                        xPhase: patternProgressRef.current.xAxis,
                        yPhase: patternProgressRef.current.yAxis,
                        loopVertex: 1000,
                        paramsToAdjust: [],
                        adjustAmounts: []
                    });
                },
                onComplete: () => {
                    if (repeatRotation.current) {
                        timeline.current.seek("rotation");
                    }
                }
            })
            .addLabel("clicked")

            // ASCII
            .to(asciiProgressRef.current, {
                frame: 1,
                duration: 2,
                ease: "none",
                onUpdate: () => {
                    asciiRef.current.updateFrame('animation1', asciiProgressRef.current.frame);
                }
            })
            .to({} , {
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
                onUpdate: () => patternRef.current.regeneratePatternArea({
                    maxVertices: patternProgressRef.current.value,
                    xPos: -340,
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
                pos: -500,
                duration: 2,
                ease: "none",
                onUpdate: () => {
                    asciiRef.current.translateMesh(asciiProgressRef.current.pos);
                }
            })
        .to(patternProgressRef.current, {
            value: 1000,
            opacity: 0.8,
            duration: 4,
            ease: "linear",
            onUpdate() {
                patternRef.current.regeneratePatternArea({
                    maxVertices: patternProgressRef.current.value,
                    xPos: -340,
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
                radialMenuRef.current.updateOrCreateMeshes({
                    numVertices: 1000,
                    deltaAngle: Math.PI / 8,
                    sections: 1,
                    numPerSection: 1,
                    opacity: patternProgressRef.current.opacity
                }, [
                    { text: 'Pattern Factory', url: '/patternfactory' },
                    { text: 'About', url: '/about' },
                    { text: 'Contact', url: '/contact' }
                ]);

            },
            onComplete() {
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
                    asciiRef.current.translateMesh(-250);
                }
            })
            .to({}, { onComplete: () => timeline.current.pause() }, "notes")
            .addLabel("notes")
            .to(asciiProgressRef.current, {
                frame: 0,
                pos: 0,
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
    };
    useEffect(() => {
        const sharedCamera = cameraInstance.getCamera();
        patternRef.current = new Pattern(sharedCamera); // Instantiate the pattern
        asciiRef.current = new Ascii(asciiMountRef.current, sharedCamera); // Instantiate the ascii
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

    const handleButtonClick = () => {
        timeline.current.seek("notes");
        toggleRepeatRotation();
    };

    return (
        <div className="timelineContainer">
            <div className="progressBarContainer">
                <button className="progressBarButton" onClick={handlePlay} >Play</button>
                <button className="progressBarButton" onClick={handlePause}>Pause</button>
                <button className="progressBarButton" onClick={handleRewind}>Rewind</button>
                <button className="progressBarButton" onClick={handleResume}>Resume</button>
                <button className="progressBarButton" onClick={handleReverse}>Reverse</button>
                <button className="progressBarButton" onClick={handleButtonClick}>Continue</button>
                <button className="progressBarButton" onClick={animate}>Set Pattern</button>
                
            </div>
            <div className="ascii-container" ref={asciiMountRef} />
            <div className="radialmenu-container" ref={radialMenuMountRef} />
            
        </div>
    );
};

export default TimelineController;
