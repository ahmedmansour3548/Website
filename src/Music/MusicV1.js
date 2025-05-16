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

const Music = () => {
  // Three.js & pattern refs
  const sceneRef = useRef(new THREE.Scene());
  const camera = cameraInstance.getCamera();
  const rendererRef = useRef(null);
  const sceneContainerRef = useRef(null);
  const navigate = useNavigate();
  // Pattern from provider
  const patternRef = useContext(PatternContext);
  const patternTickerRef = useRef(null);
  // Audio & playback state
  const [albums, setAlbums] = useState([]);
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Vinyl group & offsets
  const albumGroupRef = useRef(new THREE.Group());
  const globalOffset = useRef(0);
  const targetOffset = useRef(0);
  const offsetTweenRef = useRef(null);
  const vinylTweensRef = useRef([]);
  const centerSpinTweenRef  = useRef(null);
  // Skybox reference
  const skyboxRef = useRef(null);
  const [initialized, setInitialized] = useState(false);

  // Load album data
  useEffect(() => {
    fetch('/music.json')
      .then(res => res.json())
      .then(({ albums }) => {
        setAlbums(albums);
        if (albums.length) {
          setCurrentAlbumIndex(0);
          setCurrentTrackIndex(0);
          loadTrack(albums[0].tracks[0], false);
        }
      })
      .catch(console.error);
  }, []);

  // Initialize scene & renderer
  useEffect(() => {

    const scene = sceneRef.current;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '1';
    rendererRef.current = renderer;

    // Attach canvas
    if (sceneContainerRef.current) {
      sceneContainerRef.current.appendChild(renderer.domElement);
    }

    // Setup group
    albumGroupRef.current.position.set(0, -150, 0);
    scene.add(albumGroupRef.current);

    // Camera
    camera.position.set(0, 0, 600);
    camera.lookAt(scene.position);

    // Lights
    scene.add(new THREE.AmbientLight(0x404040, 1.5));
    const pointLight = new THREE.PointLight(0xffffff, 1.2);
    pointLight.position.set(0, 200, 300);
    scene.add(pointLight);



    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
    setInitialized(true);



    return () => renderer.dispose();
  }, [camera]);

  useEffect(() => {

    if (!initialized) return;
    // Build a spiral of, say, 2000 vertices,
    // centered at 0,0, with your usual deltaAngle & scale
    patternRef.current.regenerate({
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
    patternRef.current.material.opacity = 1;
    patternRef.current.setAllVerticesColor(0xff0000);

  }, [initialized, navigate]);
  // Update vinyl positions
  const updateAllVinylPositions = () => {
    if (!albums.length) return;
    const spacing = window.innerWidth / 2.5;
    const totalWidth = albums.length * spacing;
    albumGroupRef.current.children.forEach((child, i) => {
      const raw = ((i * spacing + globalOffset.current) % totalWidth + totalWidth) % totalWidth;
      child.position.x = raw - totalWidth / 2;
    });
  };

  useEffect(() => {
    // kill old tweens
    vinylTweensRef.current.forEach(t => t.kill());
    vinylTweensRef.current = [];

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
          x: '+=0.2',          // rotate +0.2 radians on X...
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
      label.rotation.x = Math.PI / 2;
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

  // Pattern helpers
  const setPatternToColor = (hex) => {
    patternRef.current?.setAllVerticesColor(hex);
  };
  const setPatternProgress = (percent) => {
    const pattern = patternRef.current;
    if (pattern?.geometry?.attributes?.color) {
      const geom = pattern.geometry;
      const colors = geom.attributes.color.array;
      const total = geom.attributes.color.count;
      const greenCount = Math.floor(total * percent);
      for (let i = 0; i < greenCount; i++) {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 0;
      }
      for (let i = greenCount; i < total; i++) {
        colors[i * 3] = ((0xff0000 >> 16) & 0xff) / 255;
        colors[i * 3 + 1] = ((0xff0000 >> 8) & 0xff) / 255;
        colors[i * 3 + 2] = (0xff0000 & 0xff) / 255;
      }
      geom.attributes.color.needsUpdate = true;
    }
  };

  // Album navigation
  const switchAlbum = (direction) => {
    if (!albums.length) return;
    const spacing = window.innerWidth / 2.5;
    const totalWidth = albums.length * spacing;

    setPatternToColor(0xff0000);

    targetOffset.current += direction * spacing;
    offsetTweenRef.current?.kill();
    const obj = { v: globalOffset.current };
    offsetTweenRef.current = gsap.to(obj, {
      v: targetOffset.current,
      duration: 0.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        globalOffset.current = obj.v;
        updateAllVinylPositions();
      },
      onComplete: () => {
        const idx = Math.round((totalWidth / 2 - globalOffset.current) / spacing) % albums.length;
        const newIndex = (idx + albums.length) % albums.length;
        setCurrentAlbumIndex(newIndex);
        const newAlbum = albums[newIndex];
        loadTrack(newAlbum.tracks[0], false);
        // if (newAlbum.skybox) loadSkybox(newAlbum.skybox);

        // Reset pattern to 50%
        setPatternProgress(0.5);
      },
    });
  };

  // Track loading & playback
  const loadTrack = (track, autoplay) => {
    audioRef.current?.pause();
    audioRef.current = new Audio(track.file);
    setCurrentTrackIndex(albums[currentAlbumIndex].tracks.indexOf(track));
    setIsPlaying(autoplay);
    if (autoplay) audioRef.current.play();
  };
  
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    const centerVinyl = albumGroupRef.current.children[currentAlbumIndex];

    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);

      // KILL any existing spin tween
      centerSpinTweenRef.current?.kill();

      // START a new turntable spin
      centerSpinTweenRef.current = gsap.to(centerVinyl.rotation, {
        z: '+=6.283', duration: 10, ease: 'linear', repeat: -1
      });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);

      // STOP the spin tween
      centerSpinTweenRef.current?.kill();
      centerSpinTweenRef.current = null;

      // gently level back flat
      gsap.to(centerVinyl.rotation, { z: 0, duration: 0.5, ease: 'power2.out' });
    }
  };

  const handlePrevTrack = () => {
    if (!audioRef.current) return;
    if (audioRef.current.currentTime < 3 && currentTrackIndex > 0) {
      loadTrack(albums[currentAlbumIndex].tracks[currentTrackIndex - 1], true);
    } else {
      audioRef.current.currentTime = 0;
    }
  };
  const handleNextTrack = () => {
    const tracks = albums[currentAlbumIndex].tracks;
    const next = (currentTrackIndex + 1) % tracks.length;
    loadTrack(tracks[next], true);
  };

  return (
    <div className="music-page">
      <div ref={sceneContainerRef} className="scene-container" />

      <div className="player-footer">
        <div className="album-info">
          <h2>{albums[currentAlbumIndex]?.name}</h2>
          <p>{albums[currentAlbumIndex]?.artist} ({albums[currentAlbumIndex]?.year})</p>
        </div>
        <div className="album-switcher">
          <button onClick={() => switchAlbum(-1)}><FaChevronLeft /></button>
          <button onClick={() => switchAlbum(1)}><FaChevronRight /></button>
        </div>
        <div className="music-player-bar">
          <button onClick={handlePrevTrack}><FaStepBackward /></button>
          <button onClick={handlePlayPause}>{isPlaying ? <FaPause /> : <FaPlay />}</button>
          <button onClick={handleNextTrack}><FaStepForward /></button>
        </div>
      </div>

      <div className="album-details">
        <div className="track-list">
          {albums[currentAlbumIndex]?.tracks.map((track, idx) => (
            <div key={idx}
              className={`track ${idx === currentTrackIndex ? 'active' : ''}`}
              onClick={() => loadTrack(track, true)}>
              <span className="track-number">{idx + 1}.</span>
              <span className="track-name">{track.name}</span>
            </div>
          ))}
        </div>
        <div className="album-description">
          <h3>About this album</h3>
          <p>{albums[currentAlbumIndex]?.description || 'No description available.'}</p>
        </div>
      </div>
    </div>
  );
};

export default Music;
