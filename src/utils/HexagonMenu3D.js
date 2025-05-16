// src/utils/HexagonMenu3D.js
import * as THREE from 'three';
import gsap from 'gsap';

function createTextSprite(message, parameters = {}) {
  const fontface        = parameters.fontface        || 'Arial';
  const fontsize        = parameters.fontsize        || 24;
  const borderThickness = parameters.borderThickness || 4;
  const textColor       = parameters.textColor       || 'white';

  const canvas  = document.createElement('canvas');
  const ctx     = canvas.getContext('2d');
  ctx.font      = `${fontsize}px ${fontface}`;
  const textW   = ctx.measureText(message).width;
  canvas.width  = textW + borderThickness * 2;
  canvas.height = fontsize * 1.4 + borderThickness * 2;

  ctx.font         = `${fontsize}px ${fontface}`;
  ctx.fillStyle    = textColor;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, canvas.width/2, canvas.height/2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite   = new THREE.Sprite(material);
  sprite.scale.set(canvas.width/10, canvas.height/10, 1);
  return sprite;
}

class HexagonMenu3D {
  constructor(container, categoriesData, navigate) {
    this.container         = container;
    this.categoriesData    = categoriesData;
    this.navigate          = navigate;
    this.lastHoveredMesh   = null;       // ← track for hover feedback

    // paginate into pages of up to 6 projects
    const maxPer = 6;
    this.menuGroupData = [];
    categoriesData.forEach(cat => {
      for (let i = 0; i < cat.projects.length; i += maxPer) {
        this.menuGroupData.push({
          category: cat,
          projects: cat.projects.slice(i, i + maxPer)
        });
      }
    });
    this.totalPages   = this.menuGroupData.length;
    this.currentIndex = 0;
    this.targetAngle  = 0;               // cumulative target angle

    // hexagon constants
    this.hexRadius = 600;
    this.angleStep = Math.PI * 2 / 6;
    this.camOffset = 300;

    // track the camera’s cumulative angle (radians)
    this.angleObj = { angle: 0 };

    // three.js boilerplate
    this.scene    = new THREE.Scene();
    this.camera   = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 2000);
    this.renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    Object.assign(this.renderer.domElement.style, {
      position:'fixed', top:'0', left:'0', zIndex:'0'
    });
    container.appendChild(this.renderer.domElement);

    // build each page as a group at hexagon vertices
    this.menuGroups      = [];
    this.clickableMeshes = [];
    for (let i = 0; i < this.totalPages; i++) {
      const group = new THREE.Group();
      const angle = i * this.angleStep;
      group.position.set(
        this.hexRadius * Math.cos(angle),
        0,
        this.hexRadius * Math.sin(angle)
      );
      group.lookAt(new THREE.Vector3(0, 0, 0));

      this._buildGroupContent(group, this.menuGroupData[i]);
      this.scene.add(group);
      this.menuGroups.push(group);
    }

    // start camera at index 0 (angle 0)
    this._updateCamera();

    // interactions
    this.raycaster = new THREE.Raycaster();
    this.mouse     = new THREE.Vector2();
    window.addEventListener('resize', this._onWindowResize.bind(this));
    container.addEventListener('click',     this._onClick.bind(this));
    container.addEventListener('mousemove', this._onMouseMove.bind(this));
    window.addEventListener('keydown',      this._onKeyDown.bind(this));

