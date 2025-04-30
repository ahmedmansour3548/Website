import * as THREE from 'three';
import './RadialMenu.css';

class RadialMenu {
  constructor(scene, container, camera, menuData, onMeshClick) {
    // Store constructor parameters
    this.scene = scene;
    this.container = container;
    this.camera = camera;
    this.menuData = menuData;
    this.onMeshClick = onMeshClick;

    // Renderer and raycaster
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Mesh and geometry settings
    this.clickMeshes = [];
    this.vertexSets = []; // holds generated vertices for each mesh
    this.colorShiftInterval = 0;
    this.colorShiftSpeed = 400; // controls hue shift speed

    // If using quadrant positioning for sprites, set camera offset to zero
    this.CAMERA_X_OFFSET = 0;

    // Initialize scene, event listeners, and start animation
    this.init();
  }

  /* -------------------------- Initialization -------------------------- */
  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '-1';
    this.container.appendChild(this.renderer.domElement);

    // Bind event handlers
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);

    // Add event listeners
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('click', this.onClick);
    window.addEventListener('resize', this.onWindowResize);

    // Start the render loop
    this.animate();
  }

  onWindowResize() {
    // Update camera and renderer dimensions
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    // Update mouse coordinates in normalized device space
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.checkIntersection();
  }

  onClick(event) {
    // Update mouse coordinates and check for intersections with meshes
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    this.clickMeshes.forEach(mesh => {
      const intersects = this.raycaster.intersectObject(mesh);
      if (intersects.length > 0 && this.onMeshClick) {
        this.onMeshClick(intersects[0].object);
      }
    });
  }

  /* -------------------------- Animation Loop -------------------------- */
  animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
    this.updateMeshColors();

    // Update scrolling offset for text sprites (if any)
    const scrollSpeed = 0.001;
    this.clickMeshes.forEach(mesh => {
      if (mesh.userData?.sprite && mesh.userData.sprite.material.map) {
        mesh.userData.sprite.material.map.offset.x -= scrollSpeed;
      }
    });
  };

  /* -------------------------- Vertex Generation -------------------------- */
  // Generates vertex sets based on a radial layout.
  generateVertices(numVertices) {
    this.vertexSets = [];
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Use 1.2 * the diagonal to ensure full coverage.
    const R = 1.2 * Math.sqrt(width * width + height * height);
    const stepAngle = (2 * Math.PI) / numVertices;

    for (let i = 0; i < numVertices; i++) {
      const angle1 = i * stepAngle;
      const angle2 = (i + 1) * stepAngle;
      this.vertexSets.push({
        origin: [0, 0, 0],
        p1: [R * Math.cos(angle1), R * Math.sin(angle1), 0],
        p2: [R * Math.cos(angle2), R * Math.sin(angle2), 0]
      });
    }
  }

  /* -------------------------- Mesh & Sprite Creation -------------------------- */
  // Creates a mesh (geometry and material) and an associated text sprite.
  createMeshFromSet(set, index, params) {
    // Ensure there is a menu entry for this mesh
    if (this.menuData.length <= index) {
      this.menuData.push({ text: 'Default', url: '#' });
    }

    // Create geometry (a triangle)
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    const vertices = new Float32Array([
      set.origin[0], set.origin[1], set.origin[2],
      set.p1[0],     set.p1[1],     set.p1[2],
      set.p2[0],     set.p2[1],     set.p2[2]
    ]);
    geometry.attributes.position.copyArray(vertices);
    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();

    // Determine base color from index
    const hue = (index / params.numVertices) * 270;
    const color = this.hslToHex(hue, 100, 50);

    // Create mesh material
    const material = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: params.opacity
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.originalColor = color;
    mesh.userData.highlighted = false;

    // Create text sprite for this mesh
    const spriteWidth = window.innerWidth / 2;
    const spriteHeight = window.innerHeight / 2;
    const route = this.menuData[index];
    const sprite = this.createTextSprite(route.text, spriteWidth, spriteHeight, params.opacity);

    // Position the sprite at a quadrant center based on index.
    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    const quadrantCenters = [
        { x: halfWidth / 2,  y: halfHeight / 2 },     // Top Right
        { x: -halfWidth / 2, y: halfHeight / 2 },     // Top Left
      { x: -halfWidth / 2, y: -halfHeight / 2 },      // Bottom Left
      { x: halfWidth / 2,  y: -halfHeight / 2 }       // Bottom Right
    ];
    const pos = quadrantCenters[index % 4];
    sprite.position.set(pos.x, pos.y, 2);

    // Save sprite, URL, and timeline label in mesh userData
    mesh.userData.sprite = sprite;
    mesh.userData.url = route.url;
    mesh.userData.timelineLabel = route.timelineLabel;

    // Add both mesh and sprite to the scene
    this.scene.add(mesh);
    this.scene.add(sprite);
    return mesh;
  }

  /* -------------------------- Mesh Update -------------------------- */
  // Updates the meshes based on the latest parameters.
  updateMeshes(params) {
    // Regenerate vertex sets based on the desired number of meshes
    this.generateVertices(params.numVertices);

    // Loop through each vertex set and create/update meshes
    this.vertexSets.forEach((set, index) => {
      let mesh;
      if (index < this.clickMeshes.length) {
        // Update existing mesh geometry
        mesh = this.clickMeshes[index];
        const vertices = new Float32Array([
          this.CAMERA_X_OFFSET + set.origin[0], set.origin[1], set.origin[2],
          this.CAMERA_X_OFFSET + set.p1[0],     set.p1[1], set.p1[2],
          this.CAMERA_X_OFFSET + set.p2[0],     set.p2[1], set.p2[2]
        ]);
        mesh.geometry.attributes.position.copyArray(vertices);
        mesh.geometry.attributes.position.needsUpdate = true;
        mesh.geometry.computeBoundingSphere();
        mesh.material.opacity = params.opacity;

        // Update sprite's position and opacity
        if (mesh.userData.sprite) {
          const halfWidth = window.innerWidth / 2;
          const halfHeight = window.innerHeight / 2;
          const quadrantCenters = [
              { x: halfWidth / 2,  y: halfHeight / 2 },
              { x: -halfWidth / 2, y: halfHeight / 2 },
            { x: -halfWidth / 2, y: -halfHeight / 2 },
            { x: halfWidth / 2,  y: -halfHeight / 2 }
          ];
          const pos = quadrantCenters[index % 4];
          mesh.userData.sprite.position.set(pos.x, pos.y, 2);
          mesh.userData.sprite.material.opacity = params.opacity;
        }

        const route = this.menuData[index];
        mesh.userData.url = route.url;
        mesh.userData.timelineLabel = route.timelineLabel;
      } else {
        // Create new mesh & sprite if needed
        mesh = this.createMeshFromSet(set, index, params);
        this.clickMeshes.push(mesh);
      }
    });

    // Remove extra meshes if any
    while (this.clickMeshes.length > this.vertexSets.length) {
      const meshToRemove = this.clickMeshes.pop();
      this.scene.remove(meshToRemove);
      if (meshToRemove.userData.sprite) {
        this.scene.remove(meshToRemove.userData.sprite);
      }
      meshToRemove.geometry.dispose();
      meshToRemove.material.dispose();
    }

    // Force a render update
    this.renderer.render(this.scene, this.camera);
  }

  /* -------------------------- Mesh Color Updates -------------------------- */
  updateMeshColors() {
    if (this.clickMeshes.length === 0) return;
    const shiftAmount = (50 / this.colorShiftSpeed) * this.colorShiftInterval;
    this.clickMeshes.forEach(mesh => {
      if (!mesh.userData.highlighted) {
        let hsl = this.hexToHsl(mesh.userData.originalColor);
        hsl[0] = (hsl[0] + shiftAmount) % 360;
        const newColor = this.hslToHex(hsl[0], hsl[1], hsl[2]);
        mesh.material.color.setHex(newColor);
      }
    });
    this.colorShiftInterval++;
  }

  /* -------------------------- Mouse Intersection & Highlight -------------------------- */
  checkIntersection() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.clickMeshes);
    if (intersects.length > 0) {
      if (this.INTERSECTED !== intersects[0].object) {
        if (this.INTERSECTED) this.resetHighlight(this.INTERSECTED);
        this.INTERSECTED = intersects[0].object;
        this.highlightMesh(this.INTERSECTED);
      }
    } else {
      if (this.INTERSECTED) this.resetHighlight(this.INTERSECTED);
      this.INTERSECTED = null;
    }
  }

  highlightMesh(mesh) {
    const baseColor = mesh.userData.originalColor;
    let [h, s, l] = this.hexToHsl(baseColor);
    l = Math.min(l + 20, 100);
    const lighterColor = this.hslToHex(h, s, l);
    mesh.material.color.setHex(lighterColor);
    mesh.userData.highlighted = true;
  }

  resetHighlight(mesh) {
    if (mesh && mesh.userData.originalColor) {
      mesh.material.color.setHex(mesh.userData.originalColor);
      mesh.userData.highlighted = false;
    }
  }

  /* -------------------------- Text Sprite Creation -------------------------- */
  // Creates a text sprite with a repeating pattern (15 rows with horizontal offsets).
  createTextSprite(message, width, height, opacity = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const numRows = 15;
    const fontSize = Math.floor(height / (numRows + 1));
    ctx.font = `${fontSize}px Blockbrokers`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    const textWidth = ctx.measureText(message).width;
    const rowHeight = height / numRows;
    const horizontalGap = fontSize / 2;
    for (let row = 0; row < numRows; row++) {
      const rowOffsetX = (row % 2) * (textWidth * 0.3);
      const yPos = row * rowHeight + rowHeight / 2;
      for (let x = -textWidth; x < canvas.width + textWidth; x += textWidth + horizontalGap) {
        ctx.fillText(message, x + rowOffsetX, yPos);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: opacity,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(width, height, 1);
    return sprite;
  }

  /* -------------------------- Utility: HSL / HEX Conversion -------------------------- */
  hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color);
    };
    return (f(0) << 16) | (f(8) << 8) | f(4);
  }

  hexToHsl(hex) {
    let r = (hex >> 16) & 255;
    let g = (hex >> 8) & 255;
    let b = hex & 255;
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0; break;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  /* -------------------------- Cleanup -------------------------- */
  cleanup() {
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('click', this.onClick);
    window.removeEventListener('resize', this.onWindowResize);
    this.clickMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      if (mesh.userData.sprite) {
        this.scene.remove(mesh.userData.sprite);
        mesh.userData.sprite.material.map.dispose();
        mesh.userData.sprite.material.dispose();
      }
    });
  }
}

export default RadialMenu;
