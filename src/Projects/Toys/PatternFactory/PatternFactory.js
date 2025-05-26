/* ========================================================== */
/*  PatternFactory – v3.0  (CSS‐only slide, bulletproof)      */
/* ========================================================== */

import React, {
  useState, useEffect, useContext, useRef, useMemo,
} from 'react';
import { PatternContext } from '../../../index';
import './PatternFactory.css';
import { gsap } from "gsap";
/* ───────────────────────── UI CONFIG (unchanged) ────────── */
const PARAM_CONFIG = [
  { key: 'maxVertices',  label: 'Vertices',            min: 0,    max: 10000,  step: 1,     default: 100 },
  { key: 'xPos',         label: 'X Position',          min: -10,  max: 10,     step: 0.01,  default: 0   },
  { key: 'yPos',         label: 'Y Position',          min: -10,  max: 10,     step: 0.01,  default: 0   },
  { key: 'xFunctionCode',label: 'X Function',          min: 0,    max: 25,     step: 1,     default: 0   },
  { key: 'yFunctionCode',label: 'Y Function',          min: 0,    max: 25,     step: 1,     default: 1   },
  { key: 'deltaAngle',   label: 'Δ Angle',             min: -2,   max: 2,      step: 0.001, default: 1   },
  { key: 'scale',        label: 'Scale',               min: 0.01, max: 10,     step: 0.01,  default: 1   },
  { key: 'xAngularFreq', label: 'X Angular Freq',      min: 0,    max: 10,     step: 0.01,  default: 1   },
  { key: 'yAngularFreq', label: 'Y Angular Freq',      min: 0,    max: 10,     step: 0.01,  default: 1   },
  { key: 'xPhase',       label: 'X Phase',             min: -Math.PI, max: Math.PI, step: 0.01, default: 0 },
  { key: 'yPhase',       label: 'Y Phase',             min: -Math.PI, max: Math.PI, step: 0.01, default: 0 },
];

const CLAMP = { maxVertices: { min: 0, max: 10000 }, xFunctionCode: { min: 0, max: 25 }, yFunctionCode: { min: 0, max: 25 } };
const initRates = () => Object.fromEntries(PARAM_CONFIG.map(({ key }) => [key, 0]));

