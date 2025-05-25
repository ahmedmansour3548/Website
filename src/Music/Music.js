/* ========================================================== */
/* src/About/About.css                                        */
/* ========================================================== */
/*
 * © Ahmed Mansour 2025
 */

import { useEffect, useRef, useState, useContext } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from 'react-icons/fa';
import cameraInstance from '../utils/camera';
import { PatternContext } from "../index";
import { useNavigate } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Music.css';

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────── */
/*  Component                                                 */
/* ────────────────────────────────────────────────────────── */
export default function Music () {
  const navigate             = useNavigate();
  /* ──────────────────────────────── */
  /*  Refs / Singletons               */
  /* ──────────────────────────────── */
  const sceneRef             = useRef(new THREE.Scene());
  const rendererRef          = useRef(null);
  const sceneContainerRef    = useRef(null);
  const camera               = cameraInstance.getCamera();

  const albumGroupRef        = useRef(new THREE.Group());
  const skyboxRef            = useRef(null);

  const leftNavRef           = useRef(null);
  const rightNavRef          = useRef(null);
  const footerRef            = useRef(null);
  const backHomeRef          = useRef(null);

  const albumTextRef         = useRef(null);
  const albumNameRef         = useRef(null);
  const songTextRef          = useRef(null);
  const detailsRef           = useRef(null);
  const spacerRef            = useRef(null);
  const albumTipRef          = useRef(null);

  /* drag-state */
  const isDraggingRef        = useRef(false);
  const dragStartXRef        = useRef(0);
  const dragOffsetStartRef   = useRef(0);
  const continuousIndexRef   = useRef(0);

  /* offsets & tweens */
  const globalOffset         = useRef(0);
  const targetOffset         = useRef(0);
  const offsetTweenRef       = useRef(null);
  const vinylTweensRef       = useRef([]);
  const centerSpinTweenRef   = useRef(null);

  /* audio refs */
  const audioRef             = useRef(null);
  const repeatModeRef        = useRef('none');
  const currentAlbumIndexRef = useRef(0);

  /* ──────────────────────────────── */
  /*  Context & Reactive state        */
  /* ──────────────────────────────── */
  const { pattern, styles }                 = useContext(PatternContext);

  const [albums, setAlbums]                 = useState([]);
  const [initialized, setInitialized]       = useState(false);

  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const [nowPlayingName, setNowPlayingName] = useState('');
  const [isPlaying, setIsPlaying]           = useState(false);

  const [shuffle, setShuffle]               = useState(false);
  const [shuffledTracks, setShuffledTracks] = useState([]);
  const [repeatMode, setRepeatMode]         = useState('none');

  const trackObj   = albums[currentAlbumIndex]?.tracks[currentTrackIndex];
  const allParts   = trackObj?.parts ?? [];

  /* group parts by instrument for sheet-music grid */
  const grouped = allParts.reduce((acc, p) => {
    (acc[p.instrument] ??= []).push(p);
    return acc;
  }, {});


  /* ──────────────────────────────────────────────────────── */
  /*  Fetch album metadata                                    */
  /* ──────────────────────────────────────────────────────── */
  useEffect(() => {
    fetch('/music.json')
      .then(res => res.json())
      .then(({ albums }) => {
        setAlbums(albums);

        if (albums.length) {
          setCurrentAlbumIndex(0);
          currentAlbumIndexRef.current = 0;
          setCurrentTrackIndex(0);

          // simple UI fades
          const tl = gsap.timeline();
          tl.to(albumNameRef.current, { opacity: 1, duration: 0.6, delay: 0.4 })
            .to(songTextRef.current, { opacity: 1, duration: 0.6 }, "<+0.15");
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  /* ──────────────────────────────────────────────────────── */
  /*  Pattern visualiser configuration                        */
  /* ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!pattern) return;

    pattern
      .setLineWidth(1)
      .setStyle(styles.SOLID)
      .setOpacity(1)
      .setColor(0xff0000);          // fills ALL vertices red to start
  }, [pattern, styles]);

  useEffect(() => {
    if (!pattern || initialized) return;

    const tl = gsap.timeline();

    // Fade in the left and right nav arrows
    tl.to('.nav-area.left', { opacity: 1, duration: 0.6, delay: 0.2 })
      .to('.nav-area.right', { opacity: 1, duration: 0.6 }, "<+0.1")

    // Fade in the back home button
    tl.to(backHomeRef.current, { opacity: 1, duration: 0.6 }, "<+0.2")
    
    // fade in vinyls using sceneContainerRef
    tl.to(sceneContainerRef.current, { opacity: 1, duration: 0.6 }, "<+0.2")

    // Slide up the player footer (playback bar)
    tl.to(footerRef.current, {
      y: 0, // Slide to its final position
      opacity: 1,
      duration: 1,
      ease: 'power2.out',
    }, "<+0.4");

  }, [pattern, initialized]);

  /* ──────────────────────────────────────────────────────── */
  /*  <audio> event listeners                           */
  /* ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleNativePlay = () => setIsPlaying(true);
    const handleNativePause = () => setIsPlaying(false);

    audio.addEventListener('play', handleNativePlay);
    audio.addEventListener('pause', handleNativePause);

    return () => {
      audio.removeEventListener('play', handleNativePlay);
      audio.removeEventListener('pause', handleNativePause);
    };
  }, [audioRef.current]);          // rerun whenever we load a new <audio>


  /* ──────────────────────────────────────────────────────── */
  /*  Fire the very first track once everything is ready      */
  /* ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!pattern || !albums.length) return;

    // always start with the first album’s first track
    const firstAlbum = albums[0];
    const firstTrack = firstAlbum?.tracks[0];
    if (firstTrack) loadTrack(firstTrack, false, 0, firstAlbum.tracks);
  }, [albums, pattern]);

  useEffect(() => {
    if (!pattern || !sceneContainerRef.current) return;

    const canvas = pattern.renderer.domElement;

    // only do it once
    if (!sceneContainerRef.current.contains(canvas)) {
      // visually behind the vinyl canvas
      canvas.style.position = 'absolute';  // relative to .scene-container
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '0';
      canvas.style.pointerEvents = 'none'; // pattern is purely decorative

      sceneContainerRef.current.appendChild(canvas);
    }
  }, [pattern]);


  /* ──────────────────────────────────────────────────────── */
  /*  Mount Three-JS renderer & drag-to-scroll system         */
  /* ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!pattern || initialized || albums.length === 0) return;
    const scene = sceneRef.current;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '-1rem';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '1';
    rendererRef.current = renderer;

    // Set container opacity to 0 so we can fade it in
    sceneContainerRef.current.style.opacity = 0;


    if (
      sceneContainerRef.current &&
      !sceneContainerRef.current.contains(renderer.domElement)
    ) {
      sceneContainerRef.current.appendChild(renderer.domElement);
    }

    // ─── DRAG + DECELERATION‐BASED INERTIA + SNAP + INFINITE ───
    const container = sceneContainerRef.current;
    const el = renderer.domElement;
    const spacing = window.innerWidth / 2.5;
    const totalWidth = () => albums.length * spacing;

    let lastX = 0, lastT = 0;

    const onPointerDown = e => {
      if (e.button !== 0 || isOnOverlay(e)) return; // Left-click only
      e.stopPropagation();  // Prevent event conflicts
      isDraggingRef.current = true;
      dragStartXRef.current = e.clientX;
      dragOffsetStartRef.current = globalOffset.current;
      lastX = e.clientX;
      lastT = performance.now();
      offsetTweenRef.current?.kill();
    };

    const onPointerMove = e => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartXRef.current;
      globalOffset.current = dragOffsetStartRef.current + dx;
      updateAllVinylPositions();
      lastX = e.clientX;
      lastT = performance.now();
    };

    const onPointerUp = e => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      // 1) compute release velocity
      const now = performance.now();
      const dt = Math.max((now - lastT) / 1000, 0.001);
      const dv = e.clientX - lastX;
      const velocity = dv / dt; // px/sec

      // 2) if slow release, snap immediately
      const snapThreshold = 150; // px/sec
      if (Math.abs(velocity) < snapThreshold) {
        return snapToCenter();
      }

      // 3) deceleration model
      const deceleration = 2000; // px/sec²
      const t = Math.abs(velocity) / deceleration;                   // time to stop
      const distance = (velocity * velocity) / (2 * deceleration) * Math.sign(velocity);

      // 4) tween with ease-out, then snap
      const inertiaObj = { v: globalOffset.current };
      offsetTweenRef.current = gsap.to(inertiaObj, {
        v: globalOffset.current + distance,
        duration: t,
        ease: 'power2.out',
        onUpdate: () => {
          globalOffset.current = inertiaObj.v;
          updateAllVinylPositions();
        },
        onComplete: snapToCenter
      });
    };

    function snapToCenter() {
      const tw = totalWidth();
      const rawIdx = (tw / 2 - globalOffset.current) / spacing;
      const nearest = Math.round(rawIdx);

      // sync continuous index
      continuousIndexRef.current = nearest;

      // wrap for UI + audio
      const wrapped = ((nearest % albums.length) + albums.length) % albums.length;
      const prev = currentAlbumIndexRef.current;

      // update state + mirror ref
      setCurrentAlbumIndex(wrapped);
      currentAlbumIndexRef.current = wrapped;
      setCurrentTrackIndex(0);

      // tween into perfect center
      const snapOffset = tw / 2 - nearest * spacing;
      const snapObj = { v: globalOffset.current };
      offsetTweenRef.current = gsap.to(snapObj, {
        v: snapOffset,
        duration: 0.6,
        ease: 'power3.out',
        onUpdate: () => {
          globalOffset.current = snapObj.v;
          updateAllVinylPositions();
        },
        onComplete: () => {
          if (wrapped !== prev) {
            loadTrack(
              albums[wrapped].tracks[0],
              true,
              wrapped,
              albums[wrapped].tracks
            );
          }
        }
      });
    }
    const isOnOverlay = (ev) => ev.target.closest('.nav-area') ||
      ev.target.closest('.player-footer') ||
      ev.target.closest('.music-back-home');

    container.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || isOnOverlay(e)) return;   // left-click only
      onPointerDown(e);
    });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // ─── rest of init: scene, camera, lights, animate ───
    albumGroupRef.current.position.set(0, -150, 0);
    scene.add(albumGroupRef.current);
    camera.position.set(0, 0, 600);
    camera.lookAt(scene.position);
    scene.add(new THREE.AmbientLight(0x404040, 1.5));
    const pointLight = new THREE.PointLight(0xffffff, 1.2);
    pointLight.position.set(0, 200, 300);
    scene.add(pointLight);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
    setInitialized(true);

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
    };
  }, [camera, albums]);


  /* ──────────────────────────────────────────────────────── */
  /*  Pattern spiral geometry (once scene is ready)           */
  /* ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!initialized || !pattern) return;
    pattern.regenerate({
      maxVertices: 1000,
      xPos: 0,
      yPos: 0,
      zPos: 0,
      xFunctionCode: 0,
      yFunctionCode: 1,
      deltaAngle: 0.103,
      scale: 1,
      xAngularFreq: 1,
      yAngularFreq: 1,
      xPhase: 0,
      yPhase: 0,
      loopVertex: 1000
    });
  }, [initialized, pattern]);

  // Update vinyl positions
  const updateAllVinylPositions = () => {
    if (!albums.length) return;
    const spacing = window.innerWidth / 2.5;
    const totalWidth = albums.length * spacing;
    albumGroupRef.current.children.forEach((child, i) => {
      const raw = ((i * spacing + globalOffset.current) % totalWidth + totalWidth) % totalWidth;
      const xPos = raw - totalWidth / 2;
      child.position.x = xPos;
      const norm = xPos / (totalWidth / 2);
      child.position.z = -Math.abs(norm) * 500;
    });
  };

  /* ──────────────────────────────────────────────────────── */
  /*  7) Main carousel nav / rotation feedback                */
  /* ──────────────────────────────────────────────────────── */
  useEffect(() => {
    // kill any wobble tweens, then rebuild 
    vinylTweensRef.current.forEach(t => t.kill());
    vinylTweensRef.current = [];

    if (centerSpinTweenRef.current) {
      centerSpinTweenRef.current.kill();
      centerSpinTweenRef.current = null;
    }

    const children = albumGroupRef.current.children;
    children.forEach((vinylGroup, idx) => {
      const isCenter = idx === currentAlbumIndex;

      if (isCenter) {
        // lock center one: make sure rotation is exactly flat
        gsap.killTweensOf(vinylGroup.rotation);
        vinylGroup.rotation.set(0, 0, 0);
      } else {
        // off-center: slow, subtle back‐and‐forth rotations on X & Y
        const tween = gsap.to(vinylGroup.rotation, {
          x: '+=0.15',                        // rotate +0.15 radians on X
          y: '+=0.15',                        // and +0.15 on Y.
          duration: 4 + Math.random() * 2,    // 4–6s per cycle
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
        vinylTweensRef.current.push(tween);
      }
    });
  }, [albums, currentAlbumIndex]);

  /* ──────────────────────────────────────────────────────── */
  /*  Vinyl mesh construction                                 */
  /* ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!albums.length) return;
    const group = albumGroupRef.current;
    group.clear();

    const spacing = window.innerWidth / 2.5;
    albums.forEach((album, i) => {
      const vinylGroup = new THREE.Group();       // disc
      const vinylTex = new THREE.TextureLoader().load('/assets/vinyl3.png');
      const discGeo = new THREE.CylinderGeometry(200, 200, 2, 32);
      const discMat = new THREE.MeshPhongMaterial({
        map: vinylTex,
        specular: 0x222222,
        shininess: 150,
        transparent: true,
        depthWrite: false
      });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.x = Math.PI / 2;
      vinylGroup.add(disc);

      // Center label
      const labelGeo = new THREE.CylinderGeometry(60, 60, 4, 32);
      const labelTex = new THREE.TextureLoader().load(album.frontCover);
      const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.rotation.x = label.rotation.y = Math.PI / 2;
      label.position.z = 1;
      vinylGroup.add(label);

      vinylGroup.userData = { album, disc, label };
      vinylGroup.position.set(i * spacing, window.innerHeight / 6, 0);
      group.add(vinylGroup);
    });

    // Reset offsets & position
    const totalWidth = albums.length * spacing;
    globalOffset.current = totalWidth / 2 - currentAlbumIndex * spacing;
    targetOffset.current = globalOffset.current;
    continuousIndexRef.current = currentAlbumIndex;
    updateAllVinylPositions();

    //   // Load initial track & skybox
    //   const current = albums[currentAlbumIndex];
    //   if (current) {
    //     loadTrack(current.tracks[0], false);
    //     if (current.skybox) loadSkybox(current.skybox);
    //   }
  }, [albums]);



  // Skybox loader
  // const loadSkybox = (urls) => {
  //   const loader = new THREE.CubeTextureLoader();
  //   loader.load(urls, (cube) => {
  //     cube.minFilter = THREE.LinearMipMapLinearFilter;
  //     cube.magFilter = THREE.LinearFilter;
  //     sceneRef.current.background = cube;
  //   });
  // };

  /* ────────────────────────────────────────────────────────── */
  /*  Seamless cruise-then-snap for the “now-playing” badge     */
  /* ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const badge = albumTextRef.current;       // the visible badge
    const marker = spacerRef.current;         // invisible 4-rem spacer
    const gapPx = 32;
    if (!badge || !marker) return;

    const footerH = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--footer-height'),
      10
    );

    /* always X-centre the badge */
    Object.assign(badge.style, {
      left: '50%',
      transform: 'translateX(-50%) scale(22)',
      transformOrigin: 'center',
      willChange: 'transform',
    });

    /* helper returns doc-space Y of marker-centre */
    const markerCentreY = () =>
      window.scrollY +            // page-top to viewport-top
      marker.getBoundingClientRect().top +  // viewport-top to marker-top
      marker.offsetHeight * 0.5;            // to centre

    /* helper returns doc-space Y where badge-centre would be while pinned */
    const pinnedCentreY = () =>
      window.scrollY + window.innerHeight - footerH - gapPx - badge.offsetHeight * 0.5;

    /* onScroll decides between the two states every frame */
    const onScroll = () => {
      const stillPinned = markerCentreY() > pinnedCentreY();

      if (stillPinned) {
        /* 🡒 Pinned (cruising with viewport) */
        badge.style.position = 'fixed';
        badge.style.bottom = `${footerH + gapPx}px`;
        badge.style.top = 'auto';

        /* scale from 0.85 → 1.00 as we approach the snap point         */
        const dist = markerCentreY() - pinnedCentreY(); // px
        const span = window.innerHeight * 0.2;          // 20 % viewport
        const t = Math.min(Math.max(1 - dist / span, 0), 1); // 0-1
        const scale = 1 + 0.2 * t;
        badge.style.transform =
          `translateX(-50%) scale(${scale.toFixed(3)})`;
      } else {
        /* 🡒 Released (locked above the details section) */
        badge.style.position = 'absolute';
        badge.style.top = `${markerCentreY() - badge.offsetHeight * 0.5}px`;
        badge.style.bottom = 'auto';
        badge.style.transform = 'translateX(-50%) scale(1.22)';
      }
    };

    /* run once and on every scroll / resize */
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    // Cleanup function to stop audio when leaving the page
    return () => {
      if (audioRef.current) {
        audioRef.current.pause(); // Pause the audio
        audioRef.current.ontimeupdate = null; // Remove time update listener
        audioRef.current.onended = null; // Remove end event listener
        setIsPlaying(false); // Set the isPlaying state to false
      }
    };
  }, []);

  const resetPatternToRed = () => updatePatternProgress(0);

  /* ──────────────────────────────────────────────────────────────────────── */
  /*  Colours the first ‹percent› of vertices green and the rest red          */
  /*  for THREE.Line2 / LineGeometry.                                         */
  /* ──────────────────────────────────────────────────────────────────────── */
  const updatePatternProgress = (percent) => {
    if (!pattern) return;

    const startAttr = pattern.geometry.getAttribute('instanceColorStart');
    const endAttr = pattern.geometry.getAttribute('instanceColorEnd');
    if (!startAttr || !endAttr) return;        // safety check

    const segCount = startAttr.count;        // segments = vertices-1
    const greenLimit = Math.floor(segCount * percent);

    // helper that writes to either interleaved attribute
    const paint = (attr, idx, r, g, b) => {
      attr.setXYZ(idx, r, g, b);               // handles stride/offset for us
    };

    for (let i = 0; i < segCount; i++) {
      // green (0,1,0) up to greenLimit, else red (1,0,0)
      const g = i < greenLimit;
      const rVal = g ? 0 : 1;
      const gVal = g ? 1 : 0;

      // segment i starts at vertex i   → colourStart
      // segment i ends   at vertex i+1 → colourEnd
      paint(startAttr, i, rVal, gVal, 0);
      paint(endAttr, i, rVal, gVal, 0);
    }

    startAttr.needsUpdate = true;              // re-upload to GPU
    endAttr.needsUpdate = true;
    pattern.material.needsUpdate = true;       // ensure shader refresh
  };

  /* ──────────────────────────────────────────────────────── */
  /*  Album switching logic                                   */
  /* ──────────────────────────────────────────────────────── */
  const handleNav = (dir, ref) => {
    // scale arrow for feedback
    gsap.fromTo(ref.current, { scale: 1 }, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: 'center center' });
    switchAlbum(dir);
  };

  const switchAlbum = (dir) => {
    if (!albums.length) return;

    resetPatternToRed(); // reset pattern to red

    // stop & detach any running audio callbacks ───
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.ontimeupdate = null;
      audioRef.current.onended = null;
      setIsPlaying(false);
    }

    // fade out metadata
    gsap.to([albumTextRef.current, songTextRef.current], {
      opacity: 0,
      duration: 0.3
    });

    // kill any ongoing center spin
    centerSpinTweenRef.current?.kill();
    centerSpinTweenRef.current = null;

    // straighten old center vinyl rotation
    const old = albumGroupRef.current.children[currentAlbumIndex];
    if (old) {
      const TWO_PI = Math.PI * 2;
      const clean = (val) => {
        const norm = ((val % TWO_PI) + TWO_PI) % TWO_PI;
        return val + (norm <= Math.PI ? -norm : (TWO_PI - norm));
      };
      gsap.killTweensOf(old.rotation);
      gsap.to(old.rotation, {
        x: clean(old.rotation.x),
        y: clean(old.rotation.y),
        z: clean(old.rotation.z),
        duration: 0.3,
        ease: 'power2.out'
      });
    }

    // bump our continuous (unwrapped) index ───
    continuousIndexRef.current += dir;

    // compute wrapped index for React state and audio logic ───
    const len = albums.length;
    const wrapped = ((continuousIndexRef.current % len) + len) % len;
    const prev = currentAlbumIndex;

    // update React state immediately ───
    setCurrentAlbumIndex(wrapped);
    currentAlbumIndexRef.current = wrapped;
    setCurrentTrackIndex(0);

    // compute new targetOffset based on continuous index ───
    const spacing = window.innerWidth / 2.5;
    const totalW = len * spacing;
    // offset formula: index 0 → totalW/2, index i → totalW/2 - i*spacing
    targetOffset.current = totalW / 2 - continuousIndexRef.current * spacing;

    // tween from actual position → targetOffset ───
    offsetTweenRef.current?.kill();
    const tweenObj = { v: globalOffset.current };
    offsetTweenRef.current = gsap.to(tweenObj, {
      v: targetOffset.current,
      duration: 0.6,
      ease: 'power2.inOut',
      onUpdate: () => {
        globalOffset.current = tweenObj.v;
        updateAllVinylPositions();
      },
      onComplete: () => {
        // only reload audio if album truly changed
        if (wrapped !== prev) {
          loadTrack(
            albums[wrapped].tracks[0],
            true,
            wrapped,
            albums[wrapped].tracks
          );
        }
        // fade metadata back in
        gsap.to(albumTextRef.current, { opacity: 1, duration: 0.5, delay: 0.2 });
        gsap.to(songTextRef.current, { opacity: 1, duration: 0.5, delay: 0.4 });
      }
    });
  };

  /* ──────────────────────────────────────────────────────── */
  /* loadTrack & playback                                     */
  /* ──────────────────────────────────────────────────────── */
  const loadTrack = (
    track,
    autoplay = true,
    albumIndex = currentAlbumIndex,
    trackArray
  ) => {
    if (!track) return;

    // Fade out title text
    gsap.to(songTextRef.current, { opacity: 0, duration: 0.3 });

    setTimeout(() => {
      // Stop any existing audio and tear down callbacks
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.ontimeupdate = null;
        audioRef.current.onended = null;
      }

      // Determine which track list to use (shuffle vs. normal)
      const baseTracks = albums[albumIndex]?.tracks ?? [];
      const tracks = trackArray ?? (shuffle ? shuffledTracks : baseTracks);
      const newTrackIndex = tracks.indexOf(track);

      // Create the new Audio
      audioRef.current = new Audio(track.file);

      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onpause = () => setIsPlaying(false);

      // Reset the pattern: all red → start at 50% green
      if (pattern) {
        updatePatternProgress(0.5);

        // Update pattern as the song plays
        audioRef.current.ontimeupdate = () => {
          const d = audioRef.current.duration;
          if (!d) return;
          const raw = audioRef.current.currentTime / d;   // 0 → 1
          const scaled = 0.58 + 0.58 * Math.min(raw, 1);   // 0.5 → 1
          updatePatternProgress(scaled);
        };
      } else {
        audioRef.current.ontimeupdate = null;
      }

      // Handle track end
      audioRef.current.onended = () => {
        updatePatternProgress(1);  // Fill pattern fully green
        const centerVinyl = albumGroupRef.current.children[albumIndex];

        // if repeat-one, just reload the same track
        if (repeatModeRef.current === 'one') {
          gsap.to(centerVinyl.rotation, {
            z: '+=3.1416',
            duration: 0.4,
            ease: 'power2.out',
            onComplete: () => {
              loadTrack(track, true, albumIndex, shuffle ? tracks : undefined);
            }
          });
          return;
        }

        // Figure out if we’re at the last track
        const isLast = newTrackIndex >= tracks.length - 1;

        if (!isLast || repeatModeRef.current === 'album') {
          // Choose next index (wrap if needed)
          let nextIdx = newTrackIndex + 1;
          if (nextIdx >= tracks.length) nextIdx = 0;
          loadTrack(tracks[nextIdx], true, albumIndex, shuffle ? tracks : undefined);
        } else if (repeatModeRef.current === 'one') {
          // repeat-one: simply reload the same track
          loadTrack(track, true, albumIndex, shuffle ? tracks : undefined);
        } else {
          // No repeat & last track → stop playback
          setIsPlaying(false);
          centerSpinTweenRef.current?.kill();  // Stop the continuous spin
        }
      };

      // Update React state
      setCurrentTrackIndex(newTrackIndex);
      setNowPlayingName(track.name);
      setIsPlaying(autoplay);

      // Vinyl spin: quick 360° then infinite
      const centerVinyl = albumGroupRef.current.children[albumIndex];
      if (autoplay && centerVinyl) {
        // kill any existing continuous spin animation
        if (centerSpinTweenRef.current) {
          centerSpinTweenRef.current.kill();
        }

        // Capture the current rotation before applying the 360°
        const currentRotation = centerVinyl.rotation.z;

        // Apply the 360° spin from the current rotation state
        gsap.to(centerVinyl.rotation, {
          z: currentRotation + Math.PI * 2,  // Full 360° spin from the current rotation
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            // After 360° spin, restart continuous spin
            centerSpinTweenRef.current = gsap.to(centerVinyl.rotation, {
              z: '+=6.28319',       // Keep spinning
              duration: 10,         // Slow continuous spin
              ease: 'linear',
              repeat: -1            // Infinite repeat
            });
          }
        });

        // Play the audio
        audioRef.current.play().catch(console.error);
      }

      // Fade title back in
      gsap.to(songTextRef.current, { opacity: 1, duration: 0.5, delay: 0.2 });
    }, 300);
  };

  /* ──────────────────────────────────────────────────────── */
  /* Playback controls                                        */
  /* ──────────────────────────────────────────────────────── */
  const toggleShuffle = () => {
    const on = !shuffle;
    setShuffle(on);
    if (on) {
      // create a new randomized order
      const list = [...albums[currentAlbumIndex].tracks];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      setShuffledTracks(list);
    }
  };

  const cycleRepeat = () => setRepeatMode(m => m === 'none' ? 'album' : m === 'album' ? 'one' : 'none');

  // Play/pause handlers
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    const center = albumGroupRef.current.children[currentAlbumIndex];

    if (audioRef.current.paused) {
      // If the audio is paused, play it and continue spinning the vinyl
      audioRef.current.play();
      setIsPlaying(true);

      // Restart continuous spin
      gsap.to(center.rotation, { z: '+=6.283', duration: 10, ease: 'linear', repeat: -1 });
    } else {
      // If the audio is playing, pause it and stop the continuous spin
      audioRef.current.pause();
      setIsPlaying(false);

      // Stop continuous spinning and return the vinyl to an upright position
      gsap.killTweensOf(center.rotation);
    }
  };

  const handlePrevTrack = () => {
    const baseTracks = albums[currentAlbumIndex]?.tracks || [];
    const tracks = shuffle ? shuffledTracks : baseTracks;
    if (tracks.length && audioRef.current) {
      // If song is less than 3 seconds in, go to previous track
      if (audioRef.current.currentTime < 3 && currentTrackIndex > 0) {
        loadTrack(tracks[currentTrackIndex - 1], true);
      } else if (repeatModeRef.current === 'one') {
        // repeat the last track
        loadTrack(tracks[currentTrackIndex], true);
      }
      else {
        audioRef.current.currentTime = 0;
      }
    }
  };

  const handleNextTrack = () => {
    const baseTracks = albums[currentAlbumIndex]?.tracks || [];
    const tracks = shuffle ? shuffledTracks : baseTracks;
    if (tracks?.length) {
      const atEnd = currentTrackIndex >= tracks.length - 1;
      if (atEnd && repeatModeRef.current === 'none') {
        // just stop
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (repeatModeRef.current === 'one') {
        // repeat the last track
        loadTrack(tracks[currentTrackIndex], true);
      }
      else {
        const nextIdx = atEnd
          ? 0
          : currentTrackIndex + 1;
        loadTrack(tracks[nextIdx], true);
      }
    }
  };

  /* ──────────────────────────────────────────────────────── */
  /* Download helpers                                         */
  /* ──────────────────────────────────────────────────────── */
  const triggerDownload = (url, suggested) => {
    const a = document.createElement('a');
    a.href = url;
    if (suggested) a.download = suggested;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadTrack = (track) => {
    const url = track.download || track.file;
    triggerDownload(url, `${track.name || 'track'}.wav`);
  };

  const downloadAlbum = () => {
    const album = albums[currentAlbumIndex];
    if (!album?.albumZip) return;
    triggerDownload(album.albumZip, `${album.name || 'album'}.zip`);
  };

  /* ──────────────────────────────────────────────────────── */
  /* Exit back home                                           */
  /* ──────────────────────────────────────────────────────── */
  const goBackHome = () => {
    // Ensure audio stops before navigating away
    if (audioRef.current) {
      audioRef.current.pause(); // Pause the audio
      audioRef.current.ontimeupdate = null; // Remove the time update listener
      audioRef.current.onended = null; // Remove the end event listener
      setIsPlaying(false); // Set the playing state to false
    }
    // build a timeline
    const tl = gsap.timeline({
      onComplete: () => {
        // dispose Three.js
        rendererRef.current?.dispose();
        sceneRef.current?.clear();
        navigate('/');
      }
    });

    // fade out DOM elements
    tl.to(
      [
        sceneContainerRef.current,
        albumTextRef.current,
        detailsRef.current,
        footerRef.current,
        leftNavRef.current,
        rightNavRef.current
      ],
      { opacity: 0, duration: 0.5 }
    ).to(backHomeRef.current, { x: 15, duration: 0.15 }, 0)
      .to(backHomeRef.current, { x: -200, duration: 0.5 }, 0.15)
      .to(backHomeRef.current, { opacity: 0, duration: 0.5 }, 0);

    // simultaneously collapse the pattern
    if (pattern) {
      tl.to(
        pattern,
        {
          delay: 0.1,
          value: 0,
          opacity: 0,
          duration: 0.5,
          onUpdate() {
            pattern.regenerate({
              maxVertices: pattern.value,
              xPos: 0,
              yPos: 0,
              zPos: 0,
              xFunctionCode: 0,
              yFunctionCode: 1,
              deltaAngle: pattern.deltaAngle,
              scale: pattern.scale,
              xAngularFreq: 1,
              yAngularFreq: 1,
              xPhase: pattern.xAxis,
              yPhase: pattern.yAxis,
              loopVertex: 1000,
              paramsToAdjust: [],
              adjustAmounts: []
            });
          }
        },
        0
      );
    }
  };

  /* ──────────────────────────────────────────────────────── */
  /* Tooltip helpers                                          */
  /* ──────────────────────────────────────────────────────── */
  const showAlbumTip = () => { if (albumTipRef.current) albumTipRef.current.style.opacity = 1; };
  const hideAlbumTip = () => { if (albumTipRef.current) albumTipRef.current.style.opacity = 0; };
  const moveAlbumTip = e => {
    const tip = albumTipRef.current;
    if (!tip) return;

    // clear any residual centering transform
    tip.style.transform = 'none';

    const { clientX: x, clientY: y } = e;
    // cursor sits on the tooltip’s BOTTOM-LEFT corner
    tip.style.left = `${x}px`;                      // align left edges
    tip.style.top = `${y - tip.offsetHeight}px`;    // raise by its height
  };

  const scrollToDetails = () => {
  /* smooth-scroll so the album-details top edge hits the viewport */
  detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
};

  /* ──────────────────────────────────────────────────────── */
  /* Render JSX                                               */
  /* ──────────────────────────────────────────────────────── */
  return (
    <div className="music-page">
      {/* back to homepage */}
      <button className="music-back-home" onClick={goBackHome} ref={backHomeRef}>
        <div className="music-back-icon" aria-hidden="true" alt="Back home" />
        To Home
      </button>
      {/* Three.js canvas */}
      <div ref={sceneContainerRef} className="scene-container" />

      {/* Carousel nav hot-zones */}
      <div className="nav-area left" onClick={() => switchAlbum(-1)} />
      <div className="nav-area right" onClick={() => switchAlbum(1)} />

      {/* Chevron icons */}
      <div className="nav-area left" onClick={() => handleNav(-1, leftNavRef)} ref={leftNavRef}>
        <img src="/assets/icons/chevron-left-white.svg" alt="Prev album" />
      </div>
      <div className="nav-area right" onClick={() => handleNav(1, rightNavRef)} ref={rightNavRef}>
        <img src="/assets/icons/chevron-left-white.svg" alt="Next album" className="flipped" />
      </div>

      {/* Now-playing badge */}
      <div className="now-playing" ref={albumTextRef}>
        <h2 ref={albumNameRef}>{albums[currentAlbumIndex]?.name}</h2>
        <p ref={songTextRef}>
          {nowPlayingName}
        </p>
      </div>

      {/* Playback controls */}
      <div className="player-footer" ref={footerRef}>
        {/* Shuffle */}
        <button
          onClick={toggleShuffle}
          className={shuffle ? 'active' : ''}
        >
          <div className="music-shuffle-icon" />
        </button>
        {/* Prev */}
        <button onClick={handlePrevTrack}>
          <FaStepBackward />
        </button>
        {/* Play/Pause */}
        <button onClick={handlePlayPause}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        {/* Next */}
        <button onClick={handleNextTrack}>
          <FaStepForward />
        </button>
        {/* Repeat */}
        <button
          onClick={cycleRepeat}
          className={repeatMode !== 'none' ? 'active' : ''}
        >
          {repeatMode === 'one' ? (
            <div className="music-repeat-one-icon" />
          ) : (
            <div className="music-repeat-icon" />
          )}
        </button>
        <button className="details-btn" onClick={scrollToDetails}>
    Album&nbsp;Details
    <img
      src="/assets/icons/chevron-icon-down-white.png"
      alt=""
      className="details-arrow"
    />
  </button>
      </div>

      {/* Album details + sheet music */}
      <div className="album-details" ref={detailsRef}>
        <div ref={spacerRef} className="now-playing-spacer" />

        {/* Track list & album description row */}
        <div className="details-main">
          <div className="track-list-container">
            <table className="track-table">
              <thead>
                <tr>
                  <th></th>
                  <th>#</th>
                  <th>Title</th>
                  <th>Length</th>
                  <th className="dl-col">
                    <div
                      className="dl-tooltip"
                      onMouseEnter={showAlbumTip}
                      onMouseLeave={hideAlbumTip}
                      onMouseMove={moveAlbumTip}
                    >
                      <button
                        className="dl-header-btn"
                        onClick={downloadAlbum}
                        aria-label="Download whole album"
                      >
                        <span className="download-header-icon" />
                      </button>

                      {/* floating tooltip */}
                      <span ref={albumTipRef} className="dl-tooltip-text">
                        Download&nbsp;Album
                      </span>
                    </div>
                  </th>

                </tr>
              </thead>
              <tbody>
                {albums[currentAlbumIndex]?.tracks.map((track, idx) => (
                  <tr key={idx} className={idx === currentTrackIndex ? 'active' : ''} onClick={() => loadTrack(track, true)}>
                    <td className="play-cell">
                      <button className="row-play" onClick={() => loadTrack(track, true)}>
                        <FaPlay />
                      </button>
                    </td>
                    <td>{idx + 1}</td>
                    <td>{track.name}</td>
                    <td>{track.duration || '--:--'}</td>
                    <td className="dl-cell">
                      <button
                        className="row-download-btn"
                        onClick={(e) => { e.stopPropagation(); downloadTrack(track); }}
                        aria-label={`Download ${track.name}`}
                      >
                        <span className="download-row-icon" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="album-description">
            <h3>About this album</h3>
            <p>
              {albums[currentAlbumIndex]?.description || 'No description available.'}
            </p>
          </div>
        </div>

        {(() => {
          const parts = albums[currentAlbumIndex]
            ?.tracks[currentTrackIndex]?.parts || [];
          if (!parts.length) return null;

          return (
            <div className="sheet-music-card">
              <h3>Sheet Music</h3>
              <div className="instrument-grid">
                {parts.map((p, idx) => (
                  <div key={idx} className="instrument-group">
                    <div className="instrument-header">
                      <img src={p.icon} alt="" />
                      <span>{p.instrument}</span>
                    </div>

                    {Array.isArray(p.download)
                      ? p.download.map((url, n) => (
                        <a key={n} href={url} download className="part-btn">
                          Part&nbsp;{n + 1}
                        </a>
                      ))
                      : (
                        <a href={p.download} download className="part-btn">
                          Download
                        </a>
                      )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};