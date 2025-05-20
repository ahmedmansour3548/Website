// src/Home/Home.js
import './Home.css';
import { useState, useEffect, useRef, useContext } from 'react';
import { gsap } from 'gsap';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import Particles from '../utils/Particles';
import { PatternContext } from '../index';

const Home = () => {
  const navigate = useNavigate();
  const { pattern, styles } = useContext(PatternContext);
  const lastPatternColor = useRef(0xff0000);
  const hoverTween = useRef(null);
  const colorCycleEnabled = useRef(true);
  // Three.js refs handled by PatternProvider
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
    'Twitch'
  ];
  
  const [currentFont, setCurrentFont] = useState(FONT_LIST[0]);
  const [displayName, setDisplayName] = useState('Ahmed Mansour');
  const previousFontRef = useRef(FONT_LIST[0]);
  const fullName = 'Ahmed Mansour';

  const loadFont = (font) =>
    document.fonts.load(`48px "${font}"`).then(() => font);


  // State and GSAP timeline refs
  const [initialized, setInitialized] = useState(false);
  const [uiVisible, setUiVisible] = useState(false);
  const timelines = useRef({});
  const optionPending = useRef(null);
  // Pattern parameters
  const p = useRef({
    value: 0,
    xAxis: 0,
    yAxis: 0,
    xPos: 0,
    yPos: 0,
    zPos: 0,
    deltaAngle: 0,
    opacity: 0,
    scale: 4
  });


  useEffect(() => {
    // once Home mounts, fade out & remove the nav overlay
    const overlay = document.querySelector('.about-transition-overlay');
    if (!overlay) return;
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => overlay.remove()
    });
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
      // Initial load
      await loadFont(FONT_LIST[0]);

      while (true) {
        await new Promise((res) => setTimeout(res, 5000));

        // Pick a different font
        const availableFonts = FONT_LIST.filter((f) => f !== previousFontRef.current);
        const newFont = availableFonts[Math.floor(Math.random() * availableFonts.length)];

        await loadFont(newFont);

        // Delete text
        for (let i = fullName.length; i >= 0; i--) {
          setDisplayName(fullName.slice(0, i));
          await new Promise((res) => setTimeout(res, 60 + Math.random() * 50));
        }

        // Update current font after deletion
        setCurrentFont(newFont);
        previousFontRef.current = newFont;

        await new Promise((res) => setTimeout(res, 700));

        // Type in new text
        for (let i = 0; i <= fullName.length; i++) {
          setDisplayName(fullName.slice(0, i));
          await new Promise((res) => setTimeout(res, 100 + Math.random() * 50));
        }
      }
    };

    cycleFonts();
  }, []);

  // regen helper
  const regen = () => {
    const pp = p.current;
    const safeValue = Math.max(1, Math.floor(pp.value));
    pattern.regenerate({
      maxVertices: safeValue,
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
      adjustAmounts: []
    });
    pattern.material.opacity = pp.opacity;
  };

  // build section timelines
  useEffect(() => {
    if (!initialized || !pattern) return;
    pattern
      .setLineWidth(1)
      .setStyle(styles.SOLID)
      .setOpacity(1)
      .setColor(0xFF0000);


    // 1) ENTRY
    const entryTL = gsap.timeline({ paused: true });
    entryTL
      .to(p.current, { value: 50, duration: 1.2, ease: 'linear',
        onUpdate: regen
      })
      .to(p.current, { deltaAngle: 1.05, opacity: 1, duration: 1, ease: 'none',
        onUpdate: regen,
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
    const colors = [
      { r: 1.0, g: 0.8, b: 0.8 },  // pastel pink
      { r: 1.0, g: 1.0, b: 0.8 },  // pastel yellow
      { r: 0.8, g: 1.0, b: 0.8 },  // pastel mint
      { r: 0.8, g: 1.0, b: 1.0 },  // pastel aqua
      { r: 0.8, g: 0.8, b: 1.0 },  // pastel lavender
      { r: 1.0, g: 0.8, b: 1.0 }   // pastel magenta
    ];
    const len = colors.length;

    // animate a tween object from 0→len continuously
    const colAnim = { idx: 0 };
    const rotateTL = gsap.timeline({ repeat: -1, paused: true });

    const hueObj = { h: 0 };
    colorTweenRef.current = gsap.to(hueObj, {
      h: 1,
      duration: 6,        // full rainbow every 6s; adjust as you like
      ease: 'none',
      repeat: -1,
      paused: true,
      onUpdate: () => {
        if (!colorCycleEnabled.current) return;
        // disable per‐vertex colors & update uniform material color
        const mat = pattern.material;
        mat.vertexColors = false;
        mat.color.setHSL(hueObj.h, 1, 0.5);
        mat.needsUpdate = true;
      }
    });

    // when rotation starts, also start the color cycle
    rotateTL.eventCallback('onStart', () => {
  colorTweenRef.current.play();

  // start pulsing line width
  if (!pulseTweenRef.current) {
    pulseTweenRef.current = gsap.to(pattern.material, {
      linewidth: 2,
      duration: 1,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        pattern.material.needsUpdate = true;  // upload to GPU each tick
      }
    });
  }
});

    rotateTL.to(p.current, {
      xAxis: '+=6.283185307',
      duration: 6.283185307,
      ease: 'none',
      onUpdate: () => {

        // rotation only — color is handled by `colorTween`
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
          loopVertex: 1000
        });
      }
    }
    )

    timelines.current.rotation = rotateTL;

    // 3) ABOUT
    const aboutTL = gsap.timeline({ paused: true });
    aboutTL
      .to(p.current, { duration: 0, onComplete: () => { rotateTL.pause();}})
      .to(p.current, { value: 100, deltaAngle: 1.3, xAxis: 0, duration: 1, ease: 'power2.inOut', onUpdate: regen })
      .to(p.current, { zPos: 500, opacity: 0, duration: 1.1, ease: 'power4.inOut', onUpdate: regen, onComplete: () => navigate('/about')});
    timelines.current.about = aboutTL;

    // 4) PROJECTS
    const projectsTL = gsap.timeline({ paused: true });
    projectsTL
      .to(p.current, { duration: 0, onComplete: () => { rotateTL.pause();}})
      .to(p.current, { value: 0, yPos: 70, deltaAngle: 2, xAxis: 0, scale: 2, duration: 1.5, ease: 'power2.inOut', onUpdate: regen })
      .to(p.current, {opacity: 0, duration: 1.5, ease: 'linear', onUpdate: regen, onComplete: () => navigate('/projects')}, '<');

    timelines.current.projects = projectsTL;

    // 5) CONTACT
    const contactTL = gsap.timeline({ paused: true });
    contactTL
      .to(p.current, { value: 201, deltaAngle: 0.5, opacity: 0.9, xAxis: 0, scale: 2, duration: 2, ease: 'power2.inOut', onUpdate: regen})
      .to({}, {duration: 2, ease: 'power2.inOut', onUpdate() {
          const pr = this.progress();
          // transition from red to white
          pattern.transitionColors(0xff0000, 0xffffff, pr);
        },
        onComplete: () => navigate('/contact')}, '<');
    timelines.current.contact = contactTL;

    // 6) MUSIC
    const musicTL = gsap.timeline({ paused: true });
    musicTL
      .to(p.current, { duration: 0, onComplete: () => { rotateTL.pause();}})
      .to(p.current, { value: 1000, xAxis: 0, duration: 3, ease: 'power3.inOut', onUpdate: regen })
      .to(p.current, { scale: 1, duration: 3, ease: 'linear'}, '<')
      .to(p.current, { deltaAngle: 0.103, duration: 3, ease: 'back(0.2)' }, '<')
      .to(p.current, { duration: 0.5, onComplete: () => navigate('/music')});
  timelines.current.music = musicTL;

  // 7) WRITINGS
  const writingsTL = gsap.timeline({ paused: true });
  writingsTL
    .to(p.current, { value: 800, duration: 2, ease: 'linear', onUpdate: regen, onComplete: () => navigate('/writings')});
  timelines.current.writings = writingsTL;


  entryTL.play();

  return () => {
    Object.values(timelines.current).forEach(tl => tl.kill && tl.kill());
    if (pulseTweenRef.current) pulseTweenRef.current.kill();
  };
}, [initialized, navigate]);

