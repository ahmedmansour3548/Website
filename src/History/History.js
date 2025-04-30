import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import './History.css';

const History = () => {
    const [year, setYear] = useState(2024); // Initial year
    const [yearTexts, setYearTexts] = useState({});
    const [sliderValue, setSliderValue] = useState(2024);
    const canvasRef = useRef(null);
    const characterRef = useRef(null);
    const cameraRef = useRef(null);
    const sceneRef = useRef(null);
    const controlsRef = useRef(null);
    const [timer, setTimer] = useState(null);
    const lastUpdateTimeRef = useRef(null);
    const characterSpeed = useRef(0);

    useEffect(() => {
        // Load JSON data
        fetch('/about.json')
            .then(response => response.json())
            .then(data => setYearTexts(data))
            .catch(error => console.error('Error loading year texts:', error));
        
        initThreeJsScene();
        
        return () => {
            // Cleanup on component unmount
            if (controlsRef.current) controlsRef.current.dispose();
        };
    }, []);

    const updateCharacterSpeed = () => {
        const currentTime = performance.now();
        if (lastUpdateTimeRef.current) {
            const elapsedTime = currentTime - lastUpdateTimeRef.current;
            // Calculate character speed based on the change in slider value
            characterSpeed.current = Math.abs(year - sliderValue) / elapsedTime;
        }
        lastUpdateTimeRef.current = currentTime;
    };

    useEffect(() => {
        // Clear the existing timer when the slider value changes
        clearTimeout(timer);

        // Start a new timer
        const newTimer = setTimeout(() => {
            // Timer callback: Start character animation after the delay
            animateCharacter();
        }, 2000);

        // Update the timer state
        setTimer(newTimer);

        // Clear the timer when the component unmounts
        return () => {
            clearTimeout(newTimer);
        };
    }, [sliderValue]);

    const animateCharacter = () => {
        if (!characterRef.current || !cameraRef.current) return;
    
        const characterPosition = characterRef.current.position.x;
        const targetX = cameraRef.current.position.x; // Target position based on the slider value
    
        // Calculate easing factor (you can adjust the easing function as needed)
        const easingFactor = 0.01;
        const delta = (targetX - characterPosition);
        const newX = characterPosition + delta * easingFactor;
        // Update character position
        characterRef.current.position.x = newX;

        requestAnimationFrame(animateCharacter);
    };

    const initThreeJsScene = () => {
        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;
    
        // Check if canvas element already exists
        if (canvasRef.current.children.length === 0) {
            // Scene setup
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
            camera.position.set(0, 0, 100);
            cameraRef.current = camera;
    
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(width, height);
    
            canvasRef.current.appendChild(renderer.domElement);
    
            // Character setup
            const geometry = new THREE.PlaneGeometry(50, 100, 50);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const character = new THREE.Mesh(geometry, material);
            character.position.z = -5; // Ensure character is within view
            scene.add(character);
    
            // Parallax background
            const bgGeometry = new THREE.PlaneGeometry(50000, 5000);
            const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x242526 });
            const background = new THREE.Mesh(bgGeometry, bgMaterial);
            background.position.z = -1000; // Position the background behind the character
            scene.add(background);

            // Character setup
            const sphereGeometry = new THREE.SphereGeometry(50, 100, 50);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.z = -300;
            sphere.position.x = 400;
            scene.add(sphere);

            // Drag controls
            const controls = new DragControls([character], camera, renderer.domElement);
            controls.addEventListener('drag', (event) => {
                console.log('Dragging:', event.object.position);
            });

            controlsRef.current = controls;
            characterRef.current = character;
            sceneRef.current = scene;
    
            // Animation loop
            const animate = () => {
                requestAnimationFrame(animate);
                renderer.render(scene, camera);
            };
            animate();
        }
    };
    
    const handleTimelineDrag = (e) => {
        const newYear = parseInt(e.target.value);
        const newCameraPositionX = (newYear - 1999) * 20;
        setYear(newYear);
        setSliderValue(newYear);
        updateCharacterSpeed();
        cameraRef.current.position.x = newCameraPositionX;
    };
    
    return (
        <div className="about-page">
            <div className="text-section">
                <h1>About Me</h1>
                <p>{yearTexts[year]}</p>
            </div>
            <div className="timeline">
                <input 
                    type="range" 
                    min="1999" 
                    max="2024" 
                    value={year} 
                    onChange={handleTimelineDrag}
                    className="timeline-slider"
                />
            </div>
            <div className="threejs-container" ref={canvasRef} style={{ width: '100%', height: '300px' }}></div>
        </div>
    );
};

export default History;