/* ────────────────────────────────────────────────────────── */
export default function PatternFactory() {
  const { pattern } = useContext(PatternContext);

  /* state --------------------------------------------------- */
  const [vals,  setVals]  = useState(Object.fromEntries(PARAM_CONFIG.map(({ key, default: d }) => [key, d])));
  const [rates, setRates] = useState(initRates());
  const [run,   setRun]   = useState({});
  const timers            = useRef({});

  /* panel open flag */
  const [open, setOpen]   = useState(false);
  const panelRef          = useRef(null);
  const tabRef   = useRef(null);
  /* helpers ------------------------------------------------- */
  const clamp = (k, v) => {
    const rule = CLAMP[k];
    return rule ? Math.max(rule.min, Math.min(rule.max, v)) : v;
  };

  const numeric = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(vals)) out[k] = clamp(k, parseFloat(v) || 0);
    return out;
  }, [vals]);

  /* redraw pattern */
  useEffect(() => { if (pattern) pattern.regenerate(numeric); }, [pattern, numeric]);

  /* intervals for animating parameters ---------------------- */
  useEffect(() => {
    Object.entries(rates).forEach(([k, r]) => {
      if (r !== 0 && run[k]) startLoop(k, r);
    });
    return () => Object.values(timers.current).forEach(clearInterval);
  }, [run, rates]);

  const startLoop = (k, r) => {
    clearInterval(timers.current[k]);
    timers.current[k] = setInterval(() => {
      setVals(p => ({ ...p, [k]: clamp(k, (parseFloat(p[k]) || 0) + r) }));
    }, 16);
  };

  /* mouse-move listener — bottom ⅓ opens, mid screen closes --- */
  useEffect(() => {
    const handle = (e) => {
      const y = e.clientY;
      const h = window.innerHeight;
      const inside = panelRef.current?.contains(e.target);
      if (y > h * 0.66 || inside) {
        setOpen(true);
      } else if (y < h * 0.5 && !inside) {
        setOpen(false);
      }
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);


  /* sliding animation */
useEffect(() => {
  if (!panelRef.current || !tabRef.current) return;

  // how tall the panel will be when it’s open
  const panelHeight = panelRef.current.offsetHeight;

  // lift or drop the tab by exactly the panel’s height
  gsap.to(tabRef.current, {
    bottom: open ? panelHeight : 0,
    ease: 'expo.out',
    duration: 0.5,
  });
}, [open]);

  /* mutators ------------------------------------------------ */
  const setVal  = (k, v) => setVals(p => ({ ...p, [k]: clamp(k, v) }));
  const setRate = (k, v) => setRates(r => ({ ...r, [k]: v }));
  const toggleRun = (k) =>
    setRun(prev => {
      const now = !prev[k];
      if (!now) clearInterval(timers.current[k]);
      return { ...prev, [k]: now };
    });

const Row = ({ cfg }) => {
  const { key, label, min, max, step } = cfg;
  const playing   = run[key];
  const sliderRef = useRef(null);
  const rateRef   = useRef(null);
  const valsRef   = useRef(vals);

  // Always keep valsRef up to date for regenerations:
  useEffect(() => { valsRef.current = vals; }, [vals]);

  // General drag‑binder factory
  const bindDrag = (ref, isRate) => {
    const el = ref.current;
    if (!el) return () => {};

    // how fine to snap:
    const snapStep = isRate ? 0.001 : parseFloat(el.getAttribute('step')) || step;

    const onDown = (e) => {
      e.preventDefault();
      document.body.style.userSelect = 'none'; // avoid text‑select
      const rect = el.getBoundingClientRect();

      const onMove = (ev) => {
        let pct = (ev.clientX - rect.left) / rect.width;
        pct = Math.max(0, Math.min(1, pct));
        let v = min + pct * (max - min);
        // snap to step
        const k = Math.round((v - min) / snapStep);
        v = min + k * snapStep;
        el.value = v;

        if (isRate) {
          setRate(key, v);
        } else {
          // immediate visual update:
          const fresh = { ...valsRef.current, [key]: v };
          if (pattern) pattern.regenerate(fresh);
        }
      };

      const onUp = (ev) => {
        document.body.style.userSelect = '';
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        if (!isRate) {
          // commit to React state last
          setVal(key, parseFloat(el.value));
        }
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup',   onUp);
    };

    el.addEventListener('pointerdown', onDown);
    return () => el.removeEventListener('pointerdown', onDown);
  };

  // bind both sliders whenever they mount or `playing` toggles
  useEffect(() => {
    const unbindMain = bindDrag(sliderRef, /*isRate=*/false);
    const unbindRate = playing ? bindDrag(rateRef, /*isRate=*/true) : () => {};
    return () => {
      unbindMain();
      unbindRate();
    };
  }, [playing, key]);

  return (
    <div className="pf-row" key={key}>
      <span className="pf-label">{label}</span>

      {/* main slider */}
      <input
        ref={sliderRef}
        className="pf-slider"
        type="range"
        min={min} max={max} step={step}
        defaultValue={vals[key]}
      />

      {/* manual number input */}
      <input
        className="pf-number"
        type="number"
        min={min} max={max} step={step}
        value={vals[key]}
        onChange={e => setVal(key, clamp(key, e.target.value))}
      />

      {/* animate toggle */}
      <button
        className={`pf-anim-btn ${playing ? 'running' : ''}`}
        onClick={() => toggleRun(key)}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {/* rate slider */}
      {playing && (
        <input
          ref={rateRef}
          className="pf-rate"
          type="range"
          min={-1} max={1} step={0.001}         // fine 0.001 steps here
          defaultValue={rates[key]}
        />
      )}
    </div>
  );
};


  /* JSX ----------------------------------------------------- */
  return (
    <>
      <div ref={tabRef} className="pf-tab">CONTROLS</div>

      <aside ref={panelRef} className={`pf-panel ${open ? 'open' : ''}`}>
        <div className="pf-scroll">
          {PARAM_CONFIG.map(cfg => <Row key={cfg.key} cfg={cfg} />)}
        </div>
      </aside>
      
    </>
  );
}
