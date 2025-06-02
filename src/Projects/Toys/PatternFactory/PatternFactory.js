/* ========================================================== */
/*  PatternFactory – v5.3 (fix true drag by pausing sync)    */
/* ========================================================== */

import React, { useState, useEffect, useContext, useRef } from 'react';
import { PatternContext } from '../../../index';
import './PatternFactory.css';
import { gsap } from 'gsap';

/* ───────────────────────── UI CONFIG (unchanged) ────────── */
const PARAM_CONFIG = [
  { key: 'maxVertices',  label: 'Vertices',       min: 0,        max: 10000,       step: 1,      default: 100 },
  { key: 'xPos',         label: 'X Position',     min: -10,      max: 10,          step: 0.01,   default: 0   },
  { key: 'yPos',         label: 'Y Position',     min: -10,      max: 10,          step: 0.01,   default: 0   },
  { key: 'xFunctionCode',label: 'X Function',     min: 0,        max: 25,          step: 1,      default: 0   },
  { key: 'yFunctionCode',label: 'Y Function',     min: 0,        max: 25,          step: 1,      default: 1   },
  { key: 'deltaAngle',   label: 'Δ Angle',        min: -2,       max: 2,           step: 0.001, default: 1   },
  { key: 'scale',        label: 'Scale',          min: 0.01,     max: 10,          step: 0.01,   default: 1   },
  { key: 'xAngularFreq', label: 'X Angular Freq', min: 0,        max: 10,          step: 0.01,   default: 1   },
  { key: 'yAngularFreq', label: 'Y Angular Freq', min: 0,        max: 10,          step: 0.01,   default: 1   },
  { key: 'xPhase',       label: 'X Phase',        min: -Math.PI, max: Math.PI,     step: 0.01,   default: 0 },
  { key: 'yPhase',       label: 'Y Phase',        min: -Math.PI, max: Math.PI,     step: 0.01,   default: 0 },
];

/* Any parameters that need clamping beyond their slider bounds: */
const CLAMP = {
  maxVertices:   { min: 0,    max: 10000 },
  xFunctionCode: { min: 0,    max: 25 },
  yFunctionCode: { min: 0,    max: 25 },
};

/* Initialize “vals” to each param’s default */
const initVals = () =>
  Object.fromEntries(PARAM_CONFIG.map(({ key, default: d }) => [key, d]));

/* Initialize “rates” (all zero) */
const initRates = () =>
  Object.fromEntries(PARAM_CONFIG.map(({ key }) => [key, 0]));

/* Initialize “run” flags (all false) */
const initRunFlags = () =>
  Object.fromEntries(PARAM_CONFIG.map(({ key }) => [key, false]));

