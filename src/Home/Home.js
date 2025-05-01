// src/Home/Home.js
import './Home.css';
import React, { useState, useEffect, useRef } from 'react';
import Particles from '../utils/Particles';
import Pattern from '../utils/Pattern';
import RadialMenu from '../utils/RadialMenu';
import { gsap } from 'gsap';
import * as THREE from 'three';
import cameraInstance from '../utils/camera';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  // Three.js refs
  const sceneRef = useRef();
  const patternRef = useRef();
  const particlesRef = useRef();
  const radialMenuRef = useRef();
  const radialMenuMountRef = useRef();

  // State
  const [initialized, setInitialized] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);

  // GSAP timelines + queue
  const timelines = useRef({});
  const optionPending = useRef(null);

  // Pattern parameters
  const p = useRef({
    value: 0,
    xAxis: 0,
    yAxis: 0,
    deltaAngle: 0,
    opacity: 0
  });

  // read skip-entry flag once
  const skipEntry = useRef(
    sessionStorage.getItem('skipEntry') === 'true'
  );

  // Clear it so future loads behave normally
  useEffect(() => {
    if (skipEntry.current) {
      sessionStorage.removeItem('skipEntry');
    }
  }, []);

  // Save only primitives
  const savePatternState = () => {
    const { value, xAxis, yAxis, deltaAngle, opacity } = p.current;
    sessionStorage.setItem(
      'patternState',
      JSON.stringify({ value, xAxis, yAxis, deltaAngle, opacity })
    );
  };

  // Redraw helper
  const regen = () => {
    const pp = p.current;
    patternRef.current.regeneratePatternArea({
      maxVertices: pp.value,
      xPos: 0, yPos: 0,
      xFunctionCode: 0, yFunctionCode: 1,
      deltaAngle: pp.deltaAngle,
      scale: 2,
      xAngularFreq: 1, yAngularFreq: 1,
      xPhase: pp.xAxis, yPhase: pp.yAxis,
      loopVertex: 1000,
      paramsToAdjust: [], adjustAmounts: []
    });
    patternRef.current.material.opacity = pp.opacity;
  };

  // Build all the section timelines
  useEffect(() => {
    if (!initialized) return;

    // rainbow colors
    const colors = [
      { r:1, g:0,   b:0   },
      { r:1, g:0.5, b:0   },
      { r:1, g:1,   b:0   },
      { r:0, g:1,   b:0   },
      { r:0, g:0,   b:1   },
      { r:0.29,g:0, b:0.51},
      { r:0.58,g:0, b:0.83}
    ];
    const len = colors.length;

    // 1) ENTRY
    const entryTL = gsap.timeline({ paused: true });
    entryTL
      .to(p.current, {
        value: 50,
        duration: 1.5,
        ease: 'linear',
        onUpdate: regen
      })
      .to({}, {
        duration: 0.2,
        onComplete: () => {
          if (optionPending.current) {
            timelines.current[optionPending.current].play();
            setUiVisible(false);
          } else {
            timelines.current.rotation.play();
            fadeInButtons();
          }
        }
      });

    // 2) ROTATION + smooth color cycle
    const rotateTL = gsap.timeline({ repeat: -1, paused: true });
    rotateTL
      .to(p.current, {
        value: 50,
        opacity: 1,
        duration: 0
      })
      .to(p.current, {
        xAxis: '+=6.283185307', // 2π
        duration: 6.283185307,
        ease: 'none',
        onUpdate: () => {
          const frac = (p.current.xAxis % (2 * Math.PI)) / (2 * Math.PI);
          const idxF = frac * len;
          const i0 = Math.floor(idxF) % len;
          const i1 = (i0 + 1) % len;
          const t  = idxF - i0;
          const c0 = colors[i0], c1 = colors[i1];
          const r = THREE.MathUtils.lerp(c0.r, c1.r, t);
          const g = THREE.MathUtils.lerp(c0.g, c1.g, t);
          const b = THREE.MathUtils.lerp(c0.b, c1.b, t);
          patternRef.current.updateMaterialColor(r, g, b);
          regen();
        }
      });
    timelines.current.rotation = rotateTL;

    // 3) ABOUT
    const aboutTL = gsap.timeline({ paused: true })
      .to(p.current, { value:100, deltaAngle:1.1, duration:0.5, ease:'linear', onUpdate:regen })
      .to(p.current, { value:0, duration:0 })
      .to(p.current, {
        value:1000, opacity:0.8, duration:1, ease:'expo.inOut',
        onUpdate:regen,
        onComplete: () => navigate('/about')
      });
    timelines.current.about = aboutTL;

    // 4) PROJECTS
    const projectsTL = gsap.timeline({ paused: true })
      .to(p.current, { value:0, duration:0, onUpdate:regen })
      .call(() => {
        const frac = (p.current.xAxis % (2 * Math.PI)) / (2 * Math.PI);
        const idx = Math.floor(frac * len) % len;
        const fc = colors[idx];
        particlesRef.current.simulateShatter(
          `rgb(${fc.r*255},${fc.g*255},${fc.b*255})`
        );
      })
      .to({}, { duration:1 })
      .to(p.current, {
        value:1000, opacity:0, duration:0.5, ease:'linear', onUpdate:regen,
        onComplete: () => radialMenuRef.current.updateMeshes({ opacity:0 })
      })
      .to(p.current, { xRotation:-Math.PI/2.5, yPos:-500, duration:3, ease:'linear', onUpdate:regen })
      .to(p.current, {
        value:800, duration:1, ease:'linear', onUpdate:regen,
        onComplete: () => navigate('/projects')
      });
    timelines.current.projects = projectsTL;

    // 5) CONTACT
    const contactTL = gsap.timeline({ paused: true })
      .to(p.current, {
        value:200, deltaAngle:0.5, opacity:0.9, xAxis:0,
        duration:2, ease:'power2.inOut', onUpdate: regen
      })
      .to({}, {
        duration:2, ease:'power2.inOut',
        onUpdate() {
          const geom = patternRef.current.geometry;
          const arr = geom.attributes.color.array;
          const pr  = this.progress();
          for (let i=0; i<arr.length; i+=3) {
            arr[i]   += (1 - arr[i])   * pr;
            arr[i+1] += (1 - arr[i+1]) * pr;
            arr[i+2] += (1 - arr[i+2]) * pr;
          }
          geom.attributes.color.needsUpdate = true;
        },
        onComplete: () => {
          // tear down Home pattern before leaving
          patternRef.current.cleanup();
          savePatternState();
          navigate('/contact');
        }
      }, '<');
    timelines.current.contact = contactTL;

    // 6) MUSIC
    const musicTL = gsap.timeline({ paused: true })
      .to(p.current, {
        deltaAngle:0.4, xAxis:0, value:600,
        duration:0.5, ease:'linear', onUpdate: regen
      })
      .to(p.current, {
        value:550, deltaAngle:0.13, duration:2, ease:'linear', onUpdate: regen,
        onComplete: () => {
            savePatternState();
            navigate('/music');
        }
      });
    timelines.current.music = musicTL;

    // 7) WRITINGS
    const writingsTL = gsap.timeline({ paused: true })
      .to(p.current, {
        value:800, duration:2, ease:'linear', onUpdate: regen,
        onComplete: () => navigate('/writings')
      });
    timelines.current.writings = writingsTL;

    function fadeInButtons() {
      gsap.to('.homepage-button-container', {
        opacity: 1,
        duration: 0.2,
        ease: 'power2.out',
        delay: 0.3
      });
    }

    // decide entry or skip
    if (skipEntry.current) {
      timelines.current.rotation.play();
      fadeInButtons();
    } else {
      entryTL.play();
    }

    return () => {
      Object.values(timelines.current).forEach(tl => tl.kill && tl.kill());
    };
  }, [initialized, navigate]);

  // Initialize Three.js, Pattern, Particles & RadialMenu
  useEffect(() => {
    console.log("test");
    fetch('/menuData.json')
      .then(r => r.json())
      .then(data => {
        const scene  = new THREE.Scene();
        const camera = cameraInstance.getCamera();
        sceneRef.current = scene;

        // create Pattern
        patternRef.current = new Pattern(
          scene,
          camera,
          false,
          1,
          'home-pattern',
          0xff0000
        );
        // seed initial draw
        Object.assign(p.current, {
          value:0,
          deltaAngle:1.05,
          opacity:1,
          xAxis:0
        });

        particlesRef.current = new Particles();
        radialMenuRef.current = new RadialMenu(
          scene,
          radialMenuMountRef.current,
          camera,
          data.menu,
          mesh => {
            if (!timelines.current.rotation.isActive()) {
              optionPending.current = mesh.userData.timelineLabel;
            } else {
              timelines.current.rotation.pause();
              timelines.current[mesh.userData.timelineLabel].play();
              setUiVisible(false);
              gsap.to('.centered-text', { opacity: 0, duration: 0.5 });
            }
          }
        );

        setInitialized(true);
      })
      .catch(console.error);

    // ** cleanup on unmount of Home **
    return () => {
      if (patternRef.current) patternRef.current.cleanup();
      //if (particlesRef.current) particlesRef.current.cleanup();
      if (radialMenuRef.current) radialMenuRef.current.cleanup();
    };
  }, []);

  // clicks while spinning
  const handleClick = label => {
    if (!timelines.current.rotation.isActive()) {
      optionPending.current = label;
      setUiVisible(false);
      gsap.to('.centered-text', { opacity: 0, duration: 0.5 });
    } else {
      timelines.current.rotation.pause();
      setUiVisible(false);
      gsap.to('.centered-text', { opacity: 0, duration: 0.5 });
      timelines.current[label].play();
    }
  };

  return (
    <div className="home-page">
      <div className="particles-container" ref={particlesRef} />
      <div className="radialmenu-container" ref={radialMenuMountRef} />
      <div className="centered-text">
        Ahmed Mansour <span className="blinking-cursor">▮</span>
      </div>
      {uiVisible && (
        <div className="homepage-button-container" style={{ opacity: 0 }}>
          <button onClick={() => handleClick('about')}>Who I am</button>
          <button onClick={() => handleClick('projects')}>Projects</button>
          <button onClick={() => handleClick('contact')}>Contact</button>
          <button onClick={() => handleClick('music')}>Music</button>
          <button onClick={() => handleClick('writings')}>Writings</button>
        </div>
      )}
    </div>
  );
};

export default Home;
