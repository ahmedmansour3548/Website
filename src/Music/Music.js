import './Music.css';
import React, { useEffect, useRef, useState, useContext } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
} from 'react-icons/fa';
import cameraInstance from '../utils/camera';
import { PatternContext } from "../index";
import { useNavigate } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Music = () => {
  // Three.js & pattern refs
  const sceneRef = useRef(new THREE.Scene());
  const camera = cameraInstance.getCamera();
  const rendererRef = useRef(null);
  const sceneContainerRef = useRef(null);
  const navigate = useNavigate();
  // Pattern from provider
  const { pattern, styles } = useContext(PatternContext);
  // Audio & playback state
  const [albums, setAlbums] = useState([]);
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const currentAlbumIndexRef = useRef(currentAlbumIndex);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [nowPlayingName, setNowPlayingName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none');
  const repeatModeRef = useRef(repeatMode);
  const [shuffledTracks, setShuffledTracks] = useState([]);
  // Vinyl group & offsets
  const albumGroupRef = useRef(new THREE.Group());
  const globalOffset = useRef(0);
  const targetOffset = useRef(0);
  const offsetTweenRef = useRef(null);
  const vinylTweensRef = useRef([]);
  const centerSpinTweenRef = useRef(null);
  // --- Drag-to-navigate state ---
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragOffsetStartRef = useRef(0);
  const continuousIndexRef = useRef(0);
  // Skybox reference
  const skyboxRef = useRef(null);
  const [initialized, setInitialized] = useState(false);

  const albumTextRef = useRef(null);
  const songTextRef = useRef(null);
  const footerRef = useRef(null);
  const detailsRef = useRef(null);
  const [scrollMode, setScrollMode] = useState('fixed'); // 'fixed' or 'pinned'
  const [pinnedTop, setPinnedTop] = useState(0);
  const [pinned, setPinned] = useState(false);
  // Load album data
  useEffect(() => {
    fetch('/music.json')
      .then(res => res.json())
      .then(({ albums }) => {
        setAlbums(albums);
        if (albums.length) {
          setCurrentAlbumIndex(0);
          currentAlbumIndexRef.current = 0;
          setCurrentTrackIndex(0);
          gsap.to(albumTextRef.current, { opacity: 1, duration: 0.5, delay: 0.5 });
          gsap.to(songTextRef.current, { opacity: 1, duration: 0.5, delay: 0.7 });
          loadTrack(albums[0].tracks[0], false);
        }
      })
      .catch(console.error);
  }, []);


  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    if (!pattern) return;
  pattern
      .setLineWidth(100)
      .setStyle(styles.SOLID)
      .setOpacity(0.8)
      .setColor(0xFF0000);
    }, [pattern]);

  // Initialize scene & renderer
