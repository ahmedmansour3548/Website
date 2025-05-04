import "./Projects.css";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate }      from "react-router-dom";
import HexagonMenu3D        from "../utils/HexagonMenu3D";
import gsap                 from "gsap";
import * as THREE           from "three";
import Pattern              from "../utils/Pattern";
import cameraInstance       from "../utils/camera";

// Define per-page pattern settings
const PAGE_SETTINGS = [
  { deltaAngle: 0.2, xAxisLoop: false, rotationLoop: false },
  { deltaAngle: 0.3, xAxisLoop: true,  rotationLoop: true  },
  { deltaAngle: 0.5, xAxisLoop: false, rotationLoop: false },
  { deltaAngle: 1.0, xAxisLoop: true,  rotationLoop: false },
  { deltaAngle: 0.7, xAxisLoop: false, rotationLoop: false },
  { deltaAngle: 1.5, xAxisLoop: true,  rotationLoop: false }
];

const Projects = () => {
  const [categories, setCategories] = useState([]);
  const containerRef = useRef(null);
  const menu3DRef    = useRef(null);
  const patternRef   = useRef(null);
  const navigate     = useNavigate();

  const savedState = useRef({
    xAxis:      0,
    yAxis:      0,
    deltaAngle: 1,
    value:      1000,
    opacity:    1
  }).current;

  // Load categories
  useEffect(() => {
    fetch("/projects.json")
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories);
        gsap.set(".click-area", { opacity: 0 });
        gsap.to(".click-area", { opacity: 1, duration: 1, delay: 2.5 });
      })
      .catch(console.error);
  }, []);

  // Init Three.js + Pattern + Menu
  useEffect(() => {
    if (!containerRef.current || categories.length === 0) return;

    const scene  = new THREE.Scene();
    const camera = cameraInstance.getCamera();

    const pattern = new Pattern(
      scene,
      camera,
      /*transparent*/ true,
      savedState.opacity,
      "projects-pattern",
      0x00ffff
    );
    patternRef.current = pattern;

    function regenPattern(pageIndex, meshCount) {
      const setting = PAGE_SETTINGS[pageIndex % PAGE_SETTINGS.length];
      const newDA   = setting.deltaAngle;
      const newVal  = meshCount * 100;

      // reset loops
      gsap.killTweensOf(savedState, "xAxis");
      savedState.xAxis = 0;
      gsap.killTweensOf(pattern.group.rotation, "z");
      pattern.group.rotation.z = 0;

      // tween
      gsap.to(savedState, {
        duration: 0.6,
        ease: "power2.inOut",
        deltaAngle: newDA,
        value:      newVal,
        onUpdate: () => {
          pattern.regeneratePatternArea({
            maxVertices:   Math.round(savedState.value),
            xPos:          0,
            yPos:          savedState.yAxis,
            xFunctionCode: 0,
            yFunctionCode: 1,
            deltaAngle:    savedState.deltaAngle,
            scale:         2,
            xAngularFreq:  1,
            yAngularFreq:  1,
            xPhase:        savedState.xAxis,
            yPhase:        savedState.yAxis,
            zPos:          0
          });
        },
        onComplete: () => {
          if (setting.xAxisLoop) {
            gsap.to(savedState, {
              xAxis: "+=" + (Math.PI * 2),
              duration: 20,
              ease: "none",
              repeat: -1,
              onUpdate: () => {
                pattern.regeneratePatternArea({ /* same params */ });
              }
            });
          }
          if (setting.rotationLoop) {
            gsap.killTweensOf(pattern.group.rotation, "z");
            gsap.to(pattern.group.rotation, {
              z: "+=" + (Math.PI * 2),
              duration: 20,
              ease: "power2.inOut",
              repeat: -1
            });
          }
        }
      });
    }

    regenPattern(0, categories[0].projects.length);

    const menu = new HexagonMenu3D(
      containerRef.current,
      categories,
      navigate
    );
    menu.onPageChange = regenPattern;
    menu3DRef.current = menu;

    return () => {
      pattern.cleanup();
      menu.dispose();
    };
  }, [categories, navigate]);

  // Fade away black overlay on mount (after navigate)
  useEffect(() => {
    const ov = document.querySelector(".mesh-cover-overlay");
    if (ov) {
      gsap.to(ov, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => ov.remove()
      });
    }
  }, []);

  return (
    <div className="projects-page">
      <div className="black-overlay"></div>
      <div id="projects-pattern" className="pattern-container"></div>
      <div className="projects-container" ref={containerRef}></div>
      <div id="center-text-box" className="center-text-box"></div>
      <div className="click-area left"  onClick={() => menu3DRef.current?.slideLeft()}><span className="arrow">←</span></div>
      <div className="click-area right" onClick={() => menu3DRef.current?.slideRight()}><span className="arrow">→</span></div>
    </div>
  );
};

export default Projects;
