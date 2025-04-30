import './Home.css';
import React, { useState, useEffect, useRef } from 'react';
import Particles from '../utils/Particles';
import Pattern from '../utils/Pattern';
import RadialMenu from '../utils/RadialMenu';
import { gsap } from 'gsap';
import * as THREE from 'three';
import cameraInstance from '../utils/camera';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const sceneRef = useRef(null);
    const [currentMenu, setCurrentMenu] = useState([]);
    const [menuLoaded, setMenuLoaded] = useState(false); // State to track if menu data is loaded
    const [refsLoaded, setRefsLoaded] = useState(false); // State to track if refs are loaded
    const radialMenuMountRef = useRef(null);
    const patternRef = useRef();
    const particlesRef = useRef();
    const radialMenuRef = useRef();
    const radialMenuProgressRef = useRef({
        numVertices: 0,
        deltaAngle: Math.PI / 4,
        opacity: 0,
        sections: 1, // Number of divisions per triangle
        numPerSection: 1 // Number of extant triangles within each triangle
    });
    const patternProgressRef = useRef({
        value: 0,
        xAxis: 0,
        yAxis: 0,
        color: 0,
        deltaAngle: 0,
        opacity: 0,
        xRotation: 0,
        yRotation: 0,
        zRotation: 0
    });
    const timeline = useRef(gsap.timeline({
        paused: false,
    }));
    const repeatRotationRef = useRef(true);
    const [uiVisible, setuiVisible] = useState(true);
    const optionSelected = useRef("");
    const meshSelected = useRef(null); // This will store the currently selected mesh from the radial menu
    const textRef = useRef(null);
    const cursorRef = useRef(null);
    //
    //   █████╗ ███╗   ██╗██╗███╗   ███╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗███████╗
    //  ██╔══██╗████╗  ██║██║████╗ ████║██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
    //  ███████║██╔██╗ ██║██║██╔████╔██║███████║   ██║   ██║██║   ██║██╔██╗ ██║███████╗
    //  ██╔══██║██║╚██╗██║██║██║╚██╔╝██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║╚════██║
    //  ██║  ██║██║ ╚████║██║██║ ╚═╝ ██║██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║███████║
    //  ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
    //


    useEffect(() => {
        if (!patternRef.current || !particlesRef.current
            || !radialMenuMountRef.current || !radialMenuProgressRef.current) return;
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
            onUpdate: () => {
                if (patternRef.current) {
                    patternRef.current.regeneratePatternArea({
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
                    });
                }
            }
        })
            .to({}, {
                duration: 1, onComplete: () => {
                    // If button was already selected at this point, skip the spinning animation
                    if (optionSelected.current !== "")
                        timeline.current.seek(optionSelected.current);
                }
            }

            )
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

                    patternRef.current.regeneratePatternArea({
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

                    if (!repeatRotationRef.current) {
                        // Smoothly rise to 3x timeScale
                        gsap.to(timeline.current, {
                            timeScale: 5,
                            duration: 0.5, // Adjust the duration for the rise
                            ease: "linear",
                            onComplete: () => {
                                // Quickly and smoothly return to 1x timeScale
                                gsap.to(timeline.current, {
                                    timeScale: 1,
                                    duration: 0.5, // Adjust the duration for the return
                                    ease: "linear",
                                    onComplete: () => {
                                        console.log("Time scale animation complete");
                                        // Move on from this if statement
                                    }
                                });
                            }
                        });
                    }
                },
                onComplete: () => {
                    timeline.current.timeScale(1);
                    if (repeatRotationRef.current) {
                        timeline.current.seek("rotation");
                    }
                }
            })

            //  ████████╗██╗  ██╗███████╗    ███████╗ ██████╗ ██████╗ ██╗  ██╗
            //  ╚══██╔══╝██║  ██║██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██║ ██╔╝
            //     ██║   ███████║█████╗      █████╗  ██║   ██║██████╔╝█████╔╝ 
            //     ██║   ██╔══██║██╔══╝      ██╔══╝  ██║   ██║██╔══██╗██╔═██╗ 
            //     ██║   ██║  ██║███████╗    ██║     ╚██████╔╝██║  ██║██║  ██╗
            //     ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝

            .to({}, {
                duration: 1,
                onComplete: () => {
                    // Depending on the button selected, seek to the appropriate label
                    timeline.current.seek(optionSelected.current);
                }
            })

            // About Me
            .addLabel("AboutMe")
            .to(patternProgressRef.current, {
                value: 100,
                deltaAngle: 1.1,
                duration: 0.5,
                ease: "linear",
                onUpdate: () => {
                    patternRef.current.regeneratePatternArea({
                        maxVertices: patternProgressRef.current.value,
                        xPos: 0,
                        yPos: 0,
                        xFunctionCode: 0,
                        yFunctionCode: 1,
                        deltaAngle: patternProgressRef.current.deltaAngle,
                        scale: 2,
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
                    console.log("entered about me");
                    // Any additional logic after the animation completes
                }
            })
            .to(patternProgressRef.current, {}, {
                value: 0,
                duration: 0,
            })
            .to(patternProgressRef.current, {
                value: 1000,
                opacity: 0.8,
                duration: 1,
                ease: "expo.inOut",
                onUpdate() {
                    patternRef.current.regeneratePatternArea({
                        maxVertices: 100,
                        xPos: 0,
                        yPos: 0,
                        zPos: patternProgressRef.current.value,
                        xFunctionCode: 0,
                        yFunctionCode: 1,
                        deltaAngle: 1.1,
                        scale: 2,
                        xAngularFreq: 1,
                        yAngularFreq: 1,
                        xPhase: patternProgressRef.current.xAxis,
                        yPhase: patternProgressRef.current.yAxis,
                        loopVertex: 1000,
                        paramsToAdjust: [],
                        adjustAmounts: []
                    });
                },
                onComplete() {
                    // Send to About me page
                    window.location.href = "/about";
                }

            })
            .addLabel("Contact")
               // (tweak these props to your exact “contact‐ready” pattern state)
               .to(patternProgressRef.current, {
                 value: 200,
                 deltaAngle: 0.5,
                 opacity: 0.9,
                 duration: 1.5,
                 ease: "power2.inOut",
                 onUpdate() {
                   patternRef.current.regeneratePatternArea({
                    maxVertices: patternProgressRef.current.value,
                    xPos: 0,
                    yPos: 0,
                    zPos: patternProgressRef.current.value,
                    xFunctionCode: 0,
                    yFunctionCode: 1,
                     xPhase: patternProgressRef.current.xAxis,
                     yPhase: patternProgressRef.current.yAxis,
                     deltaAngle: patternProgressRef.current.deltaAngle,
                     opacity: patternProgressRef.current.opacity,
                     /* …other parameters… */
                   });
                 },
                 onComplete() {
                   // Save the pattern state so Contact can pick it up
                   const patternState = {
                    value: patternProgressRef.current.value,
                    xAxis: patternProgressRef.current.xAxis,
                    yAxis: patternProgressRef.current.yAxis,
                    deltaAngle: patternProgressRef.current.deltaAngle,
                    opacity: patternProgressRef.current.opacity
                  };
                   sessionStorage.setItem("patternState", JSON.stringify(patternState));
                   // Navigate once the transition finishes
                   navigate("/contact");
                 }
               })

            // Projects
            .addLabel("Projects")
            .to({}, { duration: 0 })
            .to(patternProgressRef.current, {
                value: 0,
                duration: 0,
                ease: "linear",
                onUpdate: () => patternRef.current.regeneratePatternArea({
                    maxVertices: patternProgressRef.current.value,
                    xPos: 0,
                    yPos: 0,
                    xFunctionCode: 0,
                    yFunctionCode: 1,
                    deltaAngle: patternProgressRef.current.deltaAngle,
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
            .to({}, {
                duration: 0,
                onComplete: () => {
                    console.log("entered projects");
                    timeline.current.timeScale(1);
                    // Get the final color of the pattern right before shattering
                    const finalColorIndex = Math.floor(patternProgressRef.current.color % colors.length);
                    const finalColor = `rgb(${colors[finalColorIndex].r * 255}, ${colors[finalColorIndex].g * 255}, ${colors[finalColorIndex].b * 255})`;
                    console.log("Final color for shatter:", finalColor); // Debug log
                    particlesRef.current.simulateShatter(finalColor);
                }
            })
            .to({}, { duration: 1 })
            .addLabel("CreateMeshes")
            .to(patternProgressRef.current, {
                value: 1000,
                opacity: 0,
                duration: 0.5,
                ease: "linear",
                onUpdate() {
                    patternRef.current.regeneratePatternArea({
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
                    console.log("generating clickable meshes");
                    radialMenuRef.current.updateMeshes({
                        numVertices: radialMenuProgressRef.current.numVertices,
                        deltaAngle: radialMenuProgressRef.current.deltaAngle,
                        sections: radialMenuProgressRef.current.sections,
                        numPerSection: radialMenuProgressRef.current.numPerSection,
                        opacity: radialMenuProgressRef.current.opacity
                    });
                }
            }).to(radialMenuProgressRef.current, {
                numVertices: 4,
                duration: 0,
                ease: "linear",
                onUpdate() {
                    console.log("updating Meshes");
                    radialMenuRef.current.updateMeshes({
                        numVertices: radialMenuProgressRef.current.numVertices,
                        deltaAngle: radialMenuProgressRef.current.deltaAngle,
                        sections: radialMenuProgressRef.current.sections,
                        numPerSection: radialMenuProgressRef.current.numPerSection,
                        opacity: 0
                    });
                },
            })
            .fromTo(radialMenuProgressRef.current,
                { opacity: 0 },
                {
                    opacity: 0.8, duration: 2, ease: "power4.inOut",
                    immediateRender: false,
                    onUpdate() {
                        console.log("updating radial menu ", radialMenuProgressRef.current.opacity);
                        radialMenuRef.current.updateMeshes({
                            numVertices: radialMenuProgressRef.current.numVertices,
                            deltaAngle: radialMenuProgressRef.current.deltaAngle,
                            sections: radialMenuProgressRef.current.sections,
                            numPerSection: radialMenuProgressRef.current.numPerSection,
                            opacity: radialMenuProgressRef.current.opacity
                        });
                    },
                    onComplete: () => timeline.current.pause()
                })

            // If Music is selected, animate the radialMenu's opacity being reduced to zero, and the pattern's numVerticies being reduced
            .addLabel("MusicMesh")
            // fade out the Radial Menu meshes
            .fromTo(radialMenuProgressRef.current,
                { opacity: 0.8 },
                {
                    opacity: 0,
                    duration: 1, ease: "power4.inOut",
                    immediateRender: false,
                    onUpdate() {
                        if (meshSelected.current && meshSelected.current.userData.timelineLabel === "MusicMesh") {
                        console.log("MusicMesh: updating radial menu ", meshSelected.current);
                        radialMenuRef.current.updateMeshes({
                            numVertices: radialMenuProgressRef.current.numVertices,
                            deltaAngle: radialMenuProgressRef.current.deltaAngle,
                            sections: radialMenuProgressRef.current.sections,
                            numPerSection: radialMenuProgressRef.current.numPerSection,
                            opacity: radialMenuProgressRef.current.opacity
                        });
                    }
                    },
                    onComplete: () => radialMenuRef.current.cleanup()
                })
                // Lower the pattern deltaAngle to make it more round
            .fromTo(patternProgressRef.current,
                { deltaAngle: 0.785398163, value: 1000 },
                {
                    deltaAngle: 0.13,
                    value: 1000,
                    duration: 3,
                    ease: "linear",
                    immediateRender: false,
                    onUpdate: () => {
                        if (meshSelected.current && meshSelected.current.userData.timelineLabel === "MusicMesh") {
                        console.log("pattern update", patternProgressRef.current.value);
                        patternRef.current.regeneratePatternArea({
                            maxVertices: patternProgressRef.current.value,
                            xPos: 0,
                            yPos: 0,
                            xFunctionCode: 0,
                            yFunctionCode: 1,
                            deltaAngle: patternProgressRef.current.deltaAngle,
                            scale: 1,
                            xAngularFreq: 1,
                            yAngularFreq: 1,
                            xPhase: patternProgressRef.current.xAxis,
                            yPhase: patternProgressRef.current.yAxis,
                            loopVertex: 1000,
                            paramsToAdjust: [],
                            adjustAmounts: []
                        });
                    }
                    },
                    onComplete: () => {
                        console.log("reached end");
                    },
                })
                // Reduce the vertice count of the pattern
            .fromTo(patternProgressRef.current,
                { value: 1000 },
                {
                    value: 800,
                    duration: 2,
                    ease: "linear",
                    immediateRender: false,
                    onUpdate: () => {
                        if (meshSelected.current && meshSelected.current.userData.timelineLabel === "MusicMesh") {
                        patternRef.current.regeneratePatternArea({
                            maxVertices: patternProgressRef.current.value,
                            xPos: 0,
                            yPos: 0,
                            xFunctionCode: 0,
                            yFunctionCode: 1,
                            deltaAngle: 0.13,
                            scale: 1,
                            xAngularFreq: 1,
                            yAngularFreq: 1,
                            xPhase: patternProgressRef.current.xAxis,
                            yPhase: patternProgressRef.current.yAxis,
                            loopVertex: 1000,
                            paramsToAdjust: [],
                            adjustAmounts: []
                        });
                    }
                    } ,
                    onComplete: () => {
                        const patternState = {
                          value: patternProgressRef.current.value,
                          xAxis: patternProgressRef.current.xAxis,
                          yAxis: patternProgressRef.current.yAxis,
                          deltaAngle: patternProgressRef.current.deltaAngle,
                          opacity: patternProgressRef.current.opacity
                        };
                        // Save in sessionStorage (or a global store)
                        sessionStorage.setItem("patternState", JSON.stringify(patternState));
                        //console.log("Pattern state saved:", patternState);
                        timeline.current.pause();
                        navigate("/music");
                      },
                })
            .addLabel("ProjectsMesh")
            // fade out the Radial Menu meshes
            .fromTo(radialMenuProgressRef.current,
                { opacity: 0.8 },
                {
                    opacity: 0,
                    duration: 1, ease: "power4.inOut",
                    immediateRender: false,
                    onUpdate() {
                        console.log("Projects mesh updating radial menu ", radialMenuProgressRef.current.opacity);
                        radialMenuRef.current.updateMeshes({
                            numVertices: radialMenuProgressRef.current.numVertices,
                            deltaAngle: radialMenuProgressRef.current.deltaAngle,
                            sections: radialMenuProgressRef.current.sections,
                            numPerSection: radialMenuProgressRef.current.numPerSection,
                            opacity: radialMenuProgressRef.current.opacity
                        });
                    },
                    onComplete: () => radialMenuRef.current.cleanup()
                })
                // Rotate the pattern to be on the ground
            .fromTo(patternProgressRef.current,
                {xRotation: 0, yPos: 0, value: 1000, deltaAngle: 0.785398163 },
                {
                    xRotation: -Math.PI/2.5,
                    yPos: -500,
                    value: 1000,
                    duration: 3,
                    ease: "linear",
                    immediateRender: false,
                    onUpdate: () => {
                        console.log("pattern update", patternProgressRef.current.value);
                        patternRef.current.regeneratePatternArea({
                            maxVertices: patternProgressRef.current.value,
                            xPos: 0,
                            yPos: patternProgressRef.current.yPos,
                            xFunctionCode: 0,
                            yFunctionCode: 1,
                            deltaAngle: patternProgressRef.current.deltaAngle,
                            scale: 1,
                            xAngularFreq: 1,
                            yAngularFreq: 1,
                            xPhase: patternProgressRef.current.xAxis,
                            yPhase: patternProgressRef.current.yAxis,
                            xRotation: patternProgressRef.current.xRotation,
                            loopVertex: 1000,
                            paramsToAdjust: [],
                            adjustAmounts: []
                        });
                    },
                    onComplete: () => {
                        console.log("reached end");
                    },
                })
                // Reduce the vertice count of the pattern
            .fromTo(patternProgressRef.current,
                { value: 1000 },
                {
                    value: 800,
                    duration: 1,
                    ease: "linear",
                    immediateRender: false,
                    onUpdate: () => patternRef.current.regeneratePatternArea({
                        maxVertices: patternProgressRef.current.value,
                        xPos: 0,
                        yPos: patternProgressRef.current.yPos,
                        xFunctionCode: 0,
                        yFunctionCode: 1,
                        deltaAngle: patternProgressRef.current.deltaAngle,
                        scale: 1,
                        xAngularFreq: 1,
                        yAngularFreq: 1,
                        xPhase: patternProgressRef.current.xAxis,
                        yPhase: patternProgressRef.current.yAxis,
                        xRotation: patternProgressRef.current.xRotation,
                        loopVertex: 1000,
                        paramsToAdjust: [],
                        adjustAmounts: []
                    }),
                    onComplete: () => {
                        const patternState = {
                          value: patternProgressRef.current.value,
                          xAxis: patternProgressRef.current.xAxis,
                          yAxis: patternProgressRef.current.yAxis,
                          deltaAngle: patternProgressRef.current.deltaAngle,
                          opacity: patternProgressRef.current.opacity
                        };
                        // Save in sessionStorage (or a global store)
                        sessionStorage.setItem("patternState", JSON.stringify(patternState));
                        //console.log("Pattern state saved:", patternState);
                        timeline.current.pause();
                        if (particlesRef.current) particlesRef.current.cleanup();
                        navigate("/projects");
                      },
                })
                
                    
            .addLabel("WritingsMesh")
            .fromTo(patternProgressRef.current,
                { value: 1000 },
                {
                    value: 800,
                    duration: 2,
                    ease: "linear",
                    immediateRender: false,
                    onUpdate: () => patternRef.current.regeneratePatternArea({
                        maxVertices: patternProgressRef.current.value,
                        xPos: 0,
                        yPos: patternProgressRef.current.yPos,
                        xFunctionCode: 0,
                        yFunctionCode: 1,
                        deltaAngle: patternProgressRef.current.deltaAngle,
                        scale: 1,
                        xAngularFreq: 1,
                        yAngularFreq: 1,
                        xPhase: patternProgressRef.current.xAxis,
                        yPhase: patternProgressRef.current.yAxis,
                        xRotation: patternProgressRef.current.xRotation,
                        loopVertex: 1000,
                        paramsToAdjust: [],
                        adjustAmounts: []
                    }),
                    onComplete: () => {
                        const patternState = {
                          value: patternProgressRef.current.value,
                          xAxis: patternProgressRef.current.xAxis,
                          yAxis: patternProgressRef.current.yAxis,
                          deltaAngle: patternProgressRef.current.deltaAngle,
                          opacity: patternProgressRef.current.opacity
                        };
                        // Save in sessionStorage (or a global store)
                        sessionStorage.setItem("patternState", JSON.stringify(patternState));
                        //console.log("Pattern state saved:", patternState);
                        timeline.current.pause();
                        if (particlesRef.current) particlesRef.current.cleanup();
                        navigate("/writings");
                      },
                })
            .addLabel("end")
            .to(patternProgressRef.current, {
                value: 0,
                duration: 1,
                ease: "linear",
                onUpdate: () => patternRef.current.regeneratePatternArea({
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
                }),
                onComplete: () => {
                    console.log("reached end");
                },
            });
    },
        [refsLoaded]);

    useEffect(() => {
        // Fetch the JSON data
        fetch('/menuData.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setCurrentMenu(data.menu);
                setMenuLoaded(true); // Set menuLoaded to true after data is fetched
            })
            .catch(error => console.error('Error fetching menu data:', error));
    }, []);


    useEffect(() => {
        if (menuLoaded) 
            {
                //document.getElementById('viewport').remove();
            // Create a single THREE.js scene for use all three effects
            sceneRef.current = new THREE.Scene();
            const sharedCamera = cameraInstance.getCamera();
            patternRef.current = new Pattern(sceneRef.current, sharedCamera, false, 1, "home-pattern", 0xFF0000); // Instantiate the pattern
            particlesRef.current = new Particles(500, 0, 1000, 1000); // Instantiate the particle system
            radialMenuRef.current = new RadialMenu(sceneRef.current, radialMenuMountRef.current, sharedCamera, currentMenu, handleMeshClick);

            // Refs loaded, all clear for launch
            setRefsLoaded(true);
            return () => {
                patternRef.current.cleanup();
                if (particlesRef.current) particlesRef.current.cleanup();
                radialMenuRef.current.cleanup();
            };
        }
    }, [menuLoaded]);

    // Callback that will be passed to the radial menu.
    const handleMeshClick = (mesh) => {
        // Save the clicked mesh's data.
        meshSelected.current = mesh; // Save the selected mesh for reference
        // setClickedMeshData({
        //   url: mesh.userData.url,
        //   label: mesh.userData.timelineLabel // We assume each mesh has a timeline label (e.g., "Mesh1", "Mesh2", etc.)
        // });
        // Instruct the timeline to play from the mesh’s label.
        if (timeline.current) {
            timeline.current.play(mesh.userData.timelineLabel);
        }
    };

    // const handleMeshClick = (mesh) => {
    //     if (mesh.userData.url === '#') {
    //         // console.log(mesh.geometry.attributes.position.array);
    //         // // Animate collapse to the clicked mesh's position
    //         // const targetVertices = Array.from(mesh.geometry.attributes.position.array);
    //         // const timeline = gsap.timeline();
    //         // const initialVertices = radialMenuRef.current.clickMeshes.map(clickMesh => {
    //         //     return Array.from(clickMesh.geometry.attributes.position.array);
    //         // });

    //         // radialMenuRef.current.clickMeshes.forEach((m, index) => {
    //         //     const vertices = m.geometry.attributes.position.array;
    //         //     timeline.to(vertices, {
    //         //         duration: 1,
    //         //         ease: "power2.inOut",
    //         //         onUpdate: () => {
    //         //             for (let i = 0; i < vertices.length; i++) {
    //         //                 vertices[i] = gsap.utils.interpolate(vertices[i], targetVertices[i], 0.1);
    //         //             }
    //         //             m.geometry.attributes.position.needsUpdate = true;
    //         //         }
    //         //     }, 0); // Start all animations at the same time
    //         // });

    //         // // After collapse, update the menu and expand new meshes
    //         // timeline.add(() => {
    //         //     console.log("added timeline");
    //         //     setCurrentMenu(mesh.userData.subMenu || []);
    //         //     radialMenuRef.current.updateMeshes({
    //         //         numVertices: radialMenuProgressRef.current.numVertices,
    //         //         deltaAngle: radialMenuProgressRef.current.deltaAngle,
    //         //         sections: radialMenuProgressRef.current.sections,
    //         //         numPerSection: radialMenuProgressRef.current.numPerSection,
    //         //         opacity: radialMenuProgressRef.current.opacity
    //         //     });

    //         //     // Animate re-expansion of the new meshes
    //         //     radialMenuRef.current.clickMeshes.forEach((m, index) => {
    //         //         const vertices = m.geometry.attributes.position.array;
    //         //         const initialVerts = initialVertices[index]; // Get the initial positions for this mesh
    //         //         timeline.to(vertices, {
    //         //             duration: 1,
    //         //             ease: "power2.inOut",
    //         //             onUpdate: () => {
    //         //                 for (let i = 0; i < vertices.length; i++) {
    //         //                     vertices[i] = gsap.utils.interpolate(targetVertices[i], initialVertices[i], 0.1);
    //         //                 }
    //         //                 m.geometry.attributes.position.needsUpdate = true;
    //         //             }
    //         //         });
    //         //     });
    //         // });
    //     } else {
    //         window.location.href = mesh.userData.url; // Navigate to the stored URL
    //     }
    //};

    const handleButtonClick = (callback) => {
        const textElement = textRef.current;
        const cursorElement = cursorRef.current;
        setuiVisible(false);

        // Animate the deletion of the text
        gsap.to(textElement, {
            duration: 2,
            ease: 'linear',
            onUpdate: () => {
                textElement.textContent = textElement.textContent.slice(0, -1);
            },
            onComplete: () => {
                // Remove the blinking cursor
                gsap.to(cursorElement, {
                    opacity: 0,
                    duration: 0.5,
                    ease: 'none'
                });
            }
        });

        setTimeout(() => {
            callback();
        }, 500); // Match this duration with the CSS transition duration
    };

    const handleProjectButtonClick = () => {
        handleButtonClick(() => {
            optionSelected.current = "Projects";
            repeatRotationRef.current = false;
        });

    };

    const handleAboutMeButtonClick = () => {
        handleButtonClick(() => {
            optionSelected.current = "AboutMe";
            repeatRotationRef.current = false;
        });
    };

    const handleContactButtonClick = () => {
        optionSelected.current = "Contact";
        repeatRotationRef.current = false;
        handleButtonClick(() => {
          // this kicks GSAP off from the “Contact” label
          timeline.current.play("Contact");
        });
      };

      const handleMusicButtonClick = () => {
        handleButtonClick(() => {
            window.location.href = "/music";
        });
    };

    return (
        <div className="home-page">

            <div className="particles-container" ref={particlesRef} />
            <div className="radialmenu-container" ref={radialMenuMountRef} />
            <div ref={textRef} className="centered-text">
                Ahmed Mansour
                <span ref={cursorRef} className="blinking-cursor">▮</span>
            </div>
            {uiVisible && (
                <div className="home-ui">
                    <div className="homepage-button-container">
                        <button className="homepage-button" onClick={handleAboutMeButtonClick}>Who I am</button>
                        <button className="homepage-button" onClick={handleProjectButtonClick}>Projects</button>
                        <button className="homepage-button" onClick={handleContactButtonClick}>Contact</button>
                        <button className="homepage-button" onClick={handleMusicButtonClick}>Music</button>
                    </div>
                </div>)}
        </div>
    );
};
export default Home;

