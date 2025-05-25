import React, { useEffect, useRef, useContext } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { PatternContext } from '../index';
import './NotFound.css';

export default function NotFound() {
  const { pattern, styles } = useContext(PatternContext);
  const navigate = useNavigate();
  const uiRef = useRef(null);

  // geometry state used by Pattern.regenerate
  const p = useRef({
    value: 1800,
    deltaAngle: 1,
    scale: 4,
    phase: 0,
    xFunctionCode: 0,
    yFunctionCode: 1,
    xAngularFreq: 1,
  });

  useEffect(() => {
    if (!pattern) return;

    /* --- initial look --- */
    pattern
      .setLineWidth(2)
      .setStyle(styles.SOLID)
      .setColor(0x00d1ff)
      .setOpacity(0.9);

    /* --- animate expanding & color cycling --- */
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'none' } });

    // gentle radial “breathing”
    tl.to(p.current, {
      scale: 4,
      duration: 4,
      yoyo: true,
      repeat: -1,
      deltaAngle: 0.5,
      xFunctionCode: 20,
      xAngularFreq: 2,
      onUpdate: () => {
        pattern.regenerate({
          maxVertices: p.current.value,
          xPos: 0,
          yPos: 0,
          zPos: 0,
          xFunctionCode: 0,
          yFunctionCode: 12,
          deltaAngle: p.current.deltaAngle,
          scale: p.current.scale,
          xAngularFreq: p.current.xAngularFreq,
          yAngularFreq: 1,
          xPhase: 0,
          yPhase: 0
        });
      },
    });

    // continuous hue shift
    tl.to(pattern.material.color, {
      repeat: -1,
      duration: 8,
      onUpdate: () => {
        // shift hue manually (THREE.Color.setHSL)
        const hsl = {};
        pattern.material.color.getHSL(hsl);
        pattern.material.color.setHSL((hsl.h + 0.002) % 1, 1, 0.5);
      },
    }, 0);

    // slightly rotate the whole pattern forever
    gsap.to(p.current, {
      phase: `+=${Math.PI * 2}`,
      duration: 60,
      ease: 'none',
      repeat: -1,
    });

    return () => {
      tl.kill();
    };
  }, [pattern, styles]);

  /* ---- UI ---- */
  const goHome = () => navigate('/');

  return (
    <section className="nf-container" ref={uiRef}>
      <h1 className="nf-code">404</h1>
      <p className="nf-tagline">Looks like you drifted off-grid.</p>
      <button className="nf-home-btn" onClick={goHome}>
        Bring me home
      </button>
    </section>
  );
}
