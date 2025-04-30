// src/Projects/Projects.js
import "./Projects.css";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import HexagonMenu3D from "../utils/HexagonMenu3D";
import gsap from "gsap";
import * as THREE from 'three';
import Pattern from '../utils/Pattern';
import cameraInstance from '../utils/camera';
const Projects = () => {
  // Instead of storing a flat projects array, we store the full categories array.
  const [categories, setCategories] = useState([]);
  const containerRef = useRef(null);
  const menu3DRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const sceneRef = useRef(null);
  const patternRef = useRef();
const patternProgressRef = useRef({
  xRotation: 0,
  yPos: 0,
  value: 1000,
  deltaAngle: 0.785398163,
  xAxis: 0, // Set these if needed
  yAxis: 0  // Set these if needed
    });
  useEffect(() => {
    fetch("/projects.json")
      .then((response) => response.json())
      .then((data) => {
        // Set the state to the array of categories.
        setCategories(data.categories);
        gsap.set(".click-area", { opacity: 0 });
        gsap.to(".click-area", { opacity: 1, duration: 1, delay: 2.5 });
      })
      .catch((error) => console.error("Error fetching projects:", error));
  }, []);

  useEffect(() => {
    if (categories.length > 0 && containerRef.current) {
      // Pass the full category data to HexagonMenu3D.
      menu3DRef.current = new HexagonMenu3D(
        containerRef.current,
        categories,
        navigate
      );
      sceneRef.current = new THREE.Scene();
      const sharedCamera = cameraInstance.getCamera();
      //patternRef.current = new Pattern(sceneRef.current, sharedCamera, false, 1, "projects-pattern", 0xFF0000);
          
          
          // // Animate the pattern into its final state so that it matches the home page.
          // gsap.fromTo(
          //   patternProgressRef.current,
          //   { xRotation: 0, yPos: 0, value: 1000, deltaAngle: 0.785398163 },
          //   {
          //     xRotation: -Math.PI / 2.5,
          //     yPos: -500,
          //     value: 1000, // value remains the same if that’s desired
          //     duration: 0,
          //     ease: "linear",
          //     immediateRender: false,
          //     onUpdate: () => {
          //       // Regenerate the pattern with the current tween values.
          //       patternRef.current.regeneratePatternArea({
          //         maxVertices: patternProgressRef.current.value,
          //         xPos: 0,
          //         yPos: patternProgressRef.current.yPos,
          //         xFunctionCode: 0,
          //         yFunctionCode: 1,
          //         deltaAngle: patternProgressRef.current.deltaAngle,
          //         scale: 1,
          //         xAngularFreq: 1,
          //         yAngularFreq: 1,
          //         xPhase: patternProgressRef.current.xAxis,
          //         yPhase: patternProgressRef.current.yAxis,
          //         xRotation: patternProgressRef.current.xRotation,
          //         loopVertex: 1000,
          //         paramsToAdjust: [],
          //         adjustAmounts: []
          //       });
          //     },
          //     onComplete: () => {
          //       console.log("Pattern animation complete");
          //       // At this point, the pattern is in the final state (i.e. rotated and lowered to the ground)
          //     }
          //   }
          // );
    }
  });

  // Fade out the black overlay on mount.
  useEffect(() => {
    gsap.to(".black-overlay", {
      opacity: 0,
      duration: 0.5,
      ease: "power4.inOut",
      onComplete: () => {
        const overlay = document.querySelector(".black-overlay");
        if (overlay) overlay.parentNode.removeChild(overlay);
      },
    });
  }, []);

  const handleRotateLeft = () => {
    if (menu3DRef.current) {
      menu3DRef.current.slideLeft();
    }
  };

  const handleRotateRight = () => {
    if (menu3DRef.current) {
      menu3DRef.current.slideRight();
    }
  };

  return (
    <div className="project-page">
      {/* Black overlay to fade out on page load */}
      <div className="black-overlay"></div>
      
      <div
        className="project-container"
        ref={containerRef}
        style={{ width: "100%", height: "100vh" }}
      ></div>
      {/* Center text box for hovered project title */}
      <div id="center-text-box" className="center-text-box"></div>
      {/* Clickable areas on left and right sides */}
      <div className="click-area left" onClick={handleRotateLeft}>
        <span className="arrow">&larr;</span>
      </div>
      <div className="click-area right" onClick={handleRotateRight}>
        <span className="arrow">&rarr;</span>
      </div>
    </div>
  );
};

export default Projects;