    this.animate();
    this._startRandomSpinTimer();
  }

  _buildGroupContent(group, { projects }) {
    const loader     = new THREE.TextureLoader();
    const itemRadius = 175;

    projects.forEach((proj, i) => {
      const aspect = proj.aspectRatio ||
                     (proj.headerPhotoWidth/proj.headerPhotoHeight) ||
                     1;
      const w = 75 * aspect, h = 75, d = 5;
      const geo = new THREE.BoxGeometry(w, h, d);
      const tex = loader.load(proj.headerPhoto);
      const mats = [
        new THREE.MeshBasicMaterial({ color:0x000 }),
        new THREE.MeshBasicMaterial({ color:0x000 }),
        new THREE.MeshBasicMaterial({ color:0x000 }),
        new THREE.MeshBasicMaterial({ color:0x000 }),
        new THREE.MeshBasicMaterial({ map:tex, transparent:true }),
        new THREE.MeshBasicMaterial({ color:0x000 })
      ];
      const mesh = new THREE.Mesh(geo, mats);

      // place in the group’s plane
      const a = (i / projects.length) * Math.PI * 2;
      mesh.position.set(
        itemRadius * Math.cos(a),
        itemRadius * Math.sin(a),
        0
      );

      mesh.userData = { project: proj };
      group.add(mesh);
      this.clickableMeshes.push(mesh);

      // floating animation
      gsap.to(mesh.position, {
        y: mesh.position.y + 15,
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    });
  }

  // move the camera based on angleObj.angle, and look at the current group center
  _updateCamera() {
    const a   = this.angleObj.angle;
    const gp  = new THREE.Vector3(
      this.hexRadius * Math.cos(a),
      0,
      this.hexRadius * Math.sin(a)
    );
    const dir = gp.clone().normalize().negate();
    const cp  = gp.clone().add(dir.multiplyScalar(this.camOffset));
    this.camera.position.copy(cp);
    this.camera.lookAt(gp);
  }

  _getNextIndex(dir) {
    for (let i = 1; i <= this.totalPages; i++) {
      const offset = dir === 'right' ? i : -i;
      const nxt    = (this.currentIndex + offset + this.totalPages) % this.totalPages;
      if (this.menuGroupData[nxt].projects.length > 0) return nxt;
    }
    return this.currentIndex;
  }

  slideRight() {
    const next  = this._getNextIndex('right');
    const steps = (next - this.currentIndex + this.totalPages) % this.totalPages;
    if (steps === 0) return;

    this.targetAngle += steps * this.angleStep;
    gsap.killTweensOf(this.angleObj);
    gsap.to(this.angleObj, {
      angle:    this.targetAngle,
      duration: 0.6,
      ease:     "power2.inOut",
      onUpdate: () => this._updateCamera(),
      onComplete: () => {
        this.currentIndex = next;
        if (typeof this.onPageChange === 'function') {
          const meshCount = this.menuGroupData[next].projects.length;
          this.onPageChange(next, meshCount);
        }
      }
    });
  }

  slideLeft() {
    const next  = this._getNextIndex('left');
    const steps = (this.currentIndex - next + this.totalPages) % this.totalPages;
    if (steps === 0) return;

    this.targetAngle -= steps * this.angleStep;
    gsap.killTweensOf(this.angleObj);
    gsap.to(this.angleObj, {
      angle:    this.targetAngle,
      duration: 0.6,
      ease:     "power2.inOut",
      onUpdate: () => this._updateCamera(),
      onComplete: () => {
        this.currentIndex = next;
        if (typeof this.onPageChange === 'function') {
          const meshCount = this.menuGroupData[next].projects.length;
          this.onPageChange(next, meshCount);
        }
      }
    });
  }

  _onKeyDown(e) {
    if (e.key === "ArrowLeft")  this.slideLeft();
    if (e.key === "ArrowRight") this.slideRight();
  }

  _onMouseMove(e) {
    // Update normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  
    // Raycast against all clickable meshes
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickableMeshes, false);
  
    // — Hover scale feedback for 3D items —
    if (this.lastHoveredMesh && this.lastHoveredMesh !== hits[0]?.object) {
      gsap.to(this.lastHoveredMesh.scale, { x:1, y:1, z:1, duration:0.3 });
      this.lastHoveredMesh = null;
    }
    if (hits.length) {
      const mesh = hits[0].object;
      if (this.lastHoveredMesh !== mesh) {
        this.lastHoveredMesh = mesh;
        gsap.to(mesh.scale, { x:1.1, y:1.1, z:1.1, duration:0.3 });
      }
    }
  
    // — Center text wireframe show/hide & sizing —
    const centerText = document.getElementById("center-text-box");
    const wrapper    = centerText.parentElement;
    if (hits.length) {
      // Set and size the title
      const title = hits[0].object.userData.project.title;
      centerText.innerText = title;
  
      // Dynamically size the wrapper (padding ~32px)
      const textW   = centerText.scrollWidth;
      const padding = 32;
      wrapper.style.width   = Math.min(window.innerWidth * 0.8, textW + padding) + "px";
  
      // Fade in the wireframe box
      wrapper.style.opacity = 1;
    } else {
      // No hit: clear text & fade out
      centerText.innerText = "";
      wrapper.style.opacity = 0;
    }
  }
  

_onClick() {
  this.raycaster.setFromCamera(this.mouse, this.camera);
  const hits = this.raycaster.intersectObjects(this.clickableMeshes, false);
  if (!hits.length) return;

  const mesh = hits[0].object;
  const proj = mesh.userData.project;
  if (!proj || !this.navigate) return;

  // stop render loop
  this._stopAnimation = true;

  // prepare overlay
  let overlay = document.querySelector('.screen-transition-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'screen-transition-overlay';
    Object.assign(overlay.style, {
      position:     'fixed',
      top:          '0',
      left:         '0',
      width:        '100%',
      height:       '100%',
      background:   'black',
      opacity:      '0',
      pointerEvents:'none',
      zIndex:       '10000'
    });
    document.body.appendChild(overlay);
  }

  // build GSAP timeline
  const tl = gsap.timeline({
    defaults: { duration: 0.8, ease: "power2.inOut" },
    onComplete: () => {
      // clean up the overlay so it doesn't persist into the next page
      overlay.remove();
      // now navigate
      this.navigate(proj.link, { state: { projectId: proj.id } });
    }
  });

  // flip mesh 180° on Y
  tl.to(mesh.rotation, {
    y: mesh.rotation.y + Math.PI,
  }, 0);

  // move mesh toward camera
  const camPos = this.camera.position.clone();
  tl.to(mesh.position, {
    x: camPos.x,
    y: camPos.y,
    z: camPos.z - 10,
  }, 0);

  // fade in the overlay half-way
  tl.to(overlay, {
    opacity: 1,
    duration: 0.5,
  }, 0.4);
}


  _startRandomSpinTimer() {
    const delay = Math.random() * 5 + 5;
    this._spinTO = setTimeout(() => this._doRandomSpin(), delay * 1000);
  }

  _doRandomSpin() {
    const group = this.menuGroups[this.currentIndex];
    if (!group?.children.length) return this._startRandomSpinTimer();

    const mesh = group.children[Math.floor(Math.random() * group.children.length)];
    const spin = (Math.random() < 0.5 ? 1 : -1) * 360;
    const init = mesh.rotation.z;

    gsap.to(mesh.rotation, {
      z: init + THREE.MathUtils.degToRad(spin),
      duration: 5.5,
      ease:     "back.inOut(1.1)",
      onComplete: () => {
        gsap.to(mesh.rotation, {
          z: init,
          duration: 1,
          ease:     "power2.inOut",
          onComplete: () => this._startRandomSpinTimer()
        });
      }
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  _onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    clearTimeout(this._spinTO);
    window.removeEventListener('resize', this._onWindowResize.bind(this));
    this.container.removeEventListener('click',     this._onClick.bind(this));
    this.container.removeEventListener('mousemove', this._onMouseMove.bind(this));
    window.removeEventListener('keydown',           this._onKeyDown.bind(this));
    this.scene.clear();
    this.clickableMeshes.length = 0;
    this.renderer.dispose();
    this.renderer.domElement.parentNode?.removeChild(this.renderer.domElement);
  }
}

export default HexagonMenu3D;
