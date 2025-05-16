// src/Contact/Contact.js
import React, { useRef, useEffect, useState, useContext } from "react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import { PatternContext } from "../index";
import "./Contact.css";

export default function Contact() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const email = "contact@ahmedamansour.com";

  // get pattern instance and style presets from context
  const { pattern, styles } = useContext(PatternContext);

  // mirror of Home’s animation state
  const p = useRef({
    value: 200,
    xAxis: 0,
    yAxis: 0,
    deltaAngle: 0.5,
    opacity: 1,
    scale: 2
  });

  useEffect(() => {
    if (!pattern) return;

    // initial chain configuration and geometry
    pattern
      .setLineWidth(1)
      .setStyle(styles.SOLID)
      .setOpacity(1)
      .setColor(0xF9C74F);

    // rotation animation
    const rotationTL = gsap.to(p.current, {
      xAxis: `+=${Math.PI * 2}`,
      duration: 30,
      ease: "none",
      repeat: -1,
      onUpdate: () => {
        pattern.regenerate({
          maxVertices: p.current.value,
          xPos: 0,
          yPos: 0,
          zPos: 0,
          xFunctionCode: 0,
          yFunctionCode: 1,
          deltaAngle: p.current.deltaAngle,
          scale: p.current.scale,
          xAngularFreq: 1,
          yAngularFreq: 1,
          xPhase: p.current.xAxis,
          yPhase: p.current.yAxis
        });
      }
    });
    // pulse animation
   const pulseTL = gsap.to(pattern.material, {
     linewidth: 2,
     duration: 1,
     ease: "sine.inOut",
     yoyo: true,
     repeat: -1,
     onUpdate: () => {
       pattern.material.needsUpdate = true; // assure WebGL upload
     }
   });

    // GSAP context for UI fades
    const ctx = gsap.context(() => {
      gsap.from(".contact-back-home", { opacity: 0, duration: 0.6, ease: "power2.out", delay: 0.1 });
      gsap.from(".contact-card", { opacity: 0, scale: 0.8, duration: 0.8, ease: "back.out(1.7)", delay: 0.2 });
    }, containerRef);

    return () => {
      rotationTL.kill();
      pulseTL.kill();
      ctx.revert();
    };
  }, [pattern, styles]);

  const copyEmail = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const goBackHome = () => {
    if (!pattern) return;

    const backTL = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    backTL.to(".contact-card", { opacity: 0, scale: 0.8, duration: 0.3 }, 0)
      .to(".contact-back-home", { x: 15, duration: 0.15 }, 0)
      .to(".contact-back-home", { x: -200, duration: 0.5 }, 0.15)
      .to(".contact-back-home", { opacity: 0, duration: 0.5 }, 0)
      .to(p.current, {
        value: 0,
        opacity: 0,
        duration: 1,
        onUpdate() {
          pattern.material.opacity = p.current.opacity;
          pattern.regenerate({
            maxVertices: p.current.value,
            xPos: 0,
            yPos: 0,
            zPos: 0,
            xFunctionCode: 0,
            yFunctionCode: 1,
            deltaAngle: p.current.deltaAngle,
            scale: p.current.scale,
            xAngularFreq: 1,
            yAngularFreq: 1,
            xPhase: p.current.xAxis,
            yPhase: p.current.yAxis
          });
        }
      }, 0)
      .eventCallback("onComplete", () => navigate("/"));
  };

  return (
    <section className="contact-container" ref={containerRef}>
      <div className="contact-card">
        <h1>Contact</h1>
        <p>Reach me at:</p>
        <div className="contact-email">
          <code>{email}</code>
          <button onClick={copyEmail}>{copied ? "✔ Copied" : "Copy"}</button>
        </div>
      </div>
      <button className="contact-back-home" onClick={goBackHome}>
        <div className="contact-back-icon" aria-hidden="true" alt="Back home" />
        To Home
      </button>
    </section>
  );
}
