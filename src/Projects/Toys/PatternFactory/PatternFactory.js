﻿import React, { useState, useEffect, useContext } from 'react';
import cameraInstance from '../../../utils/camera';
import { PatternContext } from "../../../index";
import { gsap } from 'gsap';
import './PatternFactory.css';
import * as THREE from 'three';

const PatternFactory = () => {
  const patternRef = useContext(PatternContext);
  const [patternParams, setPatternParameters] = useState({
    maxVertices: 100,
    xPos: 0,
    yPos: 0,
    zPos: 0,
    xFunctionCode: 0,
    yFunctionCode: 1,
    deltaAngle: 1,
    scale: 1,
    xAngularFreq: 1,
    yAngularFreq: 1,
    xAxis: 0,
    yAxis: 0,
    xPhase: 0,
    yPhase: 0,
    loopVertex: 200,
    paramsToAdjust: ['deltaAngle'],
    adjustAmounts: [1]
  });
  const [changeRates, setChangeRates] = useState({
    maxVertices: 0,
    xPos: 0,
    yPos: 0,
    xFunctionCode: 0,
    yFunctionCode: 0,
    deltaAngle: 0,
    scale: 0,
    xAngularFreq: 0,
    yAngularFreq: 0,
    xPhase: 0,
    yPhase: 0,
    loopVertex: 0
  });
  const [isRunning, setIsRunning] = useState({});
  const intervals = React.useRef({});


 // handle rate-based adjustments
  useEffect(() => {
    Object.entries(changeRates).forEach(([param, rate]) => {
      if (rate !== 0 && isRunning[param]) {
        startChangingParameter(param, rate);
      }
    });
    return () => {
      Object.values(intervals.current).forEach(clearInterval);
    };
  }, [isRunning, changeRates]);

 // ─── Draw *once* after the provider is definitely ready ───
 useEffect(() => {
   const frame = requestAnimationFrame(() => {
     const pattern = patternRef.current;
     if (!pattern) return;
     pattern.material.opacity = 1;
     pattern.setAllVerticesColor(0xFF0000);
     pattern.regenerate(patternParams);
   });
   return () => cancelAnimationFrame(frame);
 }, [patternRef]);  // run this once on mount

 useEffect(() => {
    const pattern = patternRef.current;
    if (!pattern) return;

    // make sure it's visible
    pattern.material.opacity = 1;
    pattern.setAllVerticesColor(0xFF0000);

    // draw it
    pattern.regenerate(patternParams);
  }, [patternRef, patternParams]);


  const handleParameterChange = e => {
    const { name, value } = e.target;
    if (!isNaN(parseFloat(value)) || value === '' || value === '-') {
      setPatternParameters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRateChangeInput = e => {
    const { name, value } = e.target;
    const param = name.replace('-change-rate', '');
    if (!isNaN(parseFloat(value)) || value === '' || value === '-') {
      setChangeRates(prev => ({ ...prev, [param]: parseFloat(value) || 0 }));
    }
  };

  const updateParameter = (param, delta, isInt = false) => {
    setPatternParameters(prev => {
      const oldVal = parseFloat(prev[param]);
      const newVal = isInt ? Math.round(oldVal + delta) : oldVal + delta;
      return { ...prev, [param]: newVal };
    });
  };

  const handleRateChange = (param, amount) => {
    setChangeRates(prev => ({ ...prev, [param]: prev[param] + amount }));
  };

  const toggleInterval = param => {
    setIsRunning(prev => ({ ...prev, [param]: !prev[param] }));
    if (!isRunning[param]) {
      startChangingParameter(param, changeRates[param]);
    } else {
      stopChangingParameter(param);
    }
  };

  const startChangingParameter = (param, rate) => {
    clearInterval(intervals.current[param]);
    intervals.current[param] = setInterval(() => {
      setPatternParameters(prev => ({
        ...prev,
        [param]: prev[param] + rate
      }));
    }, 10);
  };

  const stopChangingParameter = param => {
    clearInterval(intervals.current[param]);
    intervals.current[param] = null;
  };

  const isValid = val => val === '' || val === '-' || !isNaN(parseFloat(val));

  // UI Component for rate inputs
  const ChangeRateInput = ({ param }) => (
    <input
      type="text"
      id={`${param}-change-rate`}
      name={`${param}-change-rate`}
      value={changeRates[param]}
      onChange={handleRateChangeInput}
      style={{ borderColor: isValid(changeRates[param]) ? undefined : 'red' }}
    />
  );


    return (
        <div className="controls-container">

            <div className="parameter-control">
                <label htmlFor={patternParams.maxVertices}>Vertices</label>
                <div className="parameter-grid">
                    <button className="button-small" onClick={() => updateParameter('maxVertices', -100)}>-100</button>
                    <button className="button-small" onClick={() => updateParameter('maxVertices', -10)}>-10</button>
                    <button className="button-small" onClick={() => updateParameter('maxVertices', -1)}>-1</button>
                    <input
                        className="input-small"
                        type="text"
                        id="maxVertices"
                        name="maxVertices"
                        value={patternParams.maxVertices.toString()}
                        onChange={handleParameterChange}
                    />
                    <button className="button-small" onClick={() => updateParameter('maxVertices', 100)}>100</button>
                    <button className="button-small" onClick={() => updateParameter('maxVertices', 10)}>10</button>
                    <button className="button-small" onClick={() => updateParameter('maxVertices', 1)}>1</button>
                </div>

                <div className="parameter-grid">
                    <button className="button-small" onClick={() => handleRateChange('maxVertices', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => handleRateChange('maxVertices', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => handleRateChange('maxVertices', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="maxVertices-change-rate"
                        name="maxVertices-change-rate"
                        value={changeRates.maxVertices}
                        onChange={handleRateChangeInput}
                    />
                    <button className="button-small" onClick={() => handleRateChange('maxVertices', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => handleRateChange('maxVertices', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => handleRateChange('maxVertices', 0.1)}>+.1</button>
                </div>

                <div className="toggle-container">
                    <button className="button-small toggle-button" onClick={() => toggleInterval('maxVertices')}>
                        {isRunning['maxVertices'] ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>



            <div className="parameter-control">
                <label htmlFor={patternParams.xPos}>X Coordinate</label>
                <div className="parameter-grid">
                    <button className="button-small" onClick={() => updateParameter('xPos', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => updateParameter('xPos', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => updateParameter('xPos', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="xPos"
                        name="xPos"
                        value={patternParams.xPos.toString()}
                        onChange={handleParameterChange}
                    />
                    <button className="button-small" onClick={() => updateParameter('xPos', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => updateParameter('xPos', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => updateParameter('xPos', 0.1)}>+.1</button>
                </div>

                <div className="parameter-grid">
                    <button className="button-small" onClick={() => handleRateChange('xPos', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => handleRateChange('xPos', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => handleRateChange('xPos', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="xPos-change-rate"
                        name="xPos-change-rate"
                        value={changeRates.xPos}
                        onChange={handleRateChangeInput}
                    />
                    <button className="button-small" onClick={() => handleRateChange('xPos', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => handleRateChange('xPos', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => handleRateChange('xPos', 0.1)}>+.1</button>
                </div>

                <div className="toggle-container">
                    <button className="button-small toggle-button" onClick={() => toggleInterval('xPos')}>
                        {isRunning['xPos'] ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>



            <div className="parameter-control">
                <label htmlFor={patternParams.yPos}>Y Coordinate</label>
                <div className="parameter-grid">
                    <button className="button-small" onClick={() => updateParameter('yPos', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => updateParameter('yPos', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => updateParameter('yPos', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="yPos"
                        name="yPos"
                        value={patternParams.yPos.toString()}
                        onChange={handleParameterChange}
                    />
                    <button className="button-small" onClick={() => updateParameter('yPos', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => updateParameter('yPos', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => updateParameter('yPos', 0.1)}>+.1</button>
                </div>

                <div className="parameter-grid">
                    <button className="button-small" onClick={() => handleRateChange('yPos', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => handleRateChange('yPos', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => handleRateChange('yPos', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="yPos-change-rate"
                        name="yPos-change-rate"
                        value={changeRates.yPos}
                        onChange={handleRateChangeInput}
                    />
                    <button className="button-small" onClick={() => handleRateChange('yPos', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => handleRateChange('yPos', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => handleRateChange('yPos', 0.1)}>+.1</button>
                </div>

                <div className="toggle-container">
                    <button className="button-small toggle-button" onClick={() => toggleInterval('yPos')}>
                        {isRunning['yPos'] ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>



            <div className="parameter-control">
                <label htmlFor={patternParams.xFunctionCode}>X Function</label>
                <div className="parameter-grid">
                    <button className="button-small" onClick={() => updateParameter('xFunctionCode', -1)}>-1</button>
                    <input
                        className="input-small"
                        type="text"
                        id="xFunctionCode"
                        name="xFunctionCode"
                        value={patternParams.xFunctionCode.toString()}
                        onChange={handleParameterChange}
                    />
                    <button className="button-small" onClick={() => updateParameter('xFunctionCode', 1)}>+1</button>
                </div>

                <div className="parameter-grid">
                    <button className="button-small" onClick={() => handleRateChange('xFunctionCode', -0.1)}>-.1</button>
                    <input
                        className="input-small"
                        type="text"
                        id="xFunctionCode-change-rate"
                        name="xFunctionCode-change-rate"
                        value={changeRates.xFunctionCode}
                        onChange={handleRateChangeInput}
                    />
                    <button className="button-small" onClick={() => handleRateChange('xFunctionCode', 0.1)}>+.1</button>
                </div>

                <div className="toggle-container">
                    <button className="button-small toggle-button" onClick={() => toggleInterval('xFunctionCode')}>
                        {isRunning['xFunctionCode'] ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>



            <div className="parameter-control">
                <label htmlFor={patternParams.yFunctionCode}>Y Function</label>
                <div className="parameter-grid">
                    <button className="button-small" onClick={() => updateParameter('yFunctionCode', -1)}>-1</button>
                    <input
                        className="input-small"
                        type="text"
                        id="yFunctionCode"
                        name="yFunctionCode"
                        value={patternParams.yFunctionCode.toString()}
                        onChange={handleParameterChange}
                    />
                    <button className="button-small" onClick={() => updateParameter('yFunctionCode', 1)}>+1</button>
                </div>

                <div className="parameter-grid">
                    <button className="button-small" onClick={() => handleRateChange('yFunctionCode', -0.1)}>-.1</button>
                    <input
                        className="input-small"
                        type="text"
                        id="yFunctionCode-change-rate"
                        name="yFunctionCode-change-rate"
                        value={changeRates.yFunctionCode}
                        onChange={handleRateChangeInput}
                    />
                    <button className="button-small" onClick={() => handleRateChange('yFunctionCode', 0.1)}>+.1</button>
                </div>

                <div className="toggle-container">
                    <button className="button-small toggle-button" onClick={() => toggleInterval('yFunctionCode')}>
                        {isRunning['yFunctionCode'] ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>



            <div className="parameter-control">
                <label htmlFor={patternParams.deltaAngle}>Delta Angle</label>
                <div className="parameter-grid">
                    <button className="button-small" onClick={() => updateParameter('deltaAngle', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => updateParameter('deltaAngle', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => updateParameter('deltaAngle', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="deltaAngle"
                        name="deltaAngle"
                        value={patternParams.deltaAngle.toString()}
                        onChange={handleParameterChange}
                    />
                    <button className="button-small" onClick={() => updateParameter('deltaAngle', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => updateParameter('deltaAngle', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => updateParameter('deltaAngle', 0.1)}>+.1</button>
                </div>

                <div className="parameter-grid">
                    <button className="button-small" onClick={() => handleRateChange('deltaAngle', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => handleRateChange('deltaAngle', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => handleRateChange('deltaAngle', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="deltaAngle-change-rate"
                        name="deltaAngle-change-rate"
                        value={changeRates.deltaAngle}
                        onChange={handleRateChangeInput}
                    />
                    <button className="button-small" onClick={() => handleRateChange('deltaAngle', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => handleRateChange('deltaAngle', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => handleRateChange('deltaAngle', 0.1)}>+.1</button>
                </div>

                <div className="toggle-container">
                    <button className="button-small toggle-button" onClick={() => toggleInterval('deltaAngle')}>
                        {isRunning['deltaAngle'] ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>



            <div className="parameter-control">
                <label htmlFor={patternParams.scale}>Scale</label>
                <div className="parameter-grid">
                    <button className="button-small" onClick={() => updateParameter('scale', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => updateParameter('scale', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => updateParameter('scale', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="scale"
                        name="scale"
                        value={patternParams.scale.toString()}
                        onChange={handleParameterChange}
                    />
                    <button className="button-small" onClick={() => updateParameter('scale', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => updateParameter('scale', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => updateParameter('scale', 0.1)}>+.1</button>
                </div>

                <div className="parameter-grid">
                    <button className="button-small" onClick={() => handleRateChange('scale', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => handleRateChange('scale', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => handleRateChange('scale', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="scale-change-rate"
                        name="scale-change-rate"
                        value={changeRates.scale}
                        onChange={handleRateChangeInput}
                    />
                    <button className="button-small" onClick={() => handleRateChange('scale', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => handleRateChange('scale', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => handleRateChange('scale', 0.1)}>+.1</button>
                </div>

                <div className="toggle-container">
                    <button className="button-small toggle-button" onClick={() => toggleInterval('scale')}>
                        {isRunning['scale'] ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>



            <div className="parameter-control">
                <label htmlFor={patternParams.xAngularFreq}>X Angular Frequency</label>
                <div className="parameter-grid">
                    <button className="button-small" onClick={() => updateParameter('xAngularFreq', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => updateParameter('xAngularFreq', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => updateParameter('xAngularFreq', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="xAngularFreq"
                        name="xAngularFreq"
                        value={patternParams.xAngularFreq.toString()}
                        onChange={handleParameterChange}
                    />
                    <button className="button-small" onClick={() => updateParameter('xAngularFreq', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => updateParameter('xAngularFreq', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => updateParameter('xAngularFreq', 0.1)}>+.1</button>
                </div>

                <div className="parameter-grid">
                    <button className="button-small" onClick={() => handleRateChange('xAngularFreq', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => handleRateChange('xAngularFreq', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => handleRateChange('xAngularFreq', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="xAngularFreq-change-rate"
                        name="xAngularFreq-change-rate"
                        value={changeRates.xAngularFreq}
                        onChange={handleRateChangeInput}
                    />
                    <button className="button-small" onClick={() => handleRateChange('xAngularFreq', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => handleRateChange('xAngularFreq', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => handleRateChange('xAngularFreq', 0.1)}>+.1</button>
                </div>

                <div className="toggle-container">
                    <button className="button-small toggle-button" onClick={() => toggleInterval('xAngularFreq')}>
                        {isRunning['xAngularFreq'] ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>



            <div className="parameter-control">
                <label htmlFor={patternParams.yAngularFreq}>Y Angular Frequency</label>
                <div className="parameter-grid">
                    <button className="button-small" onClick={() => updateParameter('yAngularFreq', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => updateParameter('yAngularFreq', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => updateParameter('yAngularFreq', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="yAngularFreq"
                        name="yAngularFreq"
                        value={patternParams.yAngularFreq.toString()}
                        onChange={handleParameterChange}
                    />
                    <button className="button-small" onClick={() => updateParameter('yAngularFreq', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => updateParameter('yAngularFreq', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => updateParameter('yAngularFreq', 0.1)}>+.1</button>
                </div>

                <div className="parameter-grid">
                    <button className="button-small" onClick={() => handleRateChange('yAngularFreq', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => handleRateChange('yAngularFreq', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => handleRateChange('yAngularFreq', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="yAngularFreq-change-rate"
                        name="yAngularFreq-change-rate"
                        value={changeRates.yAngularFreq}
                        onChange={handleRateChangeInput}
                    />
                    <button className="button-small" onClick={() => handleRateChange('yAngularFreq', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => handleRateChange('yAngularFreq', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => handleRateChange('yAngularFreq', 0.1)}>+.1</button>
                </div>

                <div className="toggle-container">
                    <button className="button-small toggle-button" onClick={() => toggleInterval('yAngularFreq')}>
                        {isRunning['yAngularFreq'] ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>



            <div className="parameter-control">
                <label htmlFor={patternParams.xPhase}>X Phase</label>
                <div className="parameter-grid">
                    <button className="button-small" onClick={() => updateParameter('xPhase', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => updateParameter('xPhase', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => updateParameter('xPhase', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="xPhase"
                        name="xPhase"
                        value={patternParams.xPhase.toString()}
                        onChange={handleParameterChange}
                    />
                    <button className="button-small" onClick={() => updateParameter('xPhase', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => updateParameter('xPhase', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => updateParameter('xPhase', 0.1)}>+.1</button>
                </div>

                <div className="parameter-grid">
                    <button className="button-small" onClick={() => handleRateChange('xPhase', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => handleRateChange('xPhase', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => handleRateChange('xPhase', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="xPhase-change-rate"
                        name="xPhase-change-rate"
                        value={changeRates.xPhase}
                        onChange={handleRateChangeInput}
                    />
                    <button className="button-small" onClick={() => handleRateChange('xPhase', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => handleRateChange('xPhase', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => handleRateChange('xPhase', 0.1)}>+.1</button>
                </div>

                <div className="toggle-container">
                    <button className="button-small toggle-button" onClick={() => toggleInterval('xPhase')}>
                        {isRunning['xPhase'] ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>



            <div className="parameter-control">
                <label htmlFor={patternParams.yPhase}>Y Phase</label>
                <div className="parameter-grid">
                    <button className="button-small" onClick={() => updateParameter('yPhase', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => updateParameter('yPhase', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => updateParameter('yPhase', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="yPhase"
                        name="yPhase"
                        value={patternParams.yPhase.toString()}
                        onChange={handleParameterChange}
                    />
                    <button className="button-small" onClick={() => updateParameter('yPhase', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => updateParameter('yPhase', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => updateParameter('yPhase', 0.1)}>+.1</button>
                </div>

                <div className="parameter-grid">
                    <button className="button-small" onClick={() => handleRateChange('yPhase', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => handleRateChange('yPhase', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => handleRateChange('yPhase', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="yPhase-change-rate"
                        name="yPhase-change-rate"
                        value={changeRates.yPhase}
                        onChange={handleRateChangeInput}
                    />
                    <button className="button-small" onClick={() => handleRateChange('yPhase', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => handleRateChange('yPhase', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => handleRateChange('yPhase', 0.1)}>+.1</button>
                </div>

                <div className="toggle-container">
                    <button className="button-small toggle-button" onClick={() => toggleInterval('yPhase')}>
                        {isRunning['yPhase'] ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>



            <div className="parameter-control">
            <div>
                <label className = "param-label" htmlFor={patternParams.loopVertex}>Loop Vertex</label>
                <select
                    className="param-select"
                    value={patternParams.paramsToAdjust[0]}
                    onChange={handleParameterChange}
                >
                    {Object.entries(patternParams).map(([param, value]) => (
                        <option key={param} value={param}>{param}</option>
                    ))}
                </select>
                <input
                    className="param-adjust-amount"
                    type="number"
                    value={patternParams.adjustAmounts[0]}
                    onChange={handleRateChangeInput}
                    />
                </div>
                <div className="parameter-grid">
                    <button className="button-small" onClick={() => updateParameter('loopVertex', -100)}>-100</button>
                    <button className="button-small" onClick={() => updateParameter('loopVertex', -10)}>-10</button>
                    <button className="button-small" onClick={() => updateParameter('loopVertex', -1)}>-1</button>
                    <input
                        className="input-small"
                        type="text"
                        id="loopVertex"
                        name="loopVertex"
                        value={patternParams.loopVertex.toString()}
                        onChange={handleParameterChange}
                    />
                    <button className="button-small" onClick={() => updateParameter('loopVertex', 100)}>+100</button>
                    <button className="button-small" onClick={() => updateParameter('loopVertex', 10)}>+10</button>
                    <button className="button-small" onClick={() => updateParameter('loopVertex', 1)}>+1</button>
                </div>

                <div className="parameter-grid">
                    <button className="button-small" onClick={() => handleRateChange('loopVertex', -0.1)}>-.1</button>
                    <button className="button-small" onClick={() => handleRateChange('loopVertex', -0.01)}>-.01</button>
                    <button className="button-small" onClick={() => handleRateChange('loopVertex', -0.001)}>-.001</button>
                    <input
                        className="input-small"
                        type="text"
                        id="loopVertex-change-rate"
                        name="loopVertex-change-rate"
                        value={changeRates.loopVertex}
                        onChange={handleRateChangeInput}
                    />
                    <button className="button-small" onClick={() => handleRateChange('loopVertex', 0.001)}>+.001</button>
                    <button className="button-small" onClick={() => handleRateChange('loopVertex', 0.01)}>+.01</button>
                    <button className="button-small" onClick={() => handleRateChange('loopVertex', 0.1)}>+.1</button>
                </div>

                <div className="toggle-container">
                    <button className="button-small toggle-button" onClick={() => toggleInterval('loopVertex')}>
                        {isRunning['loopVertex'] ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>



        </div>




    );

};

export default PatternFactory;
