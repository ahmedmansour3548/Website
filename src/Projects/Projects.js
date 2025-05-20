// src/Projects/Projects.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import gsap from 'gsap';
import './Projects.css';

const COLOR_MAP = {
  vrar: 0xf94144,
  art: 0xf3722c,
  programming: 0x577590,
  toys: 0x43aa8b,
  archive: 0x90be6d,
  xplor: 0xf9c74f
};

// clamp z-rotation to ±35°
const MAX_Z_RAD = THREE.MathUtils.degToRad(35);
// overall menu scale
const MENU_SCALE = 0.75;

export default function Projects() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState('coding');
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const menuGroupRef = useRef(null);
  const spriteData = useRef(new Map());
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const hovered = useRef(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const inertiaTween = useRef(null);
  const resetTween = useRef(null);
  const navigate = useNavigate();
const currentColor = `#${(COLOR_MAP[selected] || 0x000000).toString(16).padStart(6, '0')}`;
  // Load categories
  useEffect(() => {
    fetch('/projects.json')
      .then(r => r.json())
      .then(data => {
        setCategories(data.categories);
        if (data.categories.length) {
          setSelected(data.categories[0].id);
        }
      });
  }, []);

  // Init Three.js scene + renderer + interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // create preview overlay
    const previewImg = document.createElement('img');
    Object.assign(previewImg.style, {
      position: 'absolute',
      top: 0, left: 0,
      width: '100vw',
      height: '100vh',
      objectFit: 'cover',
      opacity: '0',
      pointerEvents: 'none',
      transition: 'opacity 0.5s ease'
    });
    container.appendChild(previewImg);

    // scene & camera
    const { clientWidth: W, clientHeight: H } = container;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 3;

    // renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.domElement.classList.add('pattern-canvas');
    container.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // helper: clamp Z rotation
    const clampZ = g => {
      g.rotation.z = THREE.MathUtils.clamp(g.rotation.z, -MAX_Z_RAD, MAX_Z_RAD);
    };

    // pointer handlers
    const onDown = e => {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      velocity.current = { x: 0, y: 0 };
      inertiaTween.current?.kill();
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onMove = e => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const g = menuGroupRef.current;
      if (isDragging.current && g) {
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };
        g.rotation.y += dx * 0.005;
        g.rotation.x += dy * 0.005;
        g.rotation.z += dx * 0.002;
        clampZ(g);
        velocity.current = { x: dx, y: dy };
        return;
      }

      // hover detection
      raycaster.current.setFromCamera(pointer.current, camera);
      const hits = raycaster.current.intersectObjects(
        Array.from(spriteData.current.keys())
      );
      if (hits.length) {
        renderer.domElement.style.cursor = 'pointer';
        const obj = hits[0].object;
        if (hovered.current !== obj) {
          gsap.to(previewImg, { opacity: 0, duration: 0.3 });
          hovered.current?.scale.set(1.5, 0.5, 1);
          hovered.current = obj;
          obj.scale.set(1.7, 0.6, 1);
          previewImg.src = spriteData.current.get(obj).headerPhoto;
          gsap.to(previewImg, { opacity: 0.5, delay: 0.1, duration: 0.5 });
        }
      } else {
        if (!isDragging.current) renderer.domElement.style.cursor = 'auto';
        hovered.current?.scale.set(1.5, 0.5, 1);
        hovered.current = null;
        gsap.to(previewImg, { opacity: 0, duration: 0.5 });
      }
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      renderer.domElement.style.cursor = 'auto';
      const g = menuGroupRef.current;
      if (!g) return;

      const inertia = {
        vx: velocity.current.x * 0.008,
        vy: velocity.current.y * 0.008,
        vz: velocity.current.x * 0.003
      };
      inertiaTween.current = gsap.to(inertia, {
        vx: 0, vy: 0, vz: 0,
        duration: 4,
        ease: 'power2.out',
        onUpdate: () => {
          g.rotation.y += inertia.vx;
          g.rotation.x += inertia.vy;
          g.rotation.z += inertia.vz;
          clampZ(g);
        },
        onComplete: () => {
          resetTween.current = gsap.to(g.rotation, {
            y: 0, x: 0, z: 0,
            duration: 2,
            ease: 'power2.out'
          });
        }
      });
    };

    // click handler: open project
    const onClick = () => {
      if (isDragging.current || !hovered.current) return;
      const proj = spriteData.current.get(hovered.current);
      const bottomTabs = document.querySelector('.category-tabs.bottom');
      const g = menuGroupRef.current;
      gsap.timeline({
        defaults: { duration: 0.5, ease: 'power2.inOut' },
        onComplete: () => navigate(proj.link)
      })
        .to(g.scale, { x: 0, y: 0, z: 0 })
        .to(bottomTabs, { opacity: 0 }, '<');
    };

    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('click', onClick);

    // render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // resize
    const onResize = () => {
      const W = container.clientWidth, H = container.clientHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // cleanup
    return () => {
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      container.removeChild(previewImg);
      container.removeChild(renderer.domElement);
      inertiaTween.current?.kill();
      resetTween.current?.kill();
    };
  }, []);

  // (Re)build & animate the circular menu when selection changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !categories.length) return;

    // remove existing
    const oldGroup = menuGroupRef.current;
    if (oldGroup) {
      oldGroup.children.forEach(c => {
        if (c.type === 'Sprite') spriteData.current.delete(c);
      });
      scene.remove(oldGroup);
    }

    // new group
    const group = new THREE.Group();
    group.scale.set(0, 0, 0);
    group.position.y = 0.3;
    menuGroupRef.current = group;
    scene.add(group);

    // add lines+sprites
    const projs = categories.find(c => c.id === selected)?.projects || [];
    const color = COLOR_MAP[selected];
    const radius = 1.5;

    projs.forEach((proj, i) => {
      const angle = (i / projs.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // connecting line
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(x, y, 0)
        ]),
        new THREE.LineBasicMaterial({ color })
      );
      group.add(line);

      // label sprite
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 512, 128);

      // auto‐size font
      const text = proj.title;
      let fontSize = 64, minFont = 16;
      const margin = 512 * 0.05;
      while (fontSize > minFont) {
        ctx.font = `bold ${fontSize}px "Speculum"`;
        if (ctx.measureText(text).width <= 512 - margin * 2) break;
        fontSize -= 2;
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.ceil(fontSize / 8);
      ctx.strokeStyle = '#000';
      ctx.strokeText(text, 256, 64);
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      ctx.fillText(text, 256, 64);

      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true })
      );
      sprite.position.set(x, y, 0);
      sprite.scale.set(1.5 * MENU_SCALE, 0.375 * MENU_SCALE, 1);
      group.add(sprite);
      spriteData.current.set(sprite, proj);
    });

    // infinite slow orbit
    gsap.to(group.rotation, {
      z: '+=' + Math.PI * 2,
      duration: 120,
      ease: 'none',
      repeat: -1
    });

    // pop‐in scale
    gsap.to(group.scale, {
      x: MENU_SCALE, y: MENU_SCALE, z: MENU_SCALE,
      duration: 0.8, ease: 'elastic.out(1,0.5)'
    });
  }, [categories, selected]);

  // Back-home button timeline
  const goBackHome = () => {
    const group = menuGroupRef.current;
    const tabs = document.querySelector('.category-tabs.bottom');
    gsap.timeline({
      defaults: { duration: 0.5, ease: 'power2.inOut' },
      onComplete: () => navigate('/')
    })
     // spring right a bit, then shoot left off screen
      .to(".projects-back-home", { x: 15, duration: 0.15, ease: "power2.out" }, 0)
      .to(".projects-back-home", { x: -200, duration: 0.5, ease: "power2.out" }, 0.15)
      .to(".projects-back-home", { opacity: 0, duration: 0.2, ease: "linear" }, '<')  // Fade out the back-home button at the same time
      .to(group.scale, { x: 0, y: 0, z: 0 }, '<')
      .to(tabs, { opacity: 0 }, 0)
      .to({}, { duration: 0.4 });
  };

    useEffect(() => {
    gsap.from('.projects-back-home', {
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      delay:    0.1
    });
  }, []);

  useEffect(() => {
    const tabs = gsap.utils.toArray('.category-tabs.bottom .tab');
    tabs.forEach((tab, i) => {
      // decide whether to animate X or Y based on our data-group
      const group = tab.getAttribute('data-group');
      let props = {};
      if (group === 'left') props = { x: '-150vw' };
      if (group === 'middle') props = { y: '150vh' };
      if (group === 'right') props = { x: '150vw' };

      gsap.from(tab, {
        ...props,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.1 + i * 0.05,
      });
    });
  }, []);

  return (
    <div className="projects-page">
      <button className="projects-back-home" onClick={goBackHome} style={{
          '--tab-color': currentColor
        }}>
        <div className="projects-back-icon" aria-hidden="true" alt="Back home"/>
        To Home
      </button>

      <div className="pattern-container" ref={containerRef} />
<div className="category-tabs bottom">
  {/* Left group */}
  <button
    className={`tab ${selected === categories[0]?.id ? 'active' : ''}`}
    data-group="left"
    style={{
      '--tab-color': `#${(
        (COLOR_MAP[categories[0]?.id] ?? 0x000000)
      ).toString(16).padStart(6, '0')}`
    }}
    onClick={() => categories[0] && setSelected(categories[0].id)}
  >
    {categories[0]?.title || ''}
  </button>
  <button
    className={`tab ${selected === categories[1]?.id ? 'active' : ''}`}
    data-group="left"
    style={{
      '--tab-color': `#${(
        (COLOR_MAP[categories[1]?.id] ?? 0x000000)
      ).toString(16).padStart(6, '0')}`
    }}
    onClick={() => categories[1] && setSelected(categories[1].id)}
  >
    {categories[1]?.title || ''}
  </button>

  {/* Middle group */}
  <button
    className={`tab ${selected === categories[2]?.id ? 'active' : ''}`}
    data-group="middle"
    style={{
      '--tab-color': `#${(
        (COLOR_MAP[categories[2]?.id] ?? 0x000000)
      ).toString(16).padStart(6, '0')}`
    }}
    onClick={() => categories[2] && setSelected(categories[2].id)}
  >
    {categories[2]?.title || ''}
  </button>
  <button
    className={`tab ${selected === categories[3]?.id ? 'active' : ''}`}
    data-group="middle"
    style={{
      '--tab-color': `#${(
        (COLOR_MAP[categories[3]?.id] ?? 0x000000)
      ).toString(16).padStart(6, '0')}`
    }}
    onClick={() => categories[3] && setSelected(categories[3].id)}
  >
    {categories[3]?.title || ''}
  </button>

  {/* Right group */}
  <button
    className={`tab ${selected === categories[4]?.id ? 'active' : ''}`}
    data-group="right"
    style={{
      '--tab-color': `#${(
        (COLOR_MAP[categories[4]?.id] ?? 0x000000)
      ).toString(16).padStart(6, '0')}`
    }}
    onClick={() => categories[4] && setSelected(categories[4].id)}
  >
    {categories[4]?.title || ''}
  </button>
  <button
    className={`tab ${selected === categories[5]?.id ? 'active' : ''}`}
    data-group="right"
    style={{
      '--tab-color': `#${(
        (COLOR_MAP[categories[5]?.id] ?? 0x000000)
      ).toString(16).padStart(6, '0')}`
    }}
    onClick={() => categories[5] && setSelected(categories[5].id)}
  >
    {categories[5]?.title || ''}
  </button>
</div>

    </div>
  );
}
