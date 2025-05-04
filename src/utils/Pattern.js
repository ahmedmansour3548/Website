// src/utils/Pattern.js
import * as THREE from 'three';
import gsap from 'gsap';
class Pattern {
  constructor(scene, camera, transparent = false, opacity = 1, className = '', initalColor = 0xffffff) {
    this.maxVertices = 5000;
    this.positionsArray = new Float32Array(this.maxVertices * 3);
    // (We’ll allocate the colors array later in regeneratePatternArea.)
    this.opacity = opacity;
    this.INTERSECTED = null;
    this.raycaster = new THREE.Raycaster();
    this.scene = scene;
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.geometry = new THREE.BufferGeometry();
    this.camera = camera;
    this.mouse = new THREE.Vector2();
    this.CAMERA_X_OFFSET = 0;
    this.CAMERA_Y_OFFSET = 0;
    this.CAMERA_Z_OFFSET = 500;
    this.className = className;
    this.initalColor = initalColor;

    // Our container group for the entire pattern
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.xRotation = 0;  // rotation about world X-axis (in radians)
    this.yRotation = 0;  // rotation about world Y-axis (in radians)
    this.zRotation = 0;  // rotation about world Z-axis (in radians)
    this.value = 1000;   // Default vertex count value (or similar parameter)
    this.xAxis = 0;
    this.yAxis = 0;
    this.zPos = 0;       // Default Z position for vertices

    this.init();
  }

  init() {
    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: this.opacity
    });
    this.geometry = new THREE.BufferGeometry();

    // Our line mesh
    this.line = new THREE.Line(this.geometry, this.material);
    this.group.add(this.line);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top      = '0';
    this.renderer.domElement.style.left     = '0';
    this.renderer.domElement.style.zIndex   = '0';
    if (this.className) {
      this.renderer.domElement.classList.add(this.className);
    }
    document.body.appendChild(this.renderer.domElement);

    this.animate();
  }

  /**
   * regeneratePatternArea now accepts three additional rotation parameters: 
   * xRotation, yRotation, and zRotation.
   * It now also accepts an optional vertexColorRanges array.
   *
   * The vertexColorRanges array should contain objects like:
   *   { start: 100, end: 200, color: 0xff0000 }
   * which indicates that vertices with indices 100 to 200 (inclusive)
   * should be colored red.
   */
  regeneratePatternArea(params) {
    const p = { 
      deltaAngle: this.deltaAngle,
      xAxis:      this.xAxis,
      value:      this.value,
      ...params
    };

    const maxVerts = p.maxVertices || this.maxVertices;
    const positions = this.positionsArray;
    const colors    = new Float32Array(maxVerts * 3);

    const fnX = this.selectFunction(p.xFunctionCode);
    const fnY = this.selectFunction(p.yFunctionCode);

    let vertexCount = 0, angle = 0;
    while (vertexCount < maxVerts) {
      const scaleF = (angle/180) * Math.PI * p.scale;
      const x = p.xPos + angle * fnX(angle * p.xAngularFreq + p.xPhase) * scaleF;
      const y = p.yPos + angle * fnY(angle * p.yAngularFreq + p.yPhase) * scaleF;
      const z = p.zPos || 0;

      positions[vertexCount*3  ] = x;
      positions[vertexCount*3+1] = y;
      positions[vertexCount*3+2] = z;

      // color each vertex same initial color
      const c = this.initalColor;
      colors[vertexCount*3  ] = ((c>>16)&0xff)/255;
      colors[vertexCount*3+1] = ((c>> 8)&0xff)/255;
      colors[vertexCount*3+2] =  (c      &0xff)/255;

      vertexCount++;
      angle += p.deltaAngle;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate    = true;
    this.geometry.setDrawRange(0, vertexCount);
  }

  updateMaterialColor(r, g, b) {
    //this.material.color.setRGB(r, g, b);
    this.geometry.setAttribute('color', new THREE.BufferAttribute({r, g, b}, 3));
    this.geometry.attributes.color.needsUpdate = true;
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  cleanup() {
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode === document.body) {
      document.body.removeChild(this.renderer.domElement);
    }
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('click', this.onClick);
  }
  

  selectFunction(code) {
    switch (Math.floor(code)) {
      case 0: return Math.cos;
      case 1: return Math.sin;
      case 2: return Math.tan;
      case 3: return Math.acos;
      case 4: return Math.asin;
      case 5: return Math.sinh;
      case 6: return Math.cosh;
      case 7: return Math.exp;
      case 8: return Math.log10;
      case 9: return Math.sqrt;
      case 10: return Math.abs;
      case 11: return Math.cbrt;
      case 12: return this.linear;
      case 13: return this.zero;
      case 14: return (x) => Math.cos(x) ** 2; // cos^2
      case 15: return (x) => Math.sin(x) ** 2; // sin^2
      case 16: return (x) => Math.tan(x) ** 2; // tan^2
      case 17: return (x) => Math.sin(x) * Math.cos(x);
      case 18: return (x) => Math.cos(x) * Math.sin(x);
      case 19: return (x) => 1 / (1 + Math.exp(-x)); // Sigmoid function
      case 20: return (x) => Math.log(x + 1); // Natural log(x+1)
      case 21: return (x) => Math.sin(Math.sqrt(x ** 2 + x ** 2));
      case 22: return (x) => Math.cos(x) / Math.sin(x);
      case 23: return (x) => (x ** 2 - 1) / (x ** 1 + 1);
      case 24: return (x) => Math.exp(-x) * Math.sin(x);
      case 25: return (x) => Math.atan(x);
      case 26: return (x) => Math.sin(x) * Math.exp(Math.cos(x)) - Math.cos(x) * Math.exp(Math.sin(x));
      default: return Math.sin;
    }
  }

  linear(num) {
    return num;
  }

  zero() {
    return 0;
  }
}

export default Pattern;
