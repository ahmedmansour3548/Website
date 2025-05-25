/* ========================================================== */
/* src/Home/Home.js                                        */
/* ========================================================== */
/*
 * © Ahmed Mansour 2025
 */

import { useState, useEffect, useRef, useContext } from 'react';
import { gsap } from 'gsap';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import Particles from '../utils/Particles';
import { PatternContext } from '../index';
import './Home.css';

/* ────────────────────────────────────────────────────────── */
/*  Component                                                 */
/* ────────────────────────────────────────────────────────── */
const Home = () => {
  const navigate = useNavigate();
  /* ──────────────────────────────── */
  /*  Refs / Singletons               */
  /* ──────────────────────────────── */
  const lastPatternColor = useRef(0xff0000);
  const hoverTween = useRef(null);
  const colorCycleEnabled = useRef(true);
  const particlesRef = useRef();
  const radialMenuMountRef = useRef();
  const colorTweenRef = useRef(null);
  const pulseTweenRef = useRef(null);
  
  
  const COLOR_MAP = {
    projects: 0xf94144,
    whoami: 0xf3722c,
    music: 0x577590,
    resume: 0x43aa8b,
    writings: 0x90be6d,
    contact: 0xf9c74f,
  };
  
  const FONT_LIST = [
    'Courier',
    'Ubuntu',
    'DOS',
    'Ground',
    'Montserrat',
    'Montserrat-Italic',
    'Novecento-Normal',
    'Peforma',
    'Eight-One',
    'Robot',
    'Twitch',
  ];

  const previousFontRef = useRef(FONT_LIST[0]);

  /* ──────────────────────────────── */
  /*  Context & Reactive state        */
  /* ──────────────────────────────── */
  const { pattern, styles } = useContext(PatternContext);
  const [currentFont, setCurrentFont] = useState(FONT_LIST[0]);
  const [displayName, setDisplayName] = useState('Ahmed Mansour');
  const fullName = 'Ahmed Mansour';

  const loadFont = (font) => document.fonts.load(`48px "${font}"`).then(() => font);

  const [initialized, setInitialized] = useState(false);
  const [uiVisible, setUiVisible] = useState(false);
  const timelines = useRef({});
  const optionPending = useRef(null);

  const p = useRef({
    value: 0,
    xAxis: 0,
    yAxis: 0,
    xPos: 0,
    yPos: 0,
    zPos: 0,
    deltaAngle: 0,
    opacity: 0,
    scale: 4,
  });

  /* ─────────────────────────────────────────────────────────── */
  /*  Initial page-enter / name-typing / font-cycling effects    */
  /* ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const overlay = document.querySelector('.about-transition-overlay');
    if (!overlay) return;
    gsap.to(overlay, { opacity: 0, duration: 0.5, onComplete: () => overlay.remove() });
  }, []);

  useEffect(() => {
    gsap.to(['.centered-text', '.blinking-cursor'], {
      opacity: 1,
      duration: 1,
      delay: 1,
      ease: 'power2.inOut',
    });
  }, []);

  useEffect(() => {
    const cycleFonts = async () => {
      await loadFont(FONT_LIST[0]);

      while (true) {
        await new Promise((res) => setTimeout(res, 5000));
        const availableFonts = FONT_LIST.filter((f) => f !== previousFontRef.current);
        const newFont = availableFonts[Math.floor(Math.random() * availableFonts.length)];
        await loadFont(newFont);

        for (let i = fullName.length; i >= 0; i--) {
          setDisplayName(fullName.slice(0, i));
          await new Promise((res) => setTimeout(res, 60 + Math.random() * 50));
        }

        setCurrentFont(newFont);
        previousFontRef.current = newFont;
        await new Promise((res) => setTimeout(res, 700));

        for (let i = 0; i <= fullName.length; i++) {
          setDisplayName(fullName.slice(0, i));
          await new Promise((res) => setTimeout(res, 100 + Math.random() * 50));
        }
      }
    };

    cycleFonts();
  }, []);

  /* ─────────────────────────────────────────────────────────── */
  /*  Pattern regenerate helper                                 */
  /* ─────────────────────────────────────────────────────────── */
  const regen = () => {
    const pp = p.current;
    pattern.regenerate({
      maxVertices: Math.max(1, Math.floor(pp.value)),
      xPos: pp.xPos,
      yPos: pp.yPos,
      zPos: pp.zPos,
      xFunctionCode: 0,
      yFunctionCode: 1,
      deltaAngle: pp.deltaAngle,
      scale: pp.scale,
      xAngularFreq: 1,
      yAngularFreq: 1,
      xPhase: pp.xAxis,
      yPhase: pp.yAxis,
      loopVertex: 1000,
      paramsToAdjust: [],
      adjustAmounts: [],
    });
    pattern.material.opacity = pp.opacity;
  };

  /* ─────────────────────────────────────────────────────────── */
  /*  Build timelines (entry, rotation, section transitions)    */
  /* ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!initialized || !pattern) return;

    pattern.setLineWidth(1).setStyle(styles.SOLID).setOpacity(1).setColor(0xff0000);

    /* Entry timeline (runs once) */
    const entryTL = gsap.timeline({ paused: true });
    entryTL
      .to(p.current, { value: 50, duration: 1.2, ease: 'linear', onUpdate: regen })
      .to(
        p.current,
        {
          deltaAngle: 1.05,
          opacity: 1,
          duration: 1,
          ease: 'none',
          onUpdate: regen,
          onComplete: () => {
            if (optionPending.current) {
              timelines.current[optionPending.current].play();
              setUiVisible(false);
            } else {
              timelines.current.rotation.play();
              fadeInButtons();
            }
          },
        },
      );

    /* Continuous rotation + color-cycle */
    const rotateTL = gsap.timeline({ repeat: -1, paused: true });
    const hueObj = { h: 0 };
    colorTweenRef.current = gsap.to(hueObj, {
      h: 1,
      duration: 6,
      ease: 'none',
      repeat: -1,
      paused: true,
      onUpdate: () => {
        if (!colorCycleEnabled.current) return;
        const mat = pattern.material;
        mat.vertexColors = false;
        mat.color.setHSL(hueObj.h, 1, 0.5);
        mat.needsUpdate = true;
      },
    });

    rotateTL.eventCallback('onStart', () => {
      colorTweenRef.current.play();
      if (!pulseTweenRef.current) {
        pulseTweenRef.current = gsap.to(pattern.material, {
          linewidth: 2,
          duration: 1,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          onUpdate: () => (pattern.material.needsUpdate = true),
        });
      }
    });

    rotateTL.to(p.current, {
      xAxis: '+=6.283185307',
      duration: 6.283185307,
      ease: 'none',
      onUpdate: () =>
        pattern.regenerate({
          maxVertices: Math.max(1, Math.floor(p.current.value)),
          xPos: p.current.xPos,
          yPos: p.current.yPos,
          zPos: p.current.zPos,
          deltaAngle: p.current.deltaAngle,
          scale: p.current.scale,
          xFunctionCode: 0,
          yFunctionCode: 1,
          xAngularFreq: 1,
          yAngularFreq: 1,
          xPhase: p.current.xAxis,
          yPhase: p.current.yAxis,
          loopVertex: 1000,
        }),
    });

    timelines.current.rotation = rotateTL;

    /* Section-specific timelines (About / Projects / Contact / Music / Writings) */
    const aboutTL = gsap
      .timeline({ paused: true })
      .to(p.current, { duration: 0, onComplete: () => rotateTL.pause() })
      .to(p.current, { value: 100, deltaAngle: 1.3, xAxis: 0, duration: 1, ease: 'power2.inOut', onUpdate: regen })
      .to(
        p.current,
        {
          zPos: 500,
          opacity: 0,
          duration: 1.1,
          ease: 'power4.inOut',
          onUpdate: regen,
          onComplete: () => navigate('/about'),
        },
      );
    timelines.current.about = aboutTL;

    const projectsTL = gsap
      .timeline({ paused: true })
      .to(p.current, { duration: 0, onComplete: () => rotateTL.pause() })
      .to(
        p.current,
        { value: 0, yPos: 70, deltaAngle: 2, xAxis: 0, scale: 2, duration: 1.5, ease: 'power2.inOut', onUpdate: regen },
      )
      .to(
        p.current,
        {
          opacity: 0,
          duration: 1.5,
          ease: 'linear',
          onUpdate: regen,
          onComplete: () => navigate('/projects'),
        },
        '<',
      );
    timelines.current.projects = projectsTL;

    const contactTL = gsap
      .timeline({ paused: true })
      .to(p.current, { value: 201, deltaAngle: 0.5, opacity: 0.9, xAxis: 0, scale: 2, duration: 2, ease: 'power2.inOut', onUpdate: regen })
      .to(
        {},
        {
          duration: 2,
          ease: 'power2.inOut',
          onUpdate() {
            pattern.transitionColors(0xff0000, 0xffffff, this.progress());
          },
          onComplete: () => navigate('/contact'),
        },
        '<',
      );
    timelines.current.contact = contactTL;

    const musicTL = gsap
      .timeline({ paused: true })
      .to(p.current, { duration: 0, onComplete: () => rotateTL.pause() })
      .to(p.current, { value: 1000, xAxis: 0, duration: 3, ease: 'power3.inOut', onUpdate: regen })
      .to(p.current, { scale: 1, duration: 3, ease: 'linear' }, '<')
      .to(p.current, { deltaAngle: 0.103, duration: 3, ease: 'back(0.2)' }, '<')
      .to(p.current, { duration: 0.5, onComplete: () => navigate('/music') });
    timelines.current.music = musicTL;

    const writingsTL = gsap
      .timeline({ paused: true })
      .to(p.current, { value: 800, duration: 2, ease: 'linear', onUpdate: regen, onComplete: () => navigate('/writings') });
    timelines.current.writings = writingsTL;

    entryTL.play();

    return () => {
      Object.values(timelines.current).forEach((tl) => tl.kill && tl.kill());
      pulseTweenRef.current && pulseTweenRef.current.kill();
    };
  }, [initialized, navigate]);

  const fadeInButtons = () => setUiVisible(true);

  useEffect(() => {
    if (uiVisible) {
      gsap.to('.home-category-tabs.home-bottom', { opacity: 1, duration: 0.2, ease: 'power2.out' });
    }
  }, [uiVisible]);

  /* ─────────────────────────────────────────────────────────── */
  /*  Hover-color transition helper                              */
  /* ─────────────────────────────────────────────────────────── */
  function transitionPatternColor(newColorHex) {
    if (!initialized) return;
    colorCycleEnabled.current = false;
    hoverTween.current && hoverTween.current.kill();

    pattern.material.vertexColors = true;
    const startColor = lastPatternColor.current;
    const anim = { t: 0 };

    hoverTween.current = gsap.to(anim, {
      t: 1,
      duration: 0.1,
      ease: 'power2.out',
      onUpdate: () => pattern.transitionColors(startColor, newColorHex, anim.t),
      onComplete: () => {
        lastPatternColor.current = newColorHex;
        hoverTween.current = null;
        const mat = pattern.material;
        mat.vertexColors = false;
        mat.color = new THREE.Color(newColorHex);
        mat.needsUpdate = true;
      },
    });
  }

  /* ─────────────────────────────────────────────────────────── */
  /*  Three-JS / particles bootstrap                             */
  /* ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    Object.assign(p.current, { value: 0, deltaAngle: 1.05, opacity: 1, xAxis: 0 });
    particlesRef.current = new Particles();
    setInitialized(true);
  }, []);

  /* ─────────────────────────────────────────────────────────── */
  /*  Main click handler                                         */
  /* ─────────────────────────────────────────────────────────── */
  const handleClick = (label,e)=>{
    /* Disable hovers & pulses right away */
    colorCycleEnabled.current=false;
    if(pulseTweenRef.current){pulseTweenRef.current.kill();pulseTweenRef.current=null;}
    pattern.material.linewidth=1;pattern.material.needsUpdate=true;

    /* stop new hovers */
    const tabsContainer=document.querySelector('.home-category-tabs');
    if(tabsContainer) tabsContainer.style.pointerEvents='none';

    const clickedBtn=e.currentTarget;
    clickedBtn.classList.add('clicked');

    if(label!=='resume'){
      timelines.current[label].play();
    }

    // delay center-text fade-out
    gsap.to('.centered-text',{opacity:0,duration:0.2});

    if(label==='projects'){
      gsap.utils.toArray('.home-tab').forEach(btn=>{
        const group=btn.getAttribute('data-group');
        let props={};
        if(group==='left')   props={x:'-150vw'};
        if(group==='middle') props={y:'150vh'};
        if(group==='right')  props={x:'150vw'};
        gsap.to(btn,{
          ...props,duration:0.6,ease:'power2.in',
          // hide UI after buttons complete animation
          onComplete:()=>{ setUiVisible(false); }
        });
      });
    }else{
      // fade out non-clicked 
      gsap.utils.toArray('.home-tab').forEach(btn=>{
        if(btn!==clickedBtn) gsap.to(btn,{opacity:0,duration:0.2,ease:'power1.out'});
      });
      // fade out clicked one
      gsap.to(clickedBtn,{
        opacity:0,duration:0.7,
        onComplete:()=>{
          // hide UI after fade finishes
          setUiVisible(false);
          if(label==='resume'){
            window.open('/assets/downloads/Resume-Ahmed-Mansour.pdf','_blank','noopener');
          }
        }
      });
    }
  };

  /* ──────────────────────────────────────────────────────── */
  /* Render JSX                                               */
  /* ──────────────────────────────────────────────────────── */
  return (
    <div className="home-page">
      <div className="particles-container" ref={particlesRef} />
      <div className="radialmenu-container" ref={radialMenuMountRef} />
      <div className="centered-text" style={{ fontFamily: `"${currentFont}"` }}>
        {displayName}
        <span className="blinking-cursor">▮</span>
      </div>

      {initialized && uiVisible && (
        <div className="home-category-tabs home-bottom" style={{ opacity: 0 }}>
          <button
            className="home-tab"
            style={{ '--tab-color': '#f94144' }}
            data-group="left"
            onClick={(e) => {
              optionPending.current = 'projects';
              handleClick('projects', e);
            }}
            onMouseEnter={() => {
              colorTweenRef.current.pause();
              transitionPatternColor(COLOR_MAP.projects);
              colorCycleEnabled.current = false;
            }}
          >
            Projects
          </button>

          <button
            className="home-tab"
            style={{ '--tab-color': '#f3722c' }}
            data-group="middle"
            onClick={(e) => {
              optionPending.current = 'about';
              handleClick('about', e);
            }}
            onMouseEnter={() => {
              colorTweenRef.current.pause();
              transitionPatternColor(COLOR_MAP.whoami);
              colorCycleEnabled.current = false;
            }}
          >
            Who Am I
          </button>

          <button
            className="home-tab"
            style={{ '--tab-color': '#577590' }}
            data-group="right"
            onClick={(e) => {
              optionPending.current = 'music';
              handleClick('music', e);
            }}
            onMouseEnter={() => {
              colorTweenRef.current.pause();
              transitionPatternColor(COLOR_MAP.music);
              colorCycleEnabled.current = false;
            }}
          >
            Music
          </button>

          <button
            className="home-tab"
            style={{ '--tab-color': '#43aa8b' }}
            data-group="left"
            onClick={() => {
              optionPending.current = 'resume';
              window.open('/assets/downloads/Resume-Ahmed-Mansour.pdf', '_blank', 'noopener');
            }}
            onMouseEnter={() => {
              colorTweenRef.current.pause();
              transitionPatternColor(COLOR_MAP.resume);
              colorCycleEnabled.current = false;
            }}
          >
            Resume
          </button>

          <button
            className="home-tab"
            style={{ '--tab-color': '#90be6d' }}
            data-group="middle"
            onMouseEnter={() => {
              colorTweenRef.current.pause();
              transitionPatternColor(COLOR_MAP.writings);
              colorCycleEnabled.current = false;
            }}
          >
            Writings
          </button>

          <button
            className="home-tab"
            style={{ '--tab-color': '#f9c74f' }}
            data-group="right"
            onClick={(e) => {
              optionPending.current = 'contact';
              handleClick('contact', e);
            }}
            onMouseEnter={() => {
              colorTweenRef.current.pause();
              transitionPatternColor(COLOR_MAP.contact);
              colorCycleEnabled.current = false;
            }}
          >
            Contact
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
