// src/utils/HexagonMenu3D.js
import * as THREE from 'three';
import gsap from 'gsap';

// Helper: Create a text sprite from a canvas.
function createTextSprite(message, parameters = {}) {
  const fontface = parameters.fontface || 'Arial';
  const fontsize = parameters.fontsize || 24;
  const borderThickness = parameters.borderThickness || 4;
  const textColor = parameters.textColor || 'white';

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontsize}px ${fontface}`;
  const textWidth = context.measureText(message).width;
  canvas.width = textWidth + borderThickness * 2;
  canvas.height = fontsize * 1.4 + borderThickness * 2;
  context.font = `${fontsize}px ${fontface}`;
  context.fillStyle = textColor;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(message, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(canvas.width / 10, canvas.height / 10, 1.0);
  return sprite;
}

class HexagonMenu3D {
  constructor(container, categoriesData, navigate) {
    this.container = container;
    // Save the full categories data.
    this.categoriesData = categoriesData;
    this.navigate = navigate;
    this.isClickCooldown = false;
    
    // Process categories into menu groups.
    // Each menu group holds up to maxPerGroup projects.
    const maxPerGroup = 6;
    this.menuGroupData = [];
    categoriesData.forEach(category => {
      const projs = category.projects;
      // For each category, split projects into chunks.
      for (let i = 0; i < projs.length; i += maxPerGroup) {
        const chunk = projs.slice(i, i + maxPerGroup);
        // Also store the category title with each chunk.
        this.menuGroupData.push({ category, projects: chunk });
      }
    });
    this.totalPages = this.menuGroupData.length;
    this.currentPage = 0;
    this.pageSpacing = 600; // Adjust this value to set the gap between pages.
    
    // --- Scene Setup ---
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      2000
    );
    
    // --- Camera Setup ---
    // Start the camera at the center of the first page.
    this.camera.position.set(this.currentPage * this.pageSpacing, 0, 300);
    this.updateCameraLookAt();
    
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '0';
    container.appendChild(this.renderer.domElement);
    
    // --- Create Menu Groups ---
    this.menuGroups = [];
    this.clickableMeshes = [];
    for (let i = 0; i < this.totalPages; i++) {
      const group = new THREE.Group();
      // Position each group linearly along the x-axis.
      group.position.x = i * this.pageSpacing;
      group.position.y = 0;
      group.position.z = 0;
      this.createMenuGroupContent(group, this.menuGroupData[i]);
      this.scene.add(group);
      this.menuGroups.push(group);
    }
    
    // --- Create a Center Mesh for the Category Title ---
    this.centerMesh = this.createCenterMesh();
    this.scene.add(this.centerMesh);
    this.updateCenterMesh();
    
    // --- Raycaster Setup ---
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // --- Event Listeners ---
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    this.container.addEventListener('click', this.onClick.bind(this), false);
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this), false);

    this.animate();
    this.startRandomSpinTimer();
  }
  
  updateCameraLookAt() {
    // Have the camera look at the center of the current page.
    const targetX = this.currentPage * this.pageSpacing;
    this.camera.lookAt(new THREE.Vector3(targetX, 0, 0));
  }
  
  // Slide the camera to the specified page index.
  slideToPage(targetPage) {
    const startX = this.camera.position.x;
    const targetX = targetPage * this.pageSpacing;
    const obj = { x: startX };
    gsap.to(obj, {
      x: targetX,
      duration: 0.5,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camera.position.x = obj.x;
        this.updateCameraLookAt();
      },
      onComplete: () => {
        this.currentPage = targetPage;
        this.updateCenterMesh();
      }
    });
  }
  
  slideLeft() {
    const newPage = (this.currentPage - 1 + this.totalPages) % this.totalPages;
    this.slideToPage(newPage);
  }
  
  slideRight() {
    const newPage = (this.currentPage + 1) % this.totalPages;
    this.slideToPage(newPage);
  }
  
  createCenterMesh() {
    const geometry = new THREE.CircleGeometry(50, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    const circle = new THREE.Mesh(geometry, material);
    circle.position.set(0, 0, -20);
    const sprite = createTextSprite("", { fontsize: 36, textColor: "white" });
    sprite.position.set(0, 0, 1);
    circle.add(sprite);
    circle.userData.titleSprite = sprite;
    return circle;
  }
  
  updateCenterMesh() {
    if (this.centerMesh && this.centerMesh.userData.titleSprite) {
      const activeGroupData = this.menuGroupData[this.currentPage];
      const title = activeGroupData ? activeGroupData.category.title : "";
      // Replace the text sprite.
      this.centerMesh.remove(this.centerMesh.userData.titleSprite);
      const newSprite = createTextSprite(title, { fontsize: 36, textColor: "white" });
      newSprite.position.set(0, 0, 1);
      this.centerMesh.add(newSprite);
      this.centerMesh.userData.titleSprite = newSprite;
    }
  }
  
  createMenuGroupContent(group, groupData) {
    const loader = new THREE.TextureLoader();
    const projectsArray = groupData.projects;
    const count = projectsArray.length;
    const itemRadius = 175;
    for (let i = 0; i < count; i++) {
      const project = projectsArray[i];
      const aspectRatio = project.aspectRatio || (project.headerPhotoWidth / project.headerPhotoHeight) || 1;
      const width = 75 * aspectRatio;
      const height = 75;
      const depth = 5;
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const texture = loader.load(project.headerPhoto);
      const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const imageMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const materials = [
        blackMaterial,
        blackMaterial,
        blackMaterial,
        blackMaterial,
        imageMaterial, // back (local -Z)
        blackMaterial
      ];
      const mesh = new THREE.Mesh(geometry, materials);
      // Position items in a circular layout within the page.
      const angle = (i / count) * Math.PI * 2;
      mesh.position.x = itemRadius * Math.cos(angle);
      mesh.position.y = itemRadius * Math.sin(angle);
      mesh.position.z = 0;
      mesh.userData = { project };
      mesh.userData.initial = {
        position: mesh.position.clone(),
        rotation: mesh.rotation.clone(),
        scale: mesh.scale.clone()
      };
      group.add(mesh);
      this.clickableMeshes.push(mesh);
      gsap.to(mesh.position, {
        y: mesh.position.y + 15,
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    }
  }
  
  startRandomSpinTimer() {
    const delay = Math.random() * 5 + 5;
    this.randomSpinTimeout = setTimeout(() => {
      this.doRandomSpin();
    }, delay * 1000);
  }
  
  doRandomSpin() {
    const activeGroup = this.menuGroups[this.currentPage];
    if (!activeGroup || activeGroup.children.length === 0) {
      this.startRandomSpinTimer();
      return;
    }
    const randomIndex = Math.floor(Math.random() * activeGroup.children.length);
    const mesh = activeGroup.children[randomIndex];
    const spinDegrees = Math.random() < 0.5 ? 360 : -360;
    const initialRotationZ = mesh.rotation.z;
    gsap.to(mesh.rotation, {
      z: mesh.rotation.z + THREE.MathUtils.degToRad(spinDegrees),
      duration: 5.5,
      ease: "back.inOut(1.1)",
      onComplete: () => {
        gsap.to(mesh.rotation, {
          z: initialRotationZ,
          duration: 1,
          ease: "power2.inOut",
          onComplete: () => {
            this.startRandomSpinTimer();
          }
        });
      }
    });
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
  
  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.clickableMeshes);
    const centerTextBox = document.getElementById("center-text-box");
    if (intersects.length > 0 && !this.isClickCooldown) {
      const hoveredProject = intersects[0].object.userData.project;
      if (centerTextBox) {
        centerTextBox.innerText = hoveredProject.title;
      }
    } else {
      if (centerTextBox) {
        centerTextBox.innerText = "";
      }
    }
  }
  
  onClick(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.clickableMeshes);
    if (intersects.length > 0 && !this.isClickCooldown) {
      const clickedMesh = intersects[0].object;
      const project = clickedMesh.userData.project;
      const targetPosition = this.camera.position.clone();
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      targetPosition.add(forward.multiplyScalar(50));
      
      gsap.to(".click-area", { opacity: 0, duration: 0.15 });
      
      gsap.to(clickedMesh.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 0.8,
        ease: "power2.inOut"
      });
      gsap.to(clickedMesh.rotation, {
        x: clickedMesh.rotation.x + Math.PI,
        duration: 0.8,
        ease: "power2.inOut"
      });
      gsap.to(clickedMesh.scale, {
        x: 10,
        y: 10,
        z: 10,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          window.lastProjectFinalTransforms = window.lastProjectFinalTransforms || {};
          window.lastProjectFinalTransforms[project.id] = {
            position: {
              x: clickedMesh.position.x,
              y: clickedMesh.position.y,
              z: clickedMesh.position.z
            },
            rotation: {
              x: clickedMesh.rotation.x,
              y: clickedMesh.rotation.y,
              z: clickedMesh.rotation.z
            },
            scale: {
              x: clickedMesh.scale.x,
              y: clickedMesh.scale.y,
              z: clickedMesh.scale.z
            }
          };
          this.navigate(project.link, { state: { lastProjectId: project.id } });
        }
      });
    }
  }
  
  reverseAnimation(projectId) {
    this.isClickCooldown = true;
    const mesh = this.clickableMeshes.find(m => m.userData.project.id === projectId);
    if (mesh && mesh.userData.initial) {
      const finalTransform = window.lastProjectFinalTransforms && window.lastProjectFinalTransforms[projectId];
      if (finalTransform) {
        mesh.position.set(
          finalTransform.position.x,
          finalTransform.position.y,
          finalTransform.position.z
        );
        mesh.rotation.set(
          finalTransform.rotation.x,
          finalTransform.rotation.y,
          finalTransform.rotation.z
        );
        mesh.scale.set(
          finalTransform.scale.x,
          finalTransform.scale.y,
          finalTransform.scale.z
        );
      }
      gsap.to(mesh.position, {
        x: mesh.userData.initial.position.x,
        y: mesh.userData.initial.position.y,
        z: mesh.userData.initial.position.z,
        duration: 1,
        ease: "power2.inOut"
      });
      gsap.to(mesh.rotation, {
        x: mesh.userData.initial.rotation.x,
        y: mesh.userData.initial.rotation.y,
        z: mesh.userData.initial.rotation.z,
        duration: 2,
        ease: "power2.inOut"
      });
      gsap.to(mesh.scale, {
        x: mesh.userData.initial.scale.x,
        y: mesh.userData.initial.scale.y,
        z: mesh.userData.initial.scale.z,
        duration: 2,
        ease: "power4.inOut",
        onComplete: () => {
          this.isClickCooldown = false;
        }
      });
    }
  }
}

export default HexagonMenu3D;
