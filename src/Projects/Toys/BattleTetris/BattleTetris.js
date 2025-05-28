// src/Projects/BattleTetris/BattleTetris.js
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './BattleTetris.css';

const BattleTetris = () => {
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initCheerpJ = async () => {
      try {
        await window.cheerpjInit();
        window.cheerpjCreateDisplay(800, 600, wrapperRef.current);
        await window.cheerpjRunJar('/app/battletetris.jar');
      } catch (err) {
        console.error('CheerpJ init error:', err);
      }
    };

    if (window.cheerpjInit) initCheerpJ();
    else {
      const s = document.createElement('script');
      s.src = 'https://cjrtnc.leaningtech.com/4.0/loader.js';
      s.async = true;
      s.onload = initCheerpJ;
      document.body.appendChild(s);
    }
  }, []);

  return (
    <div className="tetris-container">
      <div className="tetris-pattern" />

      <button className="tetris-back-home" onClick={() => navigate('/projects/toys/battletetris')}>
        <div className="tetris-back-icon" />
        Back
      </button>

      {/* NEW: column wrapper for game + controls */}
      <div className="tetris-main">
        <div ref={wrapperRef} className="tetris-canvas-wrapper" />

        <div className="tetris-controls">
          <h2>Controls</h2>
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Player 1</th>
                <th>Player 2</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Move Left</td>      <td>A</td>            <td>←</td></tr>
              <tr><td>Move Right</td>     <td>D</td>            <td>→</td></tr>
              <tr><td>Rotate (CW)</td>    <td>W</td>            <td>↑</td></tr>
              <tr><td>Soft Drop</td>      <td>S</td>            <td>↓</td></tr>
              <tr><td>Hard Drop</td>      <td>V</td>            <td>.</td></tr>
              <tr><td>Hold</td>           <td>C</td>            <td>,</td></tr>
              <tr><td>Pause/Resume</td>   <td>P / Pause</td>    <td>Pause</td></tr>
              <tr><td>Restart Game</td>   <td>Restart button</td><td>Restart button</td></tr>
              <tr><td>Back to Menu</td>   <td>Menu button</td>  <td>Menu button</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BattleTetris;