export default function PatternFactory() {
  const { pattern } = useContext(PatternContext);

  /* ───────────────────────────────────────────────────── */
  /*  STATE                                                */
  /* ───────────────────────────────────────────────────── */
  const [vals, setVals]           = useState(initVals());
  const [rates, setRates]         = useState(initRates());
  const [runFlags, setRunFlags]     = useState(initRunFlags());
  const [openState, setOpenState]   = useState(false);

  /* ───────────────────────────────────────────────────── */
  /*  REFS for animation and slider DOM elements            */
  /* ───────────────────────────────────────────────────── */
  const panelRef     = useRef(null);
  const tabRef       = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef  = useRef(null);

  /* Keep up‐to‐date copies of runFlags & rates in refs */
  const runRef   = useRef(initRunFlags());
  const ratesRef = useRef(initRates());

  /* Refs to each slider so we can manually set .value when state changes */
  const sliderRefs = useRef({});
  const rateRefs   = useRef({});

  /* ───────────────────────────────────────────────────── */
  /*  HELPER: clamp a value to its min/max if needed        */
  /* ───────────────────────────────────────────────────── */
  const clamp = (k, v) => {
    const rule = CLAMP[k];
    return rule
      ? Math.max(rule.min, Math.min(rule.max, v))
      : v;
  };

  /* ───────────────────────────────────────────────────── */
  /*  Whenever “vals” changes, regenerate pattern            */
  /* ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (pattern) {
      pattern.regenerate(vals);
    }
  }, [pattern, vals]);

  /* ───────────────────────────────────────────────────── */
  /*  Start/stop the rAF loop when runFlags or rates update  */
  /* ───────────────────────────────────────────────────── */
  useEffect(() => {
    runRef.current = runFlags;
    ratesRef.current = rates;

    const anyRunning = Object.values(runRef.current).some((x) => x);
    if (anyRunning && !animationRef.current) {
      animationRef.current = requestAnimationFrame(animateFrame);
    }
    if (!anyRunning && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      lastTimeRef.current = null;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        lastTimeRef.current = null;
      }
    };
  }, [runFlags, rates]);

  /* ───────────────────────────────────────────────────── */
  /*  The rAF callback that advances all “running” params   */
  /* ───────────────────────────────────────────────────── */
  const animateFrame = (time) => {
    if (lastTimeRef.current == null) {
      lastTimeRef.current = time;
    }
    const deltaSeconds = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    let anyStillRunning = false;
    setVals((prev) => {
      const next = { ...prev };
      Object.entries(runRef.current).forEach(([k, isRunning]) => {
        if (isRunning && ratesRef.current[k] !== 0) {
          anyStillRunning = true;
          next[k] = clamp(k, prev[k] + ratesRef.current[k] * deltaSeconds);
        }
      });
      return next;
    });

    if (anyStillRunning) {
      animationRef.current = requestAnimationFrame(animateFrame);
    } else {
      animationRef.current = null;
      lastTimeRef.current = null;
    }
  };

  /* ───────────────────────────────────────────────────── */
  /*  PANEL OPEN/CLOSE via mouse position                    */
  /* ───────────────────────────────────────────────────── */
  useEffect(() => {
    const handleMouse = (e) => {
      const y = e.clientY;
      const h = window.innerHeight;
      const inside = panelRef.current?.contains(e.target);

      if (y > h * 0.66 || inside) {
        setOpenState(true);
      } else if (y < h * 0.5 && !inside) {
        setOpenState(false);
      }
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  /* ───────────────────────────────────────────────────── */
  /*  Slide the “CONTROLS” tab when openState changes        */
  /* ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!panelRef.current || !tabRef.current) return;
    const panelHeight = panelRef.current.offsetHeight;
    gsap.to(tabRef.current, {
      bottom: openState ? panelHeight : 0,
      ease: 'expo.out',
      duration: 0.5,
    });
  }, [openState]);

  /* ───────────────────────────────────────────────────── */
  /*  MUTATORS                                               */
  /* ───────────────────────────────────────────────────── */
  const changeVal = (k, v) => {
    setVals((prev) => ({ ...prev, [k]: clamp(k, v) }));
  };

  const changeRate = (k, v) => {
    setRates((prev) => ({ ...prev, [k]: v }));
    ratesRef.current = { ...ratesRef.current, [k]: v };
  };

  const toggleRun = (k) => {
    const updated = { ...runFlags, [k]: !runFlags[k] };
    setRunFlags(updated);
    runRef.current = updated;
  };

  /* ───────────────────────────────────────────────────── */
  /*  ROW: one line with label, uncontrolled slider, number, ▶/⏸, rate‐slider */
  /* ───────────────────────────────────────────────────── */
  const Row = ({ cfg }) => {
    const { key, label, min, max, step } = cfg;
    const isRunning = runFlags[key];

    /* Create or reuse refs for this key’s sliders */
    const sliderRef = (sliderRefs.current[key] ??= React.createRef());
    const rateRef   = (rateRefs.current[key]   ??= React.createRef());

    /* Local ref to detect if the user is currently dragging the main slider */
    const draggingSlider = useRef(false);

    /* Whenever state “vals[key]” changes, push to DOM only if not dragging */
    useEffect(() => {
      if (!draggingSlider.current && sliderRef.current) {
        sliderRef.current.value = vals[key];
      }
    }, [vals[key]]);

    /* Local ref to detect if user is dragging the rate slider */
    const draggingRate = useRef(false);

    /* Whenever state “rates[key]” changes, push to DOM only if not dragging */
    useEffect(() => {
      if (!draggingRate.current && rateRef.current) {
        rateRef.current.value = rates[key];
      }
    }, [rates[key]]);

    return (
      <div className="pf-row" key={key}>
        <span className="pf-label">{label}</span>

        {/* Main slider: uncontrolled, with drag detection */}
        <input
          className="pf-slider"
          type="range"
          min={min}
          max={max}
          step={step}
          defaultValue={vals[key]}
          ref={sliderRef}
          onPointerDown={() => { draggingSlider.current = true; }}
          onPointerUp={() => { draggingSlider.current = false; changeVal(key, parseFloat(sliderRef.current.value)); }}
          onInput={(e) => changeVal(key, parseFloat(e.target.value))}
          onChange={(e) => changeVal(key, parseFloat(e.target.value))}
        />

        {/* Number input: controlled */}
        <input
          className="pf-number"
          type="number"
          min={min}
          max={max}
          step={step}
          value={vals[key]}
          onChange={(e) => changeVal(key, parseFloat(e.target.value))}
        />

        {/* Play/Pause button */}
        <button
          className={`pf-anim-btn ${isRunning ? 'running' : ''}`}
          onClick={() => toggleRun(key)}
        >
          {isRunning ? '⏸' : '▶'}
        </button>

        {/* Rate slider: only show if running */}
        {isRunning && (
          <input
            className="pf-rate"
            type="range"
            min={-1}
            max={1}
            step={0.001}
            defaultValue={rates[key]}
            ref={rateRef}
            onPointerDown={() => { draggingRate.current = true; }}
            onPointerUp={() => { draggingRate.current = false; changeRate(key, parseFloat(rateRef.current.value)); }}
            onInput={(e) => changeRate(key, parseFloat(e.target.value))}
            onChange={(e) => changeRate(key, parseFloat(e.target.value))}
          />
        )}
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────── */
  return (
    <>
      <div ref={tabRef} className="pf-tab">CONTROLS</div>
      <aside ref={panelRef} className={`pf-panel ${openState ? 'open' : ''}`}>
        <div className="pf-scroll">
          {PARAM_CONFIG.map((cfg) => (
            <Row key={cfg.key} cfg={cfg} />
          ))}
        </div>
      </aside>
    </>
  );
}
