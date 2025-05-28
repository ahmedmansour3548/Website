/* src/index.js */
import './index.css';
import reportWebVitals from './reportWebVitals';
import { createContext, useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import cameraInstance from './utils/camera';
import Pattern, { PatternStyle } from './utils/Pattern';

import Home from './Home/Home';
import PatternFactory from './Projects/Toys/PatternFactory/PatternFactory';
import BattleTetris from './Projects/Toys/BattleTetris/BattleTetris';
import About from './About/About';
import Projects from './Projects/Projects';
import ProjectPage from './Projects/ProjectPage';
import Music from './Music/Music';
import Contact from './Contact/Contact';
import NotFound from './NotFound/NotFound';

// PatternContext provides both instance and style presets
export const PatternContext = createContext({ pattern: null, styles: PatternStyle });

const PatternProvider = ({ children }) => {
  const mountRef = useRef(null);
  const patternRef = useRef(null);
  const [patternInstance, setPatternInstance] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (patternRef.current) {
      patternRef.current.dispose();
      patternRef.current = null;
      setPatternInstance(null);
    }

    const initialColor = location.pathname === '/contact' ? 0xf9c74f : 0xff0000;
    const scene = new THREE.Scene();
    const camera = cameraInstance.getCamera();

    const pattern = new Pattern(scene, camera, { transparent: true, initialColor });
    patternRef.current = pattern;
    setPatternInstance(pattern);

    const mountNode = mountRef.current;
    const resize = () => {
      if (!mountNode) return;
      const { clientWidth: w, clientHeight: h } = mountNode;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      pattern.renderer.setSize(w, h);
    };

    resize();
    mountNode.appendChild(pattern.renderer.domElement);
    // ensure canvas is behind content but above background
    pattern.renderer.domElement.style.zIndex = '-1';

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      pattern.dispose();
    };
  }, [location.pathname]);

  return (
    <PatternContext.Provider value={{ pattern: patternInstance, styles: PatternStyle }}>
      {/* Behind all app content */}
      <div
        className="pattern-background"
        ref={mountRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}
      />
      {children}
    </PatternContext.Provider>
  );
};

// App render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Router>
      <PatternProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:category/:id" element={<ProjectPage />} />
            <Route path="/music" element={<Music />} />
            <Route path="/projects/toys/patternfactory/play" element={<PatternFactory />} />
            <Route path="/projects/toys/battletetris/play" element={<BattleTetris />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
      </PatternProvider>
    </Router>
);

reportWebVitals();
