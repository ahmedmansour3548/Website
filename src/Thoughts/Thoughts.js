import React, { useState, useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { NavLink, Routes, Route, BrowserRouter as Router } from 'react-router-dom';
import './Thoughts.css';
import Notes from '../Notes/Notes';
import Effects, { generateRainbowColors, generatePathStep, createCustomBody, Effect } from '../utils/Effects';
import cameraInstance from '../utils/camera';
import Ascii from '../ASCII/Ascii';

export default function Thoughts() {
    const [isAnimating, setIsAnimating] = useState(false);
    const [isContentDisplayed, setIsContentDisplayed] = useState(false);
    const [trigger, setTrigger] = useState(false);
    const [notes, setNotes] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const lastMousePosition = useRef({ x: 0, y: 0 });
    const lastMouseTime = useRef(Date.now());
    const movementCount = useRef(0);
    const asciiMountRef = useRef(null);
    const asciiRef = useRef();
    const asciiProgressRef = useRef({
        frame: 0,
        posX: 0,
        posY: 0,
        posZ: 0,
    });

    useEffect(() => {
        const sharedCamera = cameraInstance.getCamera();
        asciiRef.current = new Ascii(asciiMountRef.current, sharedCamera, 'animation3', -300, 200, 0, 480, 270);

        return () => {
            asciiRef.current.cleanup();
        };
    }, []);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const response = await fetch('/notes.json');
                const fetchedNotes = await response.json();
                setNotes(fetchedNotes);
                setCurrentIndex(0);
            } catch (error) {
                console.error("Error fetching notes:", error);
            }
        };
        fetchNotes();
    }, []);

    useEffect(() => {
        if (notes.length > 0 && currentIndex >= 0 && currentIndex < notes.length) {
            thoughtAnimation(currentIndex);
        }
    }, [currentIndex, notes]);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
    };

    const goToNextNote = () => {
        setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, notes.length - 1));
    };

    const goToPreviousNote = () => {
        setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    };

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

    function mapFractionalPartToRange(fraction, min, max) {
        return min + fraction * (max - min);
    }

    function thoughtAnimation(index) {
        if (index < 0 || index >= notes.length) {
            return;
        }
        setTrigger(!trigger);

        api.start({
            x: 0,
            immediate: true, // Apply the reset immediately without animation
        });
        apiXPhase.start({
            xPhase: 0,
            immediate: true,
        });

        setTimeout(() => {
            api.start({
                x: Math.min(Math.max(notes[index].content.length, 500), 700),
                config: { duration: 2000 },
            });
        }, 10);

        setTimeout(() => {
            apiXPhase.start({
                xPhase: 10,
                loop: true,
                config: { duration: 2000 },
            });
        }, 10);

        const latitude = notes[index].created_latitude;
        var fractionalPart = latitude - Math.floor(latitude);
        const mappedLatitude = mapFractionalPartToRange(fractionalPart, 0.5, 10);

        setXAngularFreq(mappedLatitude);

        const longitude = notes[index].created_longitude;
        fractionalPart = longitude - Math.floor(longitude);
        const mappedLongitude = mapFractionalPartToRange(fractionalPart, 0.5, 10);

        setYAngularFreq(mappedLongitude);
    }

    const handleMouseMove = (e) => {
        const now = Date.now();
        const timeDiff = now - lastMouseTime.current;
        const dx = e.clientX - lastMousePosition.current.x;
        const dy = e.clientY - lastMousePosition.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = distance / timeDiff;

        if (speed > 0.5) { // Adjust speed threshold as needed
            movementCount.current++;
            if (movementCount.current >= 10) { // Adjust movement count threshold as needed
                goToNextNote();
                movementCount.current = 0;
            }
        } else {
            movementCount.current = 0;
        }

        lastMousePosition.current = { x: e.clientX, y: e.clientY };
        lastMouseTime.current = now;
    };

    useEffect(() => {
        const svgElement = document.querySelector('#brain');
        if (svgElement) {
            svgElement.addEventListener('mousemove', handleMouseMove);
        }
        return () => {
            if (svgElement) {
                svgElement.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, []);

    const [step, setStep] = useState(0); // Adjustable step variable
    const [time, setTime] = useState(0); // Time variable for sine wave modulation
    const [deltaAngle, setDeltaAngle] = useState(3); // Adjustable angle increment
    const [scale, setScale] = useState(0.1); // Adjustable scale factor multiplier
    const [xAngularFreq, setXAngularFreq] = useState(1);
    const [yAngularFreq, setYAngularFreq] = useState(1);
    const [xPhase, setXPhase] = useState(1);
    const [yPhase, setYPhase] = useState(1);

    var spiralPath = springProps.x.to(x => generatePathStep(x, springProps.originX.get(), springProps.originY.get(), 1, 0, deltaAngle, scale, xAngularFreq, yAngularFreq, propsXPhase.xPhase.get(), yPhase));
    const colorIndex = springProps.x.to(x => Math.round((x / 600) * (colors.length - 1))); // Calculate color index based on animation progress
    
    return (
        <>
            <div className="thoughts">
                <animated.svg
                    id="pattern"
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
                <div className="ascii-container" id="brain" ref={asciiMountRef} />
                <div className="thought-container">
                        {notes.length > 0 && currentIndex >= 0 && currentIndex < notes.length && (
                            <>
                                <h2 className="retro-title">{notes[currentIndex].title}</h2>
                                <p className="retro-content">{notes[currentIndex].content}</p>
                                <p className="retro-date">{formatDate(notes[currentIndex].created_at)}</p>
                            </>
                        )}
                </div>
                <div className="controls">
                    <button onClick={goToPreviousNote} disabled={currentIndex <= 0}>Previous</button>
                    <button onClick={goToNextNote} disabled={currentIndex >= notes.length - 1}>Next</button>
                    <p>{currentIndex}</p>
                </div>
            </div>

        </>
    );
}