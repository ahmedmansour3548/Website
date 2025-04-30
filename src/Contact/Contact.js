import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import Pattern from "../utils/Pattern";
import cameraInstance from "../utils/camera";
import * as THREE from "three";
import "./Contact.css";

const Contact = () => {
  const containerRef = useRef(null);
  const patternRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const email = "contact@ahmedamansour.com";

  useEffect(() => {
    // Restore pattern state
    const saved = JSON.parse(sessionStorage.getItem("patternState") || "null");
    const state = saved || { value: 100, xAxis: 0, yAxis: 0, deltaAngle: 1, opacity: 1 };

    // Setup Three.js pattern
    const scene = new THREE.Scene();
    const camera = cameraInstance.getCamera();
    const pattern = new Pattern(scene, camera, true, state.opacity, 'contact-pattern', 0xffffff);
    pattern.value = state.value;
    pattern.xAxis = state.xAxis;
    pattern.yAxis = state.yAxis;
    pattern.deltaAngle = state.deltaAngle;
    pattern.opacity = state.opacity;
    pattern.material.opacity = state.opacity;
    pattern.regeneratePatternArea({
      maxVertices: state.value,
      xPos: 0,
      yPos: 0,
      xFunctionCode: 0,
      yFunctionCode: 1,
      deltaAngle: state.deltaAngle,
      scale: 2,
      xAngularFreq: 1,
      yAngularFreq: 1,
      xPhase: state.xAxis,
      yPhase: state.yAxis,
      loopVertex: 1000,
      paramsToAdjust: [],
      adjustAmounts: []
    });
    patternRef.current = pattern;

    // Animate subtle rotation loop
    const tl = gsap.timeline({ repeat: -1, ease: "none" });
    tl.to(state, {
      xAxis: state.xAxis + Math.PI * 2,
      duration: 30,
      onUpdate: () => {
        pattern.xAxis = state.xAxis;
        pattern.regeneratePatternArea({
          maxVertices: state.value,
          xPos: 0,
          yPos: 0,
          xFunctionCode: 0,
          yFunctionCode: 1,
          deltaAngle: state.deltaAngle,
          scale: 2,
          xAngularFreq: 1,
          yAngularFreq: 1,
          xPhase: pattern.xAxis,
          yPhase: pattern.yAxis,
          loopVertex: 1000,
          paramsToAdjust: [],
          adjustAmounts: []
        });
      }
    });

    // Container fade & card entrance
    const ctx = gsap.context(() => {
      gsap.from(".contact-card", {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: "back.out(1.7)"
      });
    }, containerRef);

    return () => {
      tl.kill();
      ctx.revert();
      if (patternRef.current) patternRef.current.cleanup();
    };
  }, []);

  const copyEmail = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="contact-container" ref={containerRef}>
      <div className="contact-card">
        <h1>Contact Me</h1>
        <p>Reach me at:</p>
        <div className="contact-email">
          <code>{email}</code>
          <button onClick={copyEmail}>{copied ? "✔ Copied" : "Copy"}</button>
        </div>
      </div>
    </section>
  );
};

export default Contact;