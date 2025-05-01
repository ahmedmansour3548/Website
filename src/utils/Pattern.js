// src/utils/Pattern.js
import * as THREE from 'three';

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

    // NEW: Initialize custom properties for animation.
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
    // Use vertexColors: true so that the "color" attribute is used.
    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: this.opacity
    });
    this.geometry = new THREE.BufferGeometry();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '0';
    if (this.className) {
      this.renderer.domElement.classList.add(this.className);
    }
    document.body.appendChild(this.renderer.domElement);
    // Create a line that will use both the position and color attributes.
    this.scene.add(new THREE.Line(this.geometry, this.material));

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
    let newParams = { ...params };
    // Default rotation values if not provided.
    newParams.xRotation = newParams.xRotation || 0;
    newParams.yRotation = newParams.yRotation || 0;
    newParams.zRotation = newParams.zRotation || 0;

    // Use newParams.maxVertices if provided, else fall back to this.maxVertices.
    const maxVerts = newParams.maxVertices || this.maxVertices;

    // Allocate color buffer matching the number of vertices.
    const colors = new Float32Array(maxVerts * 3);
    const positions = this.positionsArray;
    
    const functionX = this.selectFunction(newParams.xFunctionCode);
    const functionY = this.selectFunction(newParams.yFunctionCode);

    // Ensure paramsToAdjust and adjustAmounts are arrays
    if (!Array.isArray(newParams.paramsToAdjust)) {
      newParams.paramsToAdjust = [newParams.paramsToAdjust];
    }
    if (!Array.isArray(newParams.adjustAmounts)) {
      newParams.adjustAmounts = [newParams.adjustAmounts];
    }

    // Create an Euler from the rotation parameters.
    const euler = new THREE.Euler(newParams.xRotation, newParams.yRotation, newParams.zRotation, 'XYZ');

    let vertexCount = 0;
    let angle = 0;
    // We'll loop until we reach maxVerts vertices.
    while (vertexCount < maxVerts) {
      const scaleFactor = (angle / 180) * Math.PI * newParams.scale;
      const newX = newParams.xPos + angle * functionX((angle * newParams.xAngularFreq) + newParams.xPhase) * scaleFactor;
      const newY = newParams.yPos + angle * functionY((angle * newParams.yAngularFreq) + newParams.yPhase) * scaleFactor;
      const newZ = (newParams.zPos === undefined) ? 0 : newParams.zPos;
      
      // Create a vector and apply the Euler rotation.
      let v = new THREE.Vector3(newX, newY, newZ);
      v.applyEuler(euler);
      
      // Set position data for this vertex.
      positions[vertexCount * 3] = v.x;
      positions[vertexCount * 3 + 1] = v.y;
      positions[vertexCount * 3 + 2] = v.z;
      
      // Determine the color for this vertex.
      // Default to the initial color.
      let assignedColor = this.initalColor;
      if (newParams.vertexColorRanges && Array.isArray(newParams.vertexColorRanges)) {
        // If the current vertex index falls within any specified range, override.
        for (let range of newParams.vertexColorRanges) {
          if (vertexCount >= range.start && vertexCount <= range.end) {
            assignedColor = range.color;
            break;
          }
        }
      }
      // Convert the hex color to normalized RGB values.
      const r = ((assignedColor >> 16) & 0xff) / 255;
      const g = ((assignedColor >> 8) & 0xff) / 255;
      const b = (assignedColor & 0xff) / 255;
      
      colors[vertexCount * 3] = r;
      colors[vertexCount * 3 + 1] = g;
      colors[vertexCount * 3 + 2] = b;
      
      vertexCount++;
      
      // Apply adjustments, if any.
      if (newParams.loopVertex && vertexCount % Math.floor(newParams.loopVertex) === 0) {
      for (let i = 0; i < newParams.paramsToAdjust.length; i++) {
        const param = newParams.paramsToAdjust[i];
        const amt = newParams.adjustAmounts[i];
        if (
          newParams[param] !== undefined &&
          typeof amt === 'number'
        ) {
          newParams[param] += amt;
        }
      }
      angle = 0;
    }
      
      angle += newParams.deltaAngle;
    }
    // Set the attributes for position and color.
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    // Set draw range based on the actual number of vertices generated.
    this.geometry.setDrawRange(0, vertexCount);
  }

  updateMaterialColor(r, g, b) {
    this.material.color.setRGB(r, g, b);
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