useEffect(() => {
  if (!pattern || initialized) return;
  const scene = sceneRef.current;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.zIndex = '1';
  rendererRef.current = renderer;

  

  if (
    sceneContainerRef.current &&
    !sceneContainerRef.current.contains(renderer.domElement)
  ) {
    sceneContainerRef.current.appendChild(renderer.domElement);
  }

  // ─── DRAG + DECELERATION‐BASED INERTIA + SNAP + INFINITE ───
  const el = renderer.domElement;
  const spacing = window.innerWidth / 2.5;
  const totalWidth = () => albums.length * spacing;

  let lastX = 0, lastT = 0;

  const onPointerDown = e => {
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
    const tw      = totalWidth();
    const rawIdx  = (tw / 2 - globalOffset.current) / spacing;
    const nearest = Math.round(rawIdx);

    // sync continuous index
    continuousIndexRef.current = nearest;

    // wrap for UI + audio
    const wrapped = ((nearest % albums.length) + albums.length) % albums.length;
    const prev    = currentAlbumIndexRef.current;

    // update state + mirror ref
    setCurrentAlbumIndex(wrapped);
    currentAlbumIndexRef.current = wrapped;
    setCurrentTrackIndex(0);

    // tween into perfect center
    const snapOffset = tw / 2 - nearest * spacing;
    const snapObj    = { v: globalOffset.current };
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

  el.addEventListener('pointerdown', onPointerDown);
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
    el.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    renderer.dispose();
  };
}, [camera, albums]);



  const handleNav = (dir, ref) => {
    // scale feedback
    gsap.fromTo(ref.current, { scale: 1 }, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: 'center center' });
    // switch album
    switchAlbum(dir);
  };
  const leftNavRef = useRef(null);
  const rightNavRef = useRef(null);

  useEffect(() => {

    if (!initialized) return;
    // Build a spiral of, say, 2000 vertices,
    // centered at 0,0, with your usual deltaAngle & scale
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
      loopVertex: 1000,
      paramsToAdjust: [],
      adjustAmounts: []
    });
    // Make sure it’s fully opaque (so you see the red→green)
    pattern.material.opacity = 1;
    pattern.setAllVerticesColor(0xff0000);

  }, [initialized, navigate]);
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

  useEffect(() => {
    // kill old tweens
    vinylTweensRef.current.forEach(t => t.kill());
    vinylTweensRef.current = [];

    if (centerSpinTweenRef.current) {
      centerSpinTweenRef.current.kill();
      centerSpinTweenRef.current = null;
    }

    const children = albumGroupRef.current.children;
    children.forEach((vinylGroup, idx) => {
      // center index = currentAlbumIndex
      const isCenter = idx === currentAlbumIndex;

      if (isCenter) {
        // lock center one: make sure rotation is exactly flat
        gsap.killTweensOf(vinylGroup.rotation);
        vinylGroup.rotation.set(0, 0, 0);
      } else {
        // off-center: slow, subtle back‐and‐forth rotations on X & Y
        const tween = gsap.to(vinylGroup.rotation, {
          x: '+=0.15',          // rotate +0.2 radians on X...
          y: '+=0.15',         // and +0.15 on Y...
          duration: 4 + Math.random() * 2,    // 4–6s per cycle
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
        vinylTweensRef.current.push(tween);
      }
    });
  }, [albums, currentAlbumIndex]);
  // Create vinyl meshes
  useEffect(() => {
    if (!albums.length) return;
    const group = albumGroupRef.current;
    group.clear();

    const spacing = window.innerWidth / 2.5;
    albums.forEach((album, i) => {
      const vinylGroup = new THREE.Group();

      // Vinyl disc texture
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


  useEffect(() => {
    const el = albumTextRef.current;
    if (!el) return;

    // How far to scrub: 25% of viewport height
    const scrollDist = window.innerHeight * 0.25;
    const footerH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--footer-height'),
      10
    );

    // Make sure our base styles are correct
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.transformOrigin = 'center center';

    const st = ScrollTrigger.create({
      start: 0,
      end: scrollDist,
      scrub: true,
      onUpdate(self) {
        // 1) Move up by up to scrollDist
        const y = -scrollDist * self.progress;
        // 2) Scale from 1 → 1.2 over the last 10% (i.e. prog 0.9→1.0)
        const scalePortion = Math.min(Math.max((self.progress - 0.9) / 0.1, 0), 1);
        const scale = 1 + 0.2 * scalePortion;
        el.style.transform = `translateX(-50%) translateY(${y}px) scale(${scale})`;
      },
      onLeave() {
        // Once scrolled past scrollDist, switch to absolute so it "sticks" in place
        el.style.position = 'absolute';
        // Compute its top so it sits exactly where it ended up
        const topPx = window.innerHeight - footerH - scrollDist;
        el.style.top = `${topPx}px`;
        el.style.bottom = 'auto';
      },
      onEnterBack() {
        // If scrolling back above scrollDist, restore fixed positioning
        el.style.position = 'fixed';
        el.style.bottom = `${footerH}px`;
        el.style.top = 'auto';
      }
    });

    return () => st.kill();
  }, []);



  // Pattern helpers
  const fillPatternWithColor = (hex) => {
    if (!pattern?.geometry?.attributes?.color) return;
    const colors = pattern.geometry.attributes.color.array;
    const count = pattern.geometry.attributes.color.count;
    const r = ((hex >> 16) & 0xff) / 255;
    const g = ((hex >> 8) & 0xff) / 255;
    const b = ((hex >> 0) & 0xff) / 255;
    for (let i = 0; i < count; i++) {
      colors[i * 3 + 0] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    pattern.geometry.attributes.color.needsUpdate = true;
  };

  const updatePatternProgress = (percent) => {
    if (!pattern?.geometry?.attributes?.color) return;
    const colors = pattern.geometry.attributes.color.array;
    const count = pattern.geometry.attributes.color.count;
    const greenCount = Math.floor(count * percent);
    // first N vertices green
    for (let i = 0; i < greenCount; i++) {
      colors[i * 3 + 0] = 0;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 0;
    }
    // the rest red
    const rr = ((0xFF0000 >> 16) & 0xff) / 255;
    const rg = ((0xFF0000 >> 8) & 0xff) / 255;
    const rb = ((0xFF0000 >> 0) & 0xff) / 255;
    for (let i = greenCount; i < count; i++) {
      colors[i * 3 + 0] = rr;
      colors[i * 3 + 1] = rg;
      colors[i * 3 + 2] = rb;
    }
    pattern.geometry.attributes.color.needsUpdate = true;
  };

  // -----------------------
  // switchAlbum
  // -----------------------
const switchAlbum = (dir) => {
  if (!albums.length) return;

  // ─── 1) Stop & detach any running audio callbacks ───
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.ontimeupdate = null;
    audioRef.current.onended = null;
    setIsPlaying(false);
  }

  // ─── 2) Immediately wipe the pattern fully red ───
  pattern.setColor(0xFF0000);

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

  // ─── 3) bump our continuous (unwrapped) index ───
  continuousIndexRef.current += dir;

  // ─── 4) compute wrapped index for React state and audio logic ───
  const len = albums.length;
  const wrapped = ((continuousIndexRef.current % len) + len) % len;
  const prev    = currentAlbumIndex;

  // ─── 5) update React state immediately ───
  setCurrentAlbumIndex(wrapped);
  currentAlbumIndexRef.current = wrapped;
  setCurrentTrackIndex(0);

  // ─── 6) compute new targetOffset based on continuous index ───
  const spacing = window.innerWidth / 2.5;
  const totalW  = len * spacing;
  // offset formula: index 0 → totalW/2, index i → totalW/2 - i*spacing
  targetOffset.current = totalW / 2 - continuousIndexRef.current * spacing;

  // ─── 7) tween from actual position → targetOffset ───
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


  // -----------------------
  // loadTrack (with quick spin + then continuous spin)
  // -----------------------
  const loadTrack = (
    track,
    autoplay = true,
    albumIndex = currentAlbumIndex,
    trackArray
  ) => {
    if (!track) return;

    // fade out title text
    gsap.to(songTextRef.current, { opacity: 0, duration: 0.3 });

    setTimeout(() => {
      // 1) Stop any existing audio and tear down callbacks
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.ontimeupdate = null;
        audioRef.current.onended = null;
      }

      // 2) Determine which track list to use (shuffle vs. normal)
      const baseTracks = albums[albumIndex]?.tracks ?? [];
      const tracks = trackArray ?? (shuffle ? shuffledTracks : baseTracks);
      const newTrackIndex = tracks.indexOf(track);

      // 3) Create the new Audio
      audioRef.current = new Audio(track.file);

      // 4) Reset the pattern: all red → start at 50% green
      pattern.setColor(0xFF0000);
      updatePatternProgress(0.5);

      // 5) Update pattern as the song plays (maps [0→1] → [0.5→1])
      audioRef.current.ontimeupdate = () => {
        const d = audioRef.current.duration;
        if (!d) return;
        const raw = audioRef.current.currentTime / d;          // [0→1]
        const scaled = 0.58 + 0.58 * Math.min(raw, 1);             // [0.5→1]
        updatePatternProgress(scaled);
      };

      // 6) Handle track end
      audioRef.current.onended = () => {
        // fill pattern fully green
        updatePatternProgress(1);
        const centerVinyl = albumGroupRef.current.children[albumIndex];

        // 1) if repeat-one, just reload the same track
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

        // figure out if we’re at the last
        const isLast = newTrackIndex >= tracks.length - 1;

        if (!isLast || repeatModeRef.current === 'album') {
          // if album-repeat or not last --> spin & advance
          gsap.to(centerVinyl.rotation, {
            z: '+=3.1416',    // half-turn
            duration: 0.4,
            ease: 'power2.out',
            onComplete: () => {
              // choose next index (wrap if needed)
              let nextIdx = newTrackIndex + 1;
              if (nextIdx >= tracks.length) nextIdx = 0;
              loadTrack(
                tracks[nextIdx],
                true,
                albumIndex,
                shuffle ? tracks : undefined
              );
            }
          });
        } else if (repeatModeRef.current === 'one') {
          // repeat-one: simply reload same track
          loadTrack(track, true, albumIndex, shuffle ? tracks : undefined);
        } else {
          // no repeat & last track → stop playback
          setIsPlaying(false);
          centerSpinTweenRef.current?.kill();
        }
      };

      // 7) Update React state
      setCurrentTrackIndex(newTrackIndex);
      setNowPlayingName(track.name);
      setIsPlaying(autoplay);

      // 8) Vinyl spin: quick 360° then infinite
      const centerVinyl = albumGroupRef.current.children[albumIndex];
      if (autoplay && centerVinyl) {
        centerSpinTweenRef.current?.kill();
        gsap.to(centerVinyl.rotation, {
          z: '+=6.28319', // full turn
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            centerSpinTweenRef.current = gsap.to(
              centerVinyl.rotation,
              { z: '+=6.28319', duration: 10, ease: 'linear', repeat: -1 }
            );
          }
        });

        audioRef.current.play().catch(console.error);
      }

      // fade title back in
      gsap.to(songTextRef.current, { opacity: 1, duration: 0.5, delay: 0.2 });
    }, 300);
  };

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
      audioRef.current.play(); setIsPlaying(true);
      gsap.to(center.rotation, { z: '+=6.283', duration: 10, ease: 'linear', repeat: -1 });
    } else {
      audioRef.current.pause(); setIsPlaying(false);
      gsap.killTweensOf(center.rotation);
      gsap.to(center.rotation, { z: 0, duration: 0.5, ease: 'power2.out' });
    }
  };

  const handlePrevTrack = () => {
    if (albums[currentAlbumIndex]?.tracks?.length && audioRef.current) {
      if (audioRef.current.currentTime < 3 && currentTrackIndex > 0) {
        loadTrack(albums[currentAlbumIndex].tracks[currentTrackIndex - 1], true);
      } else {
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
      } else {
        const nextIdx = atEnd
          ? 0
          : currentTrackIndex + 1;
        loadTrack(tracks[nextIdx], true);
      }
    }
  };

  const goBackHome = () => {
    // build a timeline
    const tl = gsap.timeline({
      onComplete: () => {
        // dispose Three.js
        rendererRef.current?.dispose();
        sceneRef.current?.clear();
        navigate('/');
      }
    });

    // 1) fade out DOM elements
    tl.to(
      [
        sceneContainerRef.current,
        albumTextRef.current,
        detailsRef.current,
        footerRef.current
      ],
      { opacity: 0, duration: 0.5 }
    );

    // 2) simultaneously collapse the pattern
    tl.to(
      pattern,
      {
        /* make sure these props actually exist on your pattern object */
        value: 0,
        opacity: 0,
        duration: 1,
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
  };


  return (
    <div className="music-page">
      <button className="music-back-home" onClick={goBackHome}>
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

      {/* Now Playing overlay */}
      <div className="now-playing" ref={albumTextRef}>
        <h2>{albums[currentAlbumIndex]?.name}</h2>
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
      </div>

      {/* Album details + sheet music */}
      <div className="album-details" ref={detailsRef}>
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

        {/* Sheet music download card */}
        <div className="sheet-music-card">
          <h3>Sheet Music</h3>
          {albums[currentAlbumIndex]?.tracks[currentTrackIndex]?.parts?.length ? (
            <div className="parts-grid">
              {albums[currentAlbumIndex].tracks[currentTrackIndex].parts.map((p, i) => (
                <a
                  key={i}
                  href={p.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="part-tile"
                >
                  <img src={p.icon} alt={`${p.instrument} icon`} />
                  <span>{p.instrument}</span>
                </a>
              ))}
            </div>
          ) : (
            <p>No sheet-music available for this track.</p>
          )}
        </div>
      </div>
    </div>
  );

};

export default Music;