function fadeInButtons() {
  setUiVisible(true);
}

useEffect(() => {
  if (uiVisible) {
    gsap.to('.home-category-tabs.home-bottom', {
      opacity: 1,
      duration: 0.2,
      ease: 'power2.out'
    });
  }
}, [uiVisible]);


function transitionPatternColor(newColorHex) {
  if (!initialized) return;
  colorCycleEnabled.current = false;
  // kill any existing hover tween
  if (hoverTween.current) hoverTween.current.kill();

  // force the rotation-driven vertex-color loop to keep writing
  pattern.material.vertexColors = true;

  const startColor = lastPatternColor.current;
  const anim = { t: 0 };

  hoverTween.current = gsap.to(anim, {
    t: 1,
    duration: 0.1,
    ease: 'power2.out',
    onUpdate: () => {
      // blend the vertex buffer from start→new
      pattern.transitionColors(startColor, newColorHex, anim.t);
    },
    onComplete: () => {
      // remember this hue
      lastPatternColor.current = newColorHex;
      hoverTween.current = null;

      // switch off per-vertex mode and tint uniformly
      const mat = pattern.material;
      mat.vertexColors = false;
      mat.color = new THREE.Color(newColorHex);
      mat.needsUpdate = true;
    }
  });
}

// Initialize Three.js, Pattern, Particles & RadialMenu
useEffect(() => {
      Object.assign(p.current, { value: 0, deltaAngle: 1.05, opacity: 1, xAxis: 0 });
      particlesRef.current = new Particles();
      setInitialized(true);
}, []);

