import React, { useState, useEffect, useRef } from 'react';
import './About.css';
import Pattern from '../utils/Pattern';
import * as THREE from 'three';
import { gsap } from 'gsap';

const imageCount = 3; // Number of images
const imagePrefix = '/assets/photos/Me_'; // Image path prefix

const About = () => {
    const [currentImage, setCurrentImage] = useState(1);
    const [fade, setFade] = useState(true);
    const patternRef1 = useRef(null);
    const patternRef2 = useRef(null);
    const sceneRef = useRef(new THREE.Scene());

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setCurrentImage(prevImage => (prevImage % imageCount) + 1);
                setFade(true);
            }, 500); // Match this duration with the CSS transition duration
        }, 7000); // Change image every 7 seconds
        return () => clearInterval(interval);
    }, []);

    const handlePrevImage = () => {
        setFade(false);
        setTimeout(() => {
            setCurrentImage(prevImage => (prevImage === 1 ? imageCount : prevImage - 1));
            setFade(true);
        }, 500); // Match this duration with the CSS transition duration
    };

    const handleNextImage = () => {
        setFade(false);
        setTimeout(() => {
            setCurrentImage(prevImage => (prevImage % imageCount) + 1);
            setFade(true);
        }, 500); // Match this duration with the CSS transition duration
    };

    useEffect(() => {
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 500;
        patternRef1.current = new Pattern(sceneRef.current, camera, true, 0.2, 'about-pattern', 0x00ff00);
        patternRef2.current = new Pattern(sceneRef.current, camera, true, 0.2, 'about-pattern', 0xff0000);

        const params1 = {
            xFunctionCode: 0,
            yFunctionCode: 1,
            scale: 0.5,
            xPos: 220,
            yPos: 0,
            deltaAngle: 0.1,
            xAngularFreq: 1,
            yAngularFreq: 1,
            xPhase: -0.1,
            yPhase: 0,
            maxVertices: 1000,
            loopVertex: 1000,
            paramsToAdjust: [],
            adjustAmounts: []
        };

        const params2 = {
            ...params1
        };

        patternRef1.current.regeneratePatternArea(params1);
        patternRef2.current.regeneratePatternArea(params2);

        const updatePatternParams1 = () => {
            const newDeltaAngle = Math.random() * 2 + 0.1;
            gsap.to(params1, {
                deltaAngle: newDeltaAngle,
                duration: Math.random() * 10 + 30, // Adjust the duration for the smooth transition
                ease: "sine.inOut",
                onUpdate: () => {
                    patternRef1.current.regeneratePatternArea(params1);
                },
                onComplete: updatePatternParams1 // Repeat the process
            });
        };

        const updatePatternParams2 = () => {
            const newDeltaAngle = Math.random() * 2 + 0.1; // Offset in the random parameter
            gsap.to(params2, {
                deltaAngle: newDeltaAngle,
                duration: Math.random() * 10 + 30, // Adjust the duration for the smooth transition
                ease: "sine.inOut",
                onUpdate: () => {
                    patternRef2.current.regeneratePatternArea(params2);
                },
                onComplete: updatePatternParams2 // Repeat the process
            });
        };

        updatePatternParams1(); // Start the first transition
        updatePatternParams2(); // Start the second transition

        window.addEventListener('resize', patternRef1.current.onWindowResize.bind(patternRef1.current));
        window.addEventListener('resize', patternRef2.current.onWindowResize.bind(patternRef2.current));

        return () => {
            patternRef1.current.cleanup();
            patternRef2.current.cleanup();
            window.removeEventListener('resize', patternRef1.current.onWindowResize.bind(patternRef1.current));
            window.removeEventListener('resize', patternRef2.current.onWindowResize.bind(patternRef2.current));
        };
    }, []);

    return (
        <div className="about-container">
            <div className="image-container">
                <img src={`${imagePrefix}${currentImage}.JPG`} alt="Me" className={`about-image ${fade ? 'fade-in' : 'fade-out'}`} />
                <div className="arrow-container">
                    <button className="arrow left-arrow" onClick={handlePrevImage}>&#9664;</button>
                    <button className="arrow right-arrow" onClick={handleNextImage}>&#9654;</button>
                </div>
            </div>
            <div className="about-content">
                <h1 className="about-title">Who am I?</h1>
                <p className="about-description">
                    My name is Ahmed Mansour. 
                </p>
                <h1 className="about-title">What do you do?</h1>
                <p className="about-description">
                    A lot of things. I am a Software Engineer, a Computer Scientist, an XR Developer. I am a musician, a student of philosphy, and a creative. 
                    Above all else, I am someone who likes to think and who likes to learn. To me, there is no better way to understand something than to create it yourself.
                </p>
                <p className="about-description">
                    I have many interests, but they tend to revolve the themes of the mind, composition, and the phenomenological nature of reality and of the human experience.
                </p>
                <div className="about-graphics">
                    {/* Add your vector graphics or images here */}
                </div>
            </div>
        </div>
    );
};

export default About;