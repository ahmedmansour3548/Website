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

  // 1) Load categories.json
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
  
  useEffect(() => {
    // Detect iPhone Safari
    const ua = navigator.userAgent || '';
    const isiPhone = ua.includes('iPhone');
    const isSafari = ua.includes('Safari') && !ua.includes('CriOS') && !ua.includes('FxiOS');

    if (isiPhone && isSafari) {
      document.documentElement.classList.add('iphone-safari');
    } else {
      document.documentElement.classList.add('not-iphone-safari');
    }
  }, []);

  // Init Three.js + interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    //
    // Create the preview <img> that will sit behind the menu
    //
    const previewImg = document.createElement('img');
Object.assign(previewImg.style, {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  objectFit: 'cover',
  filter: 'brightness(1)',    // start fully visible
  opacity: '0',
  pointerEvents: 'none'
});
    container.appendChild(previewImg);

    //
    // Basic Three.js boilerplate: scene, camera, renderer
    //
    const { clientWidth: W, clientHeight: H } = container;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.domElement.classList.add('pattern-canvas');
    container.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    //
    // Track pointer coords (ndc)
    //
    const onMove = e => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

   let transitionCounter = 0;

const startImageTransition = obj => {
  // Increment for each call
  const thisID = ++transitionCounter;
  isTransitioning.current = true;

  // Get the URL we want to show
  const newSrc = spriteData.current.get(obj)?.headerPhoto;
  if (!newSrc) {
    isTransitioning.current = false;
    return;
  }

  // Immediately kill any existing tweens on previewImg so we can start fresh
  gsap.killTweensOf(previewImg);

  // Fade the previewImg to black + invisible over 0.3s
  gsap.to(previewImg, {
    duration: 0.3,
    filter: 'brightness(0)', // ramp down to black
    opacity: 0,              // ramp down to fully transparent
    onComplete: () => {
      // Before loading the new image, check if another transition started in the meantime
      if (thisID !== transitionCounter) {
        // A newer hover happened—abort this one
        isTransitioning.current = false;
        return;
      }

      // Preload the new image behind the scenes
      const loader = new Image();
      loader.src = newSrc;
      loader.onload = () => {
        // Again, confirm we’re still on the same transition
        if (thisID !== transitionCounter) {
          isTransitioning.current = false;
          return;
        }

        // Swap the <img>’s src now that the new image is fully loaded
        previewImg.src = newSrc;

        // Immediately set filter to black and opacity 0 (in case they changed)
        previewImg.style.filter = 'brightness(0)';
        previewImg.style.opacity = '0';

        // Fade back up from black → full brightness & visible
        gsap.to(previewImg, {
          duration: 0.5,
          filter: 'brightness(1)',  // ramp up to normal brightness
          opacity: 0.5,             // fade in to 50% opacity (match what you were using before)
          onComplete: () => {
            // Final check: if another hover started, we’ll let that call interrupt as needed
            if (thisID !== transitionCounter) {
              isTransitioning.current = false;
              return;
            }
            isTransitioning.current = false;
            // No need for “pendingHover” here—any new hover simply incremented transitionCounter
          }
        });
      };

      loader.onerror = () => {
        // If it fails to load, give up and clear the flag
        if (thisID === transitionCounter) {
          isTransitioning.current = false;
        }
      };
    }
  });
};
    //
    // 2E) Raycast + hover logic. Now decoupled into:
    //     (a) immediate sprite scaling
    //     (b) conditional 'startImageTransition' if no other fade is running
    //
    const updateHover = () => {
  raycaster.current.setFromCamera(pointer.current, cameraRef.current);
  const hits = raycaster.current.intersectObjects(
    Array.from(spriteData.current.keys())
  );

  if (hits.length) {
    rendererRef.current.domElement.style.cursor = 'pointer';
    const obj = hits[0].object;

    if (hovered.current !== obj) {
      // 1) Immediately restore the old sprite’s scale (if any)
      if (hovered.current) {
        hovered.current.scale.set(1.5, 0.5, 1);
      }
      // 2) Grow the new sprite
      hovered.current = obj;
      obj.scale.set(1.7, 0.6, 1);

      // 3) Always kick off a brand‑new transition for this sprite,
      //    even if a previous fade is still in motion.
      startImageTransition(obj);
    }
  } else {
    // Mouse has left all sprites
    if (hovered.current) {
      // 1) Immediately restore that sprite’s scale
      hovered.current.scale.set(1.5, 0.5, 1);
      hovered.current = null;

      // 2) Hide the preview image entirely:
      //    Kill any tweens, then fade opacity → 0 & reset brightness.
      gsap.killTweensOf(previewImg);
      gsap.to(previewImg, {
        duration: 0.3,
        opacity: 0,
        filter: 'brightness(1)', // restore filter so next fade‐in starts from bright
        onComplete: () => {
          // Also clear the src so that first‐hover logic runs on the next hover
          previewImg.src = '';
        }
      });
    }
    rendererRef.current.domElement.style.cursor = 'auto';
  }
};

    //
    // 2F) Click handler (navigates once you click while hovering)
    //
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

    // 2G) Touch support (tap = hover + click)
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    let cleanupTouch = null;
    if (isTouchDevice) {
      const onTouchStart = e => {
        onMove(e);      // update pointer coords
        updateHover();  // immediately run hover logic (scale + maybe queue fade)
        if (hovered.current) {
          onClick();    // trigger the same click/navigation logic
        }
      };
      renderer.domElement.addEventListener('pointerdown', onTouchStart);

      cleanupTouch = () => {
        renderer.domElement.removeEventListener('pointerdown', onTouchStart);
      };
    }

    //
    // 2H) The render loop
    //
    const animate = () => {
      requestAnimationFrame(animate);
      updateHover();
      renderer.render(scene, camera);
    };
    animate();

    //
    // 2I) Handle window resize (resize wheel + sprites)
    //
    const onResize = () => {
      const W = container.clientWidth,
        H = container.clientHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();

      // Responsive wheel‐scale
      const isPortrait = W < H;
      const factor = isPortrait
        ? Math.max(W / H, PORTRAIT_MIN_RATIO)
        : 1;
      const dynamicScale = MENU_SCALE * factor;
      cameraRef.current.position.z = 3 / factor;

      const group = menuGroupRef.current;
      if (group) {
        // Resize the entire wheel
        group.scale.set(dynamicScale, dynamicScale, dynamicScale);
        // Resize each spoke‐label sprite
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

    //
    // 2J) Clean up everything on unmount
    //
    return () => {
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      container.removeChild(previewImg);
      container.removeChild(renderer.domElement);
      if (cleanupTouch) cleanupTouch();
    };
  }, [/* empty deps: run once */]);

  //
  // 3) Watch for portrait mobile orientation changes
  //
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

  //
  // 4) Build & animate the circular menu any time `categories` or `selected` changes
  //
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

    // 4A) Remove old menu group (if any)
    const oldGroup = menuGroupRef.current;
    if (oldGroup) {
      oldGroup.children.forEach(c => {
        if (c.type === 'Sprite') spriteData.current.delete(c);
      });
      scene.remove(oldGroup);
    }

    // 4B) Create new group
    const group = new THREE.Group();
    group.scale.set(0, 0, 0);
    group.position.y = 0.3;
    menuGroupRef.current = group;
    scene.add(group);

    // 4C) Add lines + sprites for each project in the “selected” category
    const projs = categories.find(c => c.id === selected)?.projects || [];
    const color = COLOR_MAP[selected];
    const radius = 1.5;

    projs.forEach((proj, i) => {
      const angle = (i / projs.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // Draw the spoke‐line
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(x, y, 0)
        ]),
        new THREE.LineBasicMaterial({ color })
      );
      group.add(line);

      // Create a CanvasTexture for the sprite label
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
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

      // Find an appropriate fontSize that fits
      let fontSize = 64,
        minFont = 24,
        margin = 512 * 0.05;
      while (fontSize > minFont) {
        ctx.font = `bold ${fontSize}px "Speculum"`;
        const widest = Math.max(
          ...lines.map(line => ctx.measureText(line).width)
        );
        if (widest <= 512 - margin * 2) break;
        fontSize -= 2;
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.ceil(fontSize / 8);
      ctx.strokeStyle = '#000';
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;

      const lineHeight = fontSize * 1.2;
      lines.forEach((line, idx) => {
        const yPos = 64 + (idx - (lines.length - 1) / 2) * lineHeight;
        ctx.strokeText(line, 256, yPos);
        ctx.fillText(line, 256, yPos);
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

    // 4D) Slowly orbit the entire group
    gsap.to(group.rotation, {
      z: '+=' + Math.PI * 2,
      duration: 120,
      ease: 'none',
      repeat: -1
    });

    // 4E) Pop‐in animation
    gsap.to(group.scale, {
      x: dynamicScale,
      y: dynamicScale,
      z: dynamicScale,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)'
    });
  }, [categories, selected]);

  //
  // 5) “Back Home” animation
  //
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
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      delay: 0.1
    });
  }, []);

  //
  // 6) Category‐tabs intro animation
  //
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
            idx < 4 ? 'middle' :
            'right';

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