const handleClick = (label, e) => {
  // ─── immediately disable ALL hover/color‐cycle behavior ─────────
  colorCycleEnabled.current = false;
  // stop the line-width pulse
   if (pulseTweenRef.current) {
     pulseTweenRef.current.kill();
     pulseTweenRef.current = null;
     pattern.material.linewidth = 1;      // reset to normal thickness
     pattern.material.needsUpdate = true;
   }
  // remove hover/click from buttons so no more onMouseEnter fires
  const tabsContainer = document.querySelector('.home-category-tabs');
  if (tabsContainer) tabsContainer.style.pointerEvents = 'none';
  const clickedBtn = e.currentTarget;
  clickedBtn.classList.add('clicked');

  if (label === 'projects') {
    // ═══════════════════════════════
    // Projects: fly other buttons away
    // ═══════════════════════════════
    gsap.utils.toArray('.home-tab').forEach(btn => {
      const group = btn.getAttribute('data-group');
      let props = {};
      if (group === 'left') props = { x: '-150vw' };
      if (group === 'middle') props = { y: '150vh' };
      if (group === 'right') props = { x: '150vw' };
      gsap.to(btn, {
        ...props, duration: 0.6, ease: 'power2.in', onComplete: () => {
          gsap.to('.centered-text', { opacity: 0, duration: 0.2 });
          timelines.current.projects.play();
          setUiVisible(false);
        }
      }
      );
    });


  } else {
    // ═══════════════════════════════
    // Everything else: dissolve other buttons
    // ═══════════════════════════════
    gsap.utils.toArray('.home-tab').forEach(btn => {
      if (btn !== clickedBtn) {
        gsap.to(btn, { opacity: 0, duration: 0.2, ease: 'power1.out' });
      }
    });

    // after they dissolve, fade out clicked one & run its timeline
    gsap.to(clickedBtn, {
      opacity: 0,
      duration: 0.7,
      onComplete: () => {
        gsap.to('.centered-text', { opacity: 0, duration: 0.2 }, 0);
        if (label === 'resume') {
          window.open('/downloads/resume.pdf', '_blank', 'noopener');
        } else {
          timelines.current[label].play();
        }
        setUiVisible(false);
      }
    });
  }
};

return (
  <div className="home-page">
    <div className="particles-container" ref={particlesRef} />
    <div className="radialmenu-container" ref={radialMenuMountRef} />
    <div
      className="centered-text"
      style={{ fontFamily: `"${currentFont}"` }}
    >
      {displayName}
      <span className="blinking-cursor">▮</span>
    </div>

    {initialized && uiVisible && (
      <div className="home-category-tabs home-bottom" style={{ opacity: 0 }}>
        <button
          className="home-tab"
          style={{ '--tab-color': '#f94144' }}
          data-group="left"
          onClick={e => {
            optionPending.current = 'projects';
            handleClick('projects', e);
          }}
          onMouseEnter={_e => {
            colorTweenRef.current.pause();
            transitionPatternColor(COLOR_MAP.projects);
            colorCycleEnabled.current = false;
          }
          }
        >
          Projects
        </button>

        <button
          className="home-tab"
          style={{ '--tab-color': '#f3722c' }}
          data-group="middle"
          onClick={e => {
            optionPending.current = 'about';
            handleClick('about', e);
          }}
          onMouseEnter={_e => {
            colorTweenRef.current.pause();
            transitionPatternColor(COLOR_MAP.whoami);
            colorCycleEnabled.current = false;
          }
          }
        >
          Who Am I
        </button>

        <button
          className="home-tab"
          style={{ '--tab-color': '#577590' }}
          data-group="right"
          onClick={e => {
            optionPending.current = 'music';
            handleClick('music', e);
          }}
          onMouseEnter={_e => {
            colorTweenRef.current.pause();
            transitionPatternColor(COLOR_MAP.music);
            colorCycleEnabled.current = false;
          }
          }
        >
          Music
        </button>

        <button
          className="home-tab"
          style={{ '--tab-color': '#43aa8b' }}
          data-group="left"
          onClick={_e => {
            optionPending.current = 'resume';
            window.open('/assets/downloads/Resume-Ahmed-Mansour.pdf', '_blank', 'noopener');
          }}
          onMouseEnter={_e => {
            colorTweenRef.current.pause();
            transitionPatternColor(COLOR_MAP.resume);
            colorCycleEnabled.current = false;
          }
          }
        >
          Resume
        </button>

        <button
          className="home-tab"
          style={{ '--tab-color': '#90be6d' }}
          data-group="middle"
          // onClick={e => {
          //   optionPending.current = 'writings';
          //   handleClick('writings', e);
          // }}
          onMouseEnter={_e => {
            colorTweenRef.current.pause();
            transitionPatternColor(COLOR_MAP.writings);
            colorCycleEnabled.current = false;
          }
          }
        >
          Writings
        </button>

        <button
          className="home-tab"
          style={{ '--tab-color': '#f9c74f' }}
          data-group="right"
          onClick={e => {
            optionPending.current = 'contact';
            handleClick('contact', e);
          }}
          onMouseEnter={_e => {
            colorTweenRef.current.pause();
            transitionPatternColor(COLOR_MAP.contact);
            colorCycleEnabled.current = false;
          }
          }
        >
          Contact
        </button>
      </div>
    )}
  </div>
);
};

export default Home;
