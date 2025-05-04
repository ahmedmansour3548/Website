// src/Contact/Contact.js
import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import Pattern from "../utils/Pattern";
import cameraInstance from "../utils/camera";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import "./Contact.css";

const Contact = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const patternRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const email = "contact@ahmedamansour.com";

  // will hold the restored incoming state
  const savedState = useRef();

  useEffect(() => {
    // 1) Restore pattern state from home
    const saved = JSON.parse(sessionStorage.getItem("patternState") || "null");
    const state = saved || {
      value: 100,
      xAxis: 0,
      yAxis: 0,
      deltaAngle: 1,
      opacity: 1
    };
    savedState.current = { ...state };

    // 2) Set up Three.js + Pattern
    const scene = new THREE.Scene();
    const camera = cameraInstance.getCamera();
    const pattern = new Pattern(
      scene,
      camera,
      true,            // transparent
      state.opacity,   // initial opacity
      "contact-pattern",
      0xffffff         // initial line color
    );

    // initialize the Pattern's internals
    Object.assign(pattern, {
      value: state.value,
      xAxis: state.xAxis,
      yAxis: state.yAxis,
      deltaAngle: state.deltaAngle,
      opacity: state.opacity
    });
    pattern.material.opacity = state.opacity;


    // ** Re-parent the canvas into our section container **
    // const canvas = pattern.renderer.domElement;
    // if (canvas.parentNode === document.body && containerRef.current) {
    //   document.body.removeChild(canvas);
    //   containerRef.current.insertBefore(canvas, containerRef.current.firstChild);
    // }

    patternRef.current = pattern;

    // 3) Subtle rotation loop
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

    // 4) Card fade-in
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
      pattern.cleanup();
    };
  }, []);

  const copyEmail = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const goBackHome = () => {
    const pattern = patternRef.current;
    
    sessionStorage.setItem('skipEntry','true');
    // hard-coded “home” target:
    const to = {
      value: 50,
      deltaAngle: 1.05,
      opacity: 1,
      xAxis: 0,
      yAxis: 0,
      scale: 4
    };
    patternRef.current.scale = 2;
    const backTL = gsap.timeline();
    // 1) Quick spring/fade‐out of the contact card
    backTL.to(".contact-card", {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: "back.in(1.7)"
    }, 0)
    .to(".back-home", {
      opacity: 0,
      scale: 0.8,
      duration: 0.3,
      ease: "back.in(1.7)"
  }, 0)
      .to(patternRef.current, {
        value: to.value,
        deltaAngle: to.deltaAngle,
        opacity: to.opacity,
        xAxis: to.xAxis,
        yAxis: to.yAxis,
        scale: to.scale,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          pattern.value     = patternRef.current.value;
          pattern.deltaAngle = patternRef.current.deltaAngle;
          pattern.opacity   = patternRef.current.opacity;
          pattern.xAxis     = patternRef.current.xAxis;
          pattern.yAxis     = patternRef.current.yAxis;
          pattern.material.opacity = patternRef.current.opacity;
          pattern.regeneratePatternArea({
            maxVertices: patternRef.current.value,
            xPos: 0, yPos: 0,
            xFunctionCode: 0, yFunctionCode: 1,
            deltaAngle: patternRef.current.deltaAngle,
            scale: patternRef.current.scale,
            xAngularFreq: 1,
            yAngularFreq: 1,
            xPhase: patternRef.current.xAxis,
            yPhase: patternRef.current.yAxis,
            loopVertex: 1000,
            paramsToAdjust: [],
            adjustAmounts: []
          });
        }
      }, 0)
      .to({}, {
        duration: 2,
        ease: "power2.inOut",
        onUpdate() {
          const geom = pattern.geometry;
          const arr  = geom.attributes.color.array;
          const pr   = this.progress();
          for (let i = 0; i < arr.length; i += 3) {
            arr[i]   += (1 - arr[i])   * pr; // R→1
            arr[i+1] += (0 - arr[i+1]) * pr; // G→0
            arr[i+2] += (0 - arr[i+2]) * pr; // B→0
          }
          geom.attributes.color.needsUpdate = true;
        },
        onComplete: () => {
          navigate("/");
        }
      }, 0);
  };

  return (
    <section className="contact-container" ref={containerRef}>
      <div className="contact-card">
        <h1>Contact Me</h1>
        <p>Reach me at:</p>
        <div className="contact-email">
          <code>{email}</code>
          <button onClick={copyEmail}>
            {copied ? "✔ Copied" : "Copy"}
          </button>
        </div>
      </div>
      <button className="back-home" onClick={goBackHome}></button>
    </section>
  );
};

export default Contact;
