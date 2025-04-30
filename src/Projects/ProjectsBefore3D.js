import './Projects.css';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

/* 🛠️ Adjustable Variables */
const HEX_RADIUS = 250;  // Distance from center to images
const IMAGE_SIZE = 120;  // Image width and height
const HEX_SPACING = 1.1; // Spacing multiplier

// Hexagonal positioning offsets (relative to center)
const HEX_POSITIONS = [
    { x: 0, y: -1 }, // Top
    { x: Math.sqrt(3) / 2, y: -0.5 },  // Top-right
    { x: Math.sqrt(3) / 2, y: 0.5 },   // Bottom-right
    { x: 0, y: 1 },   // Bottom
    { x: -Math.sqrt(3) / 2, y: 0.5 },  // Bottom-left
    { x: -Math.sqrt(3) / 2, y: -0.5 }  // Top-left
];

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [hoveredProject, setHoveredProject] = useState(null);
    const navigate = useNavigate();
    const hexRefs = useRef([]);

    useEffect(() => {
        fetch('/projects.json')
            .then(response => response.json())
            .then(data => {
                console.log("Fetched projects:", data);
                const allProjects = data.categories.flatMap(category =>
                    category.projects.map(project => ({
                        id: project.id,
                        title: project.title,
                        link: project.link,
                        photo: project.headerPhoto,
                    }))
                );
                setProjects(allProjects.slice(0, 6)); // Use 6 for a perfect hexagon
            })
            .catch(error => console.error('Error fetching projects:', error));
    }, []);

    // 🌀 GSAP Animation (Tilt, Float, and Scale)
    useEffect(() => {
        if (hexRefs.current.length === 0) return;

        // Tilt Animation: Sway right 15°, center, left 15°, then center.
        // This timeline loops infinitely.
        const tiltTimeline = gsap.timeline({ repeat: -1, ease: "sine.inOut" });
        tiltTimeline
            .to(hexRefs.current, { rotation: 15, duration: 5, stagger: 0.1 })
            .to(hexRefs.current, { rotation: 0, duration: 8, stagger: 0.1 })
            .to(hexRefs.current, { rotation: -15, duration: 6, stagger: 0.1 })
            .to(hexRefs.current, { rotation: 0, duration: 9, stagger: 0.1 });

        // Floating Effect: Each moves up and down slightly.
        hexRefs.current.forEach((el, index) => {
            gsap.to(el, {
                y: `+=${10 * (index % 2 === 0 ? 1 : -1)}`,
                duration: 2,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut",
            });
        });

        // Scaling Wave: Images pulse smoothly.
        gsap.to(hexRefs.current, {
            scale: 1.1,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.2,
        });
    }, [projects]);

    // 🎡 Random Spin Animation
    useEffect(() => {
        if (hexRefs.current.length === 0) return;

        const doRandomSpin = () => {
            const numImages = hexRefs.current.length;
            if (numImages === 0) return;
            // Choose a random image index.
            const randomIndex = Math.floor(Math.random() * numImages);
            const el = hexRefs.current[randomIndex];
            // Randomly choose between a 360° or 720° spin.
            const spinDegrees = Math.random() < 0.5 ? 360 : 720;
            gsap.to(el, {
                rotation: `+=${spinDegrees}`,
                duration: 2,
                ease: "power2.inOut",
                overwrite: "auto", // Temporarily override the tilt animation
                onComplete: () => {
                    // After the spin, wait a random interval (5-10 seconds) and then do another spin.
                    gsap.delayedCall(Math.random() * 5 + 5, doRandomSpin);
                },
            });
        };

        // Start the first random spin after a random delay between 5-10 seconds.
        gsap.delayedCall(Math.random() * 5 + 5, doRandomSpin);
    }, [projects]);

    // Click handler: on click, make all images fall, then redirect.
    const handleClick = (link) => {
        // Kill or override any existing tweens on these elements.
        gsap.killTweensOf(hexRefs.current);
        // Animate all images to fall off the bottom of the screen.
        gsap.to(hexRefs.current, {
            y: `+=${window.innerHeight + 200}`,  // Move them downward beyond the viewport.
            duration: 1.5,
            ease: "power4.in",
            overwrite: true,
        });
        // After a delay, navigate to the link.
        setTimeout(() => {
            navigate(link);
        }, 1500);
    };

    return (
        <div className="project-page">
            <div className="project-container">
                {/* Center Text */}
                <div className="center-text">
                    {hoveredProject ? hoveredProject.title : "Hover over a project"}
                </div>

                {/* Hexagonal Images with GSAP Refs */}
                {projects.map((project, index) => {
                    const { x, y } = HEX_POSITIONS[index];
                    return (
                        <div
                            key={project.id}
                            className="project-image"
                            ref={(el) => (hexRefs.current[index] = el)}
                            onMouseEnter={() => setHoveredProject(project)}
                            onMouseLeave={() => setHoveredProject(null)}
                            onClick={() => handleClick(project.link)}
                            style={{
                                backgroundImage: `url(${project.photo})`,
                                width: `${IMAGE_SIZE}px`,
                                height: `${IMAGE_SIZE}px`,
                                transform: `translate(${x * HEX_RADIUS * HEX_SPACING}px, ${y * HEX_RADIUS * HEX_SPACING}px)`,
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Projects;
