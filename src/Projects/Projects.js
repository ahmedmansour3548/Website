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

const MENU_SCALE = 0.75;
const PORTRAIT_MIN_RATIO = 0.8;

export default function Projects() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState('coding');
  const [showSoon, setShowSoon] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(
    window.innerWidth < 600 && window.innerHeight > window.innerWidth
  );
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const menuGroupRef = useRef(null);
  const spriteData = useRef(new Map());
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const hovered = useRef(null);
  const isTransitioning = useRef(false);
  const pendingHover = useRef(null);

  const navigate = useNavigate();
  const currentColor = `#${(COLOR_MAP[selected] || 0x000000)
    .toString(16).padStart(6, '0')}`;

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

  // Init Three.js + interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // preview overlay
    const previewImg = document.createElement('img');
    Object.assign(previewImg.style, {
      position: 'absolute', top: 0, left: 0,
      width: '100vw', height: '100vh',
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

    // pointermove: update coords only
    const onMove = e => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    // handle hover transitions
    const startTransition = obj => {
      isTransitioning.current = true;
      // scale swap
      hovered.current?.scale.set(1.5, 0.5, 1);
      hovered.current = obj;
      obj.scale.set(1.7, 0.6, 1);

      const newSrc = spriteData.current.get(obj)?.headerPhoto;
      gsap.to(previewImg, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          previewImg.src = newSrc;
          gsap.to(previewImg, {
            opacity: 0.5,
            duration: 0.5,
            delay: 0.1,
            onComplete: () => {
              isTransitioning.current = false;
              if (pendingHover.current && pendingHover.current !== hovered.current) {
                const next = pendingHover.current;
                pendingHover.current = null;
                startTransition(next);
              }
            }
          });
        }
      });
    };

    const updateHover = () => {
      raycaster.current.setFromCamera(pointer.current, camera);
      const hits = raycaster.current.intersectObjects(
        Array.from(spriteData.current.keys())
      );
      if (hits.length) {
        renderer.domElement.style.cursor = 'pointer';
        const obj = hits[0].object;
        if (hovered.current !== obj) {
          if (!isTransitioning.current) {
            startTransition(obj);
          } else {
            pendingHover.current = obj;
          }
        }
      } else {
        // mouse left all sprites
        if (!isTransitioning.current && hovered.current) {
          hovered.current.scale.set(1.5, 0.5, 1);
          hovered.current = null;
          gsap.to(previewImg, { opacity: 0, duration: 0.5 });
        }
        renderer.domElement.style.cursor = 'auto';
      }
    };

    // click to navigate
    const onClick = () => {
      if (!hovered.current) return;
      const proj = spriteData.current.get(hovered.current);
      const tabs = document.querySelector('.category-tabs.bottom');
      const g = menuGroupRef.current;

      gsap.timeline({
        defaults: { duration: 0.5, ease: 'power2.inOut' },
        onComplete: () => navigate(proj.link)
      })
        .to(g.scale, { x: 0, y: 0, z: 0 })
        .to(tabs, { opacity: 0 }, '<');
    };

    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('click', onClick);

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouchDevice) {
  const onTouchStart = e => {
    onMove(e);      // update pointer coords
    updateHover();  // do the hover‐preview immediately
    if (hovered.current) {
      onClick();    // trigger your same click/navigation logic
    }
  };
  renderer.domElement.addEventListener('pointerdown', onTouchStart);

  // cleanup
  var cleanupTouch = () => {
    renderer.domElement.removeEventListener('pointerdown', onTouchStart);
  };
} 

    // render loop
    const animate = () => {
      requestAnimationFrame(animate);
      updateHover();
      renderer.render(scene, camera);
    };
    animate();

    // handle resize
    const onResize = () => {
      const W = container.clientWidth, H = container.clientHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();

      // responsive wheel scale
      const isPortrait = W < H;
      const factor = isPortrait
        ? Math.max(W / H, PORTRAIT_MIN_RATIO)
        : 1;
      const dynamicScale = MENU_SCALE * factor;
      cameraRef.current.position.z = 3 / factor;

      const group = menuGroupRef.current;
      if (group) {
        // resize the whole wheel
        group.scale.set(dynamicScale, dynamicScale, dynamicScale);
        // resize each spoke‑label sprite
        spriteData.current.forEach((proj, sprite) => {
          sprite.scale.set(
            1.5 * dynamicScale,
            0.375 * dynamicScale,
            1
          );
        });
      }
    };
    window.addEventListener('resize', onResize);

    // cleanup
    return () => {
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      container.removeChild(previewImg);
      container.removeChild(renderer.domElement);
      if (cleanupTouch) cleanupTouch();
    };
  }, []);

    useEffect(() => {
    const onMPResize = () => {
      setIsMobilePortrait(
        window.innerWidth < 600 &&
        window.innerHeight > window.innerWidth
      );
    };
    window.addEventListener('resize', onMPResize);
    return () => window.removeEventListener('resize', onMPResize);
  }, []);

  // build & animate the circular menu
  useEffect(() => {
    const scene = sceneRef.current;
    const container = containerRef.current;
    if (!scene || !categories.length) return;

    const W = container.clientWidth;
    const H = container.clientHeight;
    const isPortrait = W < H;
    const factor = isPortrait
      ? Math.max(W / H, PORTRAIT_MIN_RATIO)
      : 1;
    const dynamicScale = MENU_SCALE * factor;

    cameraRef.current.position.z = 3 / factor;
    // remove old
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

    // add items
    const projs = categories.find(c => c.id === selected)?.projects || [];
    const color = COLOR_MAP[selected];
    const radius = 1.5;

    projs.forEach((proj, i) => {
      const angle = (i / projs.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // line
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(x, y, 0)
        ]),
        new THREE.LineBasicMaterial({ color })
      );
      group.add(line);

      // sprite
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 512, 128);

            const words = proj.title.split(' ');
      let lines = [proj.title];
      if (isPortrait && words.length > 1) {
        const mid = Math.ceil(words.length / 2);
        lines = [
          words.slice(0, mid).join(' '),
          words.slice(mid).join(' ')
        ];
      }

      // find best fontSize
      let fontSize = 64, minFont = 24, margin = 512 * 0.05;
      while (fontSize > minFont) {
        ctx.font = `bold ${fontSize}px "Speculum"`;
        const widest = Math.max(
          ...lines.map(line => ctx.measureText(line).width)
        );
        if (widest <= 512 - margin * 2) break;
        fontSize -= 2;
      }

      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth    = Math.ceil(fontSize / 8);
      ctx.strokeStyle  = '#000';
      ctx.fillStyle    = `#${color.toString(16).padStart(6, '0')}`;

      // draw each line, vertically centered
      const lineHeight = fontSize * 1.2;
      lines.forEach((line, idx) => {
        const y = 64 + (idx - (lines.length - 1) / 2) * lineHeight;
        ctx.strokeText(line, 256, y);
        ctx.fillText  (line, 256, y);
      });

      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true })
      );
      sprite.position.set(x, y, 0);
      sprite.scale.set(1.5 * dynamicScale, 0.375 * dynamicScale, 1);
      group.add(sprite);
      spriteData.current.set(sprite, proj);
    });

    // slow orbit
    gsap.to(group.rotation, {
      z: '+=' + Math.PI * 2,
      duration: 120,
      ease: 'none',
      repeat: -1
    });

    // pop‑in
    gsap.to(group.scale, {
      x: dynamicScale, y: dynamicScale, z: dynamicScale,
      duration: 0.8,
      ease: 'elastic.out(1,0.5)'
    });
  }, [categories, selected]);

  // back‑home animation
  const goBackHome = () => {
    const group = menuGroupRef.current;
    const tabs = document.querySelector('.category-tabs.bottom');
    gsap.timeline({
      defaults: { duration: 0.5, ease: 'power2.inOut' },
      onComplete: () => navigate('/')
    })
      .to(".projects-back-home", { x: 15, duration: 0.15, ease: "power2.out" }, 0)
      .to(".projects-back-home", { x: -200, duration: 0.5, ease: "power2.out" }, 0.15)
      .to(".projects-back-home", { opacity: 0, duration: 0.2 }, '<')
      .to(group.scale, { x: 0, y: 0, z: 0 }, '<')
      .to(tabs, { opacity: 0 }, 0)
      .to({}, { duration: 0.4 });
  };

  useEffect(() => {
    gsap.from('.projects-back-home', {
      opacity: 0, duration: 0.6, ease: "power2.out", delay: 0.1
    });
  }, []);

  // tabs intro
  useEffect(() => {
    const tabs = gsap.utils.toArray('.category-tabs.bottom .tab');
    tabs.forEach((tab, i) => {
      const grp = tab.getAttribute('data-group');
      let props = {};
      if (grp === 'left') props = { x: '-150vw' };
      if (grp === 'middle') props = { y: '150vh' };
      if (grp === 'right') props = { x: '150vw' };

      gsap.from(tab, {
        ...props,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.1 + i * 0.05
      });
    });
  }, []);

  return (
    <div className="projects-page">
      <div className={`projects-coming-soon-overlay ${showSoon ? 'show' : ''}`}>
        Coming&nbsp;Soon!
      </div>
      <button
        className="projects-back-home"
        onClick={goBackHome}
        style={{ '--tab-color': currentColor }}
      >
        <div className="projects-back-icon" aria-hidden="true" />
        To Home
      </button>

      <div className="pattern-container" ref={containerRef} />

      <div className="category-tabs bottom">
        {categories.map((cat, idx) => {
          const tabColor = `#${COLOR_MAP[cat.id].toString(16).padStart(6, '0')}`;
          const group =
            idx < 2 ? 'left' :
              idx < 4 ? 'middle' : 'right';

          /* “Xplor” special-case (no click, shows overlay) */
          if (cat.id === 'xplor') {
            return (
              <button
                key={cat.id}
                className="tab disabled"
                data-group={group}
                style={{ '--tab-color': tabColor }}
                onMouseEnter={() => setShowSoon(true)}
                onMouseLeave={() => setShowSoon(false)}
              >
                {isMobilePortrait
                ? cat.title.replace(/\s*projects?/i, '')
                : cat.title}
              </button>
            );
          }

          /* normal clickable category tabs */
          return (
            <button
              key={cat.id}
              className={`tab ${selected === cat.id ? 'active' : ''}`}
              data-group={group}
              style={{ '--tab-color': tabColor }}
              onClick={() => setSelected(cat.id)}
            >
              {isMobilePortrait
                ? cat.title.replace(/\s*projects?/i, '')
                : cat.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
