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
    this.container      = container;
    this.categoriesData = categoriesData;
    this.navigate       = navigate;

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
      group.lookAt(new THREE.Vector3(0, 0, 0)); // face the origin

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
    container.addEventListener('click',    this._onClick.bind(this));
    container.addEventListener('mousemove',this._onMouseMove.bind(this));
    window.addEventListener('keydown',     this._onKeyDown.bind(this));

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
      const w = 75*aspect, h = 75, d = 5;
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

      // place in the group’s XY plane
      const a = (i / projects.length) * Math.PI * 2;
      mesh.position.set(
        itemRadius * Math.cos(a),
        itemRadius * Math.sin(a),
        0
      );

      mesh.userData = { project: proj };
      group.add(mesh);
      this.clickableMeshes.push(mesh);

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
    // camera on circle of radius = hexRadius+camOffset
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

  // find next non-empty page index in direction
  _getNextIndex(dir) {
    for (let i = 1; i <= this.totalPages; i++) {
      const offset = dir === 'right' ? i : -i;
      const nxt    = (this.currentIndex + offset + this.totalPages) % this.totalPages;
      if (this.menuGroupData[nxt].projects.length > 0) return nxt;
    }
    return this.currentIndex;
  }

  slideRight() {
    const next      = this._getNextIndex('right');
    const steps     = (next - this.currentIndex + this.totalPages) % this.totalPages;
    if (steps === 0) return;
    const oldAngle  = this.angleObj.angle;
    const newAngle  = oldAngle + steps * this.angleStep;
    gsap.to(this.angleObj, {
      angle: newAngle,
      duration: 0.6,
      ease: "power2.inOut",
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
    const next      = this._getNextIndex('left');
    const steps     = (this.currentIndex - next + this.totalPages) % this.totalPages;
    if (steps === 0) return;
    const oldAngle  = this.angleObj.angle;
    const newAngle  = oldAngle - steps * this.angleStep;
    gsap.to(this.angleObj, {
      angle: newAngle,
      duration: 0.6,
      ease: "power2.inOut",
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
    const r = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width)  * 2 - 1;
    this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickableMeshes, false);
    const centerText = document.getElementById("center-text-box");
    if (centerText) {
      centerText.innerText = hits.length
        ? hits[0].object.userData.project.title
        : "";
    }
  }

  _onClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickableMeshes, false);
    if (hits.length) {
      const proj = hits[0].object.userData.project;
      if (proj && this.navigate) {
        this.navigate(proj.link, { state: { projectId: proj.id } });
      }
    }
  }

  _startRandomSpinTimer() {
    const delay = Math.random()*5 + 5;
    this._spinTO = setTimeout(()=>this._doRandomSpin(), delay*1000);
  }
  _doRandomSpin() {
    const group = this.menuGroups[this.currentIndex];
    if (!group || !group.children.length) {
      return this._startRandomSpinTimer();
    }
    const mesh = group.children[Math.floor(Math.random()*group.children.length)];
    const spin = (Math.random()<0.5 ? 1 : -1)*360;
    const init = mesh.rotation.z;
    gsap.to(mesh.rotation, {
      z: init + THREE.MathUtils.degToRad(spin),
      duration: 5.5,
      ease: "back.inOut(1.1)",
      onComplete: () => {
        gsap.to(mesh.rotation, {
          z: init,
          duration: 1,
          ease: "power2.inOut",
          onComplete: ()=>this._startRandomSpinTimer()
        });
      }
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  _onWindowResize() {
    this.camera.aspect = window.innerWidth/window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    clearTimeout(this._spinTO);
    window.removeEventListener('resize', this._onWindowResize.bind(this));
    this.container.removeEventListener('click',    this._onClick.bind(this));
    this.container.removeEventListener('mousemove',this._onMouseMove.bind(this));
    window.removeEventListener('keydown',           this._onKeyDown.bind(this));
    this.scene.clear();
    this.clickableMeshes.length = 0;
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

export default HexagonMenu3D;
