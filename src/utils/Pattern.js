/**
 * @file Pattern.js
 * @description Generates a configurable geometric line pattern using Three.js with a fluent API for styling.
 */
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

export const PatternStyle = Object.freeze({
  SOLID: 'SOLID',
  DASHED: 'DASHED',
  DOTTED: 'DOTTED'
});

export default class Pattern {
  constructor(scene, camera, { transparent = false, opacity = 1, className = '', initialColor = 0xffffff } = {}) {
    this.scene = scene;
    this.camera = camera;
    this.opacity = opacity;
    this.initialColor = initialColor;
    this.className = className;

    this.maxVertices = 5000;
    this.positions = new Float32Array(this.maxVertices * 3);
    this.colors = new Float32Array(this.maxVertices * 3);

    this.style = PatternStyle.SOLID;
    this.lineWidth = 1;
    this.dashSize = 1;
    this.gapSize = 1;

    this._initRenderer(transparent);
    document.body.appendChild(this.renderer.domElement);
    this._initSceneObjects();
    this._animate();
  }

  _initRenderer(transparent) {
    this.renderer = new THREE.WebGLRenderer({ alpha: transparent, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '0';
    if (this.className) canvas.classList.add(this.className);
  }

  _initSceneObjects() {
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this._createLine();
  }

  _createLine() {
    if (this.lineMesh) {
      this.group.remove(this.lineMesh);
      this.material.dispose();
      this.lineMesh.geometry.dispose();
    }

    // Rebuild geometry from raw buffer (Line2 requires LineGeometry)
    const positions = this.positions.subarray(0, this.maxVertices * 3);
    const colors = this.colors.subarray(0, this.maxVertices * 3);

    this.geometry = new LineGeometry();
    this.geometry.setPositions(Array.from(positions));
    this.geometry.setColors(Array.from(colors));

    this.material = new LineMaterial({
      color: 0xffffff,
      linewidth: this.lineWidth,     // in world units
      transparent: true,
      opacity: this.opacity,
      vertexColors: true,
      dashed: (this.style !== PatternStyle.SOLID),
      dashSize: this.dashSize,
      gapSize: this.gapSize
    });

    this.material.resolution.set(window.innerWidth, window.innerHeight);

    // Auto-update on window resize
    window.addEventListener('resize', () => {
      this.material.resolution.set(window.innerWidth, window.innerHeight);
    });

    this.lineMesh = new Line2(this.geometry, this.material);
    this.group.add(this.lineMesh);
  }

  setLineWidth(width) {
    this.lineWidth = width;
    this._createLine();
    return this;
  }

  setStyle(style, dashSize = 1, gapSize = 1) {
    this.style = style;
    this.dashSize = dashSize;
    this.gapSize = gapSize;
    this._createLine();
    return this;
  }

  setOpacity(opacity) {
    this.opacity = opacity;
    if (this.material) this.material.opacity = opacity;
    return this;
  }

  setColor(hexColor) {
    this.initialColor = hexColor;
    this.setAllVerticesColor(hexColor);
    return this;
  }

  regenerate(options = {}) {
    const opts = {
      deltaAngle     : 1,
      scale          : 1,
      xPos           : 0,
      yPos           : 0,
      zPos           : 0,
      xAngularFreq   : 1,
      yAngularFreq   : 1,
      xPhase         : 0,
      yPhase         : 0,
      xFunctionCode  : 1,
      yFunctionCode  : 1,
      maxVertices    : this.maxVertices,
      colorCallback  : null,
      ...options
    };

    const fnX = this._resolveFunction(opts.xFunctionCode);
    const fnY = this._resolveFunction(opts.yFunctionCode);

    /* ------------------------------------------------------------------ */
    /* 1. Fill the raw typed buffers                                      */
    /* ------------------------------------------------------------------ */
    let angle = 0;
    let idx   = 0;

    while (idx < opts.maxVertices) {
      const rad = THREE.MathUtils.degToRad(angle);
      const f   = rad * opts.scale;

      const x   = opts.xPos + angle * fnX(angle * opts.xAngularFreq + opts.xPhase) * f;
      const y   = opts.yPos + angle * fnY(angle * opts.yAngularFreq + opts.yPhase) * f;
      const i3  = idx * 3;

      this.positions[i3    ] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = opts.zPos;

      let r, g, b;
      if (typeof opts.colorCallback === 'function') {
        [r, g, b] = opts.colorCallback(angle, idx);
      } else {
        [r, g, b] = this._hexToRGB(this.initialColor);
      }

      this.colors[i3    ] = r;
      this.colors[i3 + 1] = g;
      this.colors[i3 + 2] = b;

      angle += opts.deltaAngle;
      idx++;
    }

    /* ------------------------------------------------------------------ */
    /* 2. We need ≥2 vertices for LineGeometry — otherwise keep old mesh  */
    /* ------------------------------------------------------------------ */
    if (idx < 2) return this;          // → nothing to upload yet; try again next frame

    /* Ensure an even count (LineGeometry requirement)                    */
    if (idx & 1) {                     // odd?
      const src3  = (idx - 1) * 3;
      const dest3 =  idx      * 3;
      this.positions.set(this.positions.subarray(src3, src3 + 3), dest3);
      this.colors   .set(this.colors   .subarray(src3, src3 + 3), dest3);
      idx++;
    }

    /* ------------------------------------------------------------------ */
    /* 3. Upload trimmed arrays                                           */
    /* ------------------------------------------------------------------ */
    this.geometry.setPositions(
      Array.from(this.positions.subarray(0, idx * 3))
    );
    this.geometry.setColors(
      Array.from(this.colors.subarray(0, idx * 3))
    );

    /* ------------------------------------------------------------------ */
    /* 4. Dash / dot distances                                            */
    /* ------------------------------------------------------------------ */
    if (this.style !== PatternStyle.SOLID) {
      this._computeLineDistances();
    }

    return this;
  }



  _computeLineDistances() {
    const posAttr = this.geometry.attributes.position;
    const count = posAttr.count;
    const lineDistances = new Float32Array(count);
    let cumulative = 0;
    let x1, y1, z1, x2, y2, z2;

    x1 = posAttr.getX(0);
    y1 = posAttr.getY(0);
    z1 = posAttr.getZ(0);
    lineDistances[0] = 0;

    for (let i = 1; i < count; i++) {
      x2 = posAttr.getX(i);
      y2 = posAttr.getY(i);
      z2 = posAttr.getZ(i);
      cumulative += Math.hypot(x2 - x1, y2 - y1, z2 - z1);
      lineDistances[i] = cumulative;
      x1 = x2; y1 = y2; z1 = z2;
    }

    this.geometry.setAttribute('lineDistance', new THREE.BufferAttribute(lineDistances, 1));
  }

  /** ------------------------------------------------------------------
    * Paint every existing vertex the same colour.
    * - If there are no vertices (or no colour attribute yet) we just
    *   remember the colour for later and bail out safely.
    * ----------------------------------------------------------------- */
  setAllVerticesColor(hex) {
    // 1. Convert once
    const [r, g, b] = this._hexToRGB(hex);

    // 2. How many vertices do we currently have?
    const posAttr = this.geometry.getAttribute('position');
    if (!posAttr) {
      // No geometry yet → Just store the default colour and exit
      this.initialColor = hex;
      return this;
    }
    const vertexCount = posAttr.count;
    if (vertexCount === 0) {
      // Still no vertices (pattern hasn’t been generated yet)
      this.initialColor = hex;
      return this;
    }

    /* 3. Fill our typed colour buffer */
    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3;
      this.colors[i3] = r;
      this.colors[i3 + 1] = g;
      this.colors[i3 + 2] = b;
    }

    /* 4. Upload to the LineGeometry (creates or replaces the attribute) */
    this.geometry.setColors(
      Array.from(this.colors.subarray(0, vertexCount * 3))
    );

    return this;
  }

  transitionColors(a, b, t) {
    const attr = this.geometry.getAttribute('color');
    if (!attr) return this;            // ← pattern hasn’t been generated yet

    const arr   = attr.array;
    const count = attr.count;

    const [rA, gA, bA] = this._hexToRGB(a);
    const [rB, gB, bB] = this._hexToRGB(b);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3]     = THREE.MathUtils.lerp(rA, rB, t);
      arr[i3 + 1] = THREE.MathUtils.lerp(gA, gB, t);
      arr[i3 + 2] = THREE.MathUtils.lerp(bA, bB, t);
    }
    attr.needsUpdate = true;
    return this;
  }


  _hexToRGB(hex) {
    return [
      ((hex >> 16) & 0xff) / 255,
      ((hex >> 8) & 0xff) / 255,
      (hex & 0xff) / 255,
    ];
  }

  _resolveFunction(code) {
    const fns = [Math.cos, Math.sin, Math.tan, Math.acos, Math.asin,
    Math.sinh, Math.cosh, Math.exp, Math.log10, Math.sqrt,
    Math.abs, Math.cbrt, x => x, () => 0, x => Math.cos(x) ** 2,
    x => Math.sin(x) ** 2, x => Math.tan(x) ** 2, x => Math.sin(x) * Math.cos(x),
    x => Math.cos(x) * Math.sin(x), x => 1 / (1 + Math.exp(-x)), x => Math.log(x + 1),
    x => Math.sin(Math.hypot(x, x)), x => Math.cos(x) / Math.sin(x), x => (x ** 2 - 1) / (x + 1),
    x => Math.exp(-x) * Math.sin(x), x => Math.atan(x), x => Math.sin(x) * Math.exp(Math.cos(x)) - Math.cos(x) * Math.exp(Math.sin(x))
    ];
    return fns[Math.floor(code)] || Math.sin;
  }

  _animate() {
    requestAnimationFrame(this._animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.remove(this.group);
    this.material.dispose();
    this.geometry.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
