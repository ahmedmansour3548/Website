import './Music.css';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward
} from 'react-icons/fa';
import cameraInstance from '../utils/camera';
import Pattern from '../utils/Pattern';

const Music = () => {
  const musicContainerRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const camera = cameraInstance.getCamera();
  const rendererRef = useRef(null);
  const patternRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // --- State for album data and current selection ---
  const [albums, setAlbums] = useState([]);
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const vinylTweenRef = useRef(null);
  const patternOverrideRef = useRef(false);

  // A group to hold our vinyl groups.
  const albumGroupRef = useRef(new THREE.Group());
  // Continuous offset refs.
  const globalOffset = useRef(0);
  const targetOffset = useRef(0);
  const offsetTweenRef = useRef(null);

  // A ref to hold the current skybox mesh.
  const skyboxRef = useRef(null);

  // --- Load album data from JSON ---
  useEffect(() => {
    fetch('music.json')
      .then((res) => res.json())
      .then((data) => {
        console.log("Loaded albums:", data.albums);
        setAlbums(data.albums);
        if (data.albums.length > 0) {
          setCurrentAlbumIndex(0);
          setCurrentTrackIndex(0);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // --- Setup Three.js scene, renderer, pattern, vinyl container, camera, and lights ---
  useEffect(() => {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '0';
    musicContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Retrieve pattern state from sessionStorage.
    const storedPattern = sessionStorage.getItem("patternState");
    const patternState = storedPattern ? JSON.parse(storedPattern) : null;

    // Instantiate the pattern.
    patternRef.current = new Pattern(sceneRef.current, camera, false, 1, "music-pattern", 0xFF0000);
    if (patternState && patternRef.current.regeneratePatternArea) {
      patternRef.current.regeneratePatternArea({
        maxVertices: patternState.value,
        xPos: 0,
        yPos: 0,
        xFunctionCode: 0,
        yFunctionCode: 1,
        deltaAngle: patternState.deltaAngle,
        scale: 1,
        xAngularFreq: 1,
        yAngularFreq: 1,
        xPhase: patternState.xAxis,
        yPhase: patternState.yAxis,
        loopVertex: 1000,
        paramsToAdjust: [],
        adjustAmounts: []
      });
    }
    // Add the vinyl group container.
    albumGroupRef.current.position.set(0, -150, 0);
    sceneRef.current.add(albumGroupRef.current);

    // Set up camera.
    camera.position.set(0, 0, 600);
    camera.lookAt(sceneRef.current.position);

    // *** NEW: Add lights for a realistic reflective look ***
    // An ambient light to provide base illumination.
    const ambientLight = new THREE.AmbientLight(0x404040, 10000);
    sceneRef.current.add(ambientLight);
    // A point light positioned to shine on the center vinyl.
    const pointLight = new THREE.PointLight(0xffffff, 1000.5, 10);
    sceneRef.current.add(pointLight);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(sceneRef.current, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      if (patternRef.current) patternRef.current.cleanup();
    };
  }, [camera]);

  // --- Helper: Update vinyl positions based on globalOffset ---
  const updateAllVinylPositions = () => {
    if (!albums.length) return;
    const spacing = window.innerWidth / 2.5;
    const n = albums.length;
    const totalWidth = n * spacing;
    albumGroupRef.current.children.forEach((child, i) => {
      let rawPos = ((i * spacing + globalOffset.current) % totalWidth + totalWidth) % totalWidth;
      child.position.x = rawPos - totalWidth / 2;
    });
  };

  // --- Create vinyl groups ---
  useEffect(() => {
    if (albums.length === 0) return;
    while (albumGroupRef.current.children.length > 0) {
      albumGroupRef.current.remove(albumGroupRef.current.children[0]);
    }
    const spacing = window.innerWidth / 2.5;
    albums.forEach((album, i) => {
      const vinylGroup = new THREE.Group();

      // Create the vinyl disc using a Cylinder.
      const discGeometry = new THREE.CylinderGeometry(200, 200, 2, 32);
      const vinylTexture = new THREE.TextureLoader().load("/assets/vinyl3.png");
      // *** UPDATED: Use a Phong material for specular highlights (reflection)
      const discMaterial = new THREE.MeshPhongMaterial({
        map: vinylTexture,
        color: 0x000000,       // Pure black base color
        specular: 0x222222,    // Adjust specular highlight color as needed
        shininess: 150,        // Increase shininess for more reflectivity
        transparent: true
      });
      const vinylDisc = new THREE.Mesh(discGeometry, discMaterial);
      vinylDisc.rotation.x = Math.PI / 2;

      // Create the label (unchanged).
      const labelGeometry = new THREE.CylinderGeometry(60, 60, 6, 32);
      const labelTexture = new THREE.TextureLoader().load(album.frontCover);
      const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.rotation.x = Math.PI / 2;
      label.position.z = 0.3;

      vinylGroup.add(vinylDisc);
      vinylGroup.add(label);
      vinylGroup.userData = { album, vinylDisc, label };
      vinylGroup.position.set(i * spacing, window.innerHeight / 6, 0);
      albumGroupRef.current.add(vinylGroup);
    });
    const spacingVal = window.innerWidth / 2.5;
    const n = albums.length;
    const totalWidth = n * spacingVal;
    globalOffset.current = totalWidth / 2 - currentAlbumIndex * spacingVal;
    targetOffset.current = globalOffset.current;
    updateAllVinylPositions();

    // Load the track for the current album.
    if (albums[currentAlbumIndex] && albums[currentAlbumIndex].tracks.length > 0) {
      loadTrack(albums[currentAlbumIndex].tracks[0]);
    }
    // Also load the current album's skybox.
    if (albums[currentAlbumIndex].skybox) {
      loadSkybox(albums[currentAlbumIndex].skybox, 10.0);
    }
  }, [albums]);

  useEffect(() => {
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate the skybox slowly
      if (skyboxRef.current) {
        skyboxRef.current.rotation.y += 0.0005; // Adjust speed as needed
      }
      
      rendererRef.current.render(sceneRef.current, camera);
    };
    animate();
  }, []);

  // --- Skybox Helper Functions using CubeTextureLoader ---
  const loadSkybox = (urls, fadeInDuration = 1) => {
    // Use CubeTextureLoader to load the cube texture.
    const cubeLoader = new THREE.CubeTextureLoader();
    cubeLoader.load(urls, (cubeTexture) => {
      // Use the built-in cube shader.
      const shader = THREE.ShaderLib["cube"];
      const uniforms = THREE.UniformsUtils.clone(shader.uniforms);
      uniforms["tCube"].value = cubeTexture;
      const skyboxMaterial = new THREE.ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: uniforms,
        depthWrite: false,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0
      });
      const skyboxGeometry = new THREE.BoxGeometry(5000, 5000, 5000);
      const skyboxMesh = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
      // Remove any existing skybox.
      if (skyboxRef.current) {
        sceneRef.current.remove(skyboxRef.current);
        skyboxRef.current = null;
      }
      sceneRef.current.add(skyboxMesh);
      skyboxRef.current = skyboxMesh;
      gsap.to(skyboxMesh.material, {
        opacity: 1,
        duration: fadeInDuration,
        ease: "power2.inOut"
      });
    });
  };

  const fadeOutSkybox = (fadeOutDuration = 0.5, onComplete) => {
    if (!skyboxRef.current) {
      if (onComplete) onComplete();
      return;
    }
    gsap.to(skyboxRef.current.material, {
      opacity: 0,
      duration: fadeOutDuration,
      ease: "power2.inOut",
      onComplete: () => {
        sceneRef.current.remove(skyboxRef.current);
        skyboxRef.current = null;
        if (onComplete) onComplete();
      }
    });
  };

const setAllPatternToColor = (colorHex) => {
  if (
    patternRef.current &&
    patternRef.current.geometry &&
    patternRef.current.geometry.attributes.color
  ) {
    const geometry = patternRef.current.geometry;
    const colors = geometry.attributes.color.array;
    const totalVertices = geometry.attributes.color.count;
    const r = ((colorHex >> 16) & 0xff) / 255;
    const g = ((colorHex >> 8) & 0xff) / 255;
    const b = (colorHex & 0xff) / 255;
    for (let i = 0; i < totalVertices; i++) {
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    geometry.attributes.color.needsUpdate = true;
  }
};

const setPatternToGreenPercent = (greenPercent) => {
  if (
    patternRef.current &&
    patternRef.current.geometry &&
    patternRef.current.geometry.attributes.color
  ) {
    const geometry = patternRef.current.geometry;
    const colors = geometry.attributes.color.array;
    const totalVertices = geometry.attributes.color.count;
    const greenCount = Math.floor(totalVertices * greenPercent);
    for (let i = 0; i < greenCount; i++) {
      colors[i * 3] = 0;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 0;
    }
    for (let i = greenCount; i < totalVertices; i++) {
      colors[i * 3] = ((0xFF0000 >> 16) & 0xff) / 255;
      colors[i * 3 + 1] = ((0xFF0000 >> 8) & 0xff) / 255;
      colors[i * 3 + 2] = (0xFF0000 & 0xff) / 255;
    }
    geometry.attributes.color.needsUpdate = true;
  }
};

  // --- Album Switching Functions using continuous globalOffset ---
  const handleAlbumNext = () => {
    if (!albums.length) return;
    // Fade out the current skybox.
    fadeOutSkybox(0.3);
    // Set the pattern override: force all vertices to red.
    patternOverrideRef.current = true;
    setAllPatternToColor(0xFF0000);
    const spacingVal = window.innerWidth / 2.5;
    const n = albums.length;
    const totalWidth = n * spacingVal;
    targetOffset.current -= spacingVal;
    if (offsetTweenRef.current) offsetTweenRef.current.kill();
    const offsetObj = { value: globalOffset.current };
    offsetTweenRef.current = gsap.to(offsetObj, {
      value: targetOffset.current,
      duration: 0.5,
      ease: "power2.inOut",
      onUpdate: function () {
        globalOffset.current = this.targets()[0].value;
        updateAllVinylPositions();
      },
      onComplete: () => {
        let k = (totalWidth / 2 - globalOffset.current) / spacingVal;
        let newIndex = ((Math.round(k)) % n + n) % n;
        setCurrentAlbumIndex(newIndex);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = new Audio(albums[newIndex].tracks[0].file);
          setIsPlaying(false);
          setCurrentTrackIndex(0);
        }
        const activeVinyl = albumGroupRef.current.children.find(child => Math.abs(child.position.x) < 5);
        if (activeVinyl) {
          gsap.to(activeVinyl.scale, {
            x: 1.2,
            y: 1.2,
            z: 1.2,
            duration: 0.25,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
          });
        }
        // Load new album's skybox.
        if (albums[newIndex].skybox) {
          loadSkybox(albums[newIndex].skybox, 0.5);
        }

        // After the vinyl switch is complete, remove the override and set the pattern back to 50% green.
      patternOverrideRef.current = false;
      setPatternToGreenPercent(0.5);
      }
    });
  };

  const handleAlbumPrevious = () => {
    if (!albums.length) return;
    fadeOutSkybox(0.3);
    // Set the pattern override: force all vertices to red.
    patternOverrideRef.current = true;
    // Set the pattern override: force all vertices to red.
  patternOverrideRef.current = true;
  setAllPatternToColor(0xFF0000);
    const spacingVal = window.innerWidth / 2.5;
    const n = albums.length;
    const totalWidth = n * spacingVal;
    targetOffset.current += spacingVal;
    if (offsetTweenRef.current) offsetTweenRef.current.kill();
    const offsetObj = { value: globalOffset.current };
    offsetTweenRef.current = gsap.to(offsetObj, {
      value: targetOffset.current,
      duration: 0.5,
      ease: "power2.inOut",
      onUpdate: function () {
        globalOffset.current = this.targets()[0].value;
        updateAllVinylPositions();
      },
      onComplete: () => {
        let k = (totalWidth / 2 - globalOffset.current) / spacingVal;
        let newIndex = ((Math.round(k)) % n + n) % n;
        setCurrentAlbumIndex(newIndex);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = new Audio(albums[newIndex].tracks[0].file);
          setIsPlaying(false);
          setCurrentTrackIndex(0);
        }
        const activeVinyl = albumGroupRef.current.children.find(child => Math.abs(child.position.x) < 5);
        if (activeVinyl) {
          gsap.to(activeVinyl.scale, {
            x: 1.2,
            y: 1.2,
            z: 1.2,
            duration: 0.25,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
          });
        }
        if (albums[newIndex].skybox) {
          loadSkybox(albums[newIndex].skybox, 0.5);
        }
        // After the vinyl switch is complete, remove the override and set the pattern back to 50% green.
      patternOverrideRef.current = false;
      setPatternToGreenPercent(0.5);
      }
    });
  };

  // --- Track Playback Functions ---
  const loadAndPlayTrack = (track) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(track.file);
    audioRef.current = audio;
    audio.play();
    setIsPlaying(true);
    const activeGroup = albumGroupRef.current.children.find(child => Math.abs(child.position.x) < 5);
    if (activeGroup) {
      gsap.killTweensOf(activeGroup.rotation);
      gsap.to(activeGroup.rotation, {
        z: activeGroup.rotation.z + Math.PI * 2,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          vinylTweenRef.current = gsap.to(activeGroup.rotation, {
            z: "+=" + Math.PI * 2,
            duration: 10,
            ease: "linear",
            repeat: -1
          });
        }
      });
    }
  };

  const loadTrack = (track) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(track.file);
    audioRef.current = audio;
    setIsPlaying(false);
    const activeGroup = albumGroupRef.current.children.find(child => Math.abs(child.position.x) < 5);
    if (activeGroup) {
      gsap.killTweensOf(activeGroup.rotation);
      gsap.to(activeGroup.rotation, {
        z: activeGroup.rotation.z + Math.PI * 2,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          if (vinylTweenRef.current) vinylTweenRef.current.pause();
        }
      });
    }
  };

  const handleTrackClick = (track, index) => {
    setCurrentTrackIndex(index);
    loadAndPlayTrack(track);
  };

  // --- Playback Control Handlers ---
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    const activeGroup = albumGroupRef.current.children.find(child => Math.abs(child.position.x) < 5);
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
      if (activeGroup) {
        vinylTweenRef.current = gsap.to(activeGroup.rotation, {
          z: "+=" + Math.PI * 2,
          duration: 10,
          ease: "linear",
          repeat: -1
        });
      }
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      if (activeGroup) gsap.killTweensOf(activeGroup.rotation);
    }
  };

  const handlePrevious = () => {
    if (!audioRef.current || albums.length === 0) return;
    if (audioRef.current.currentTime < 3 && currentTrackIndex > 0) {
      const prevIndex = currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      loadAndPlayTrack(albums[currentAlbumIndex].tracks[prevIndex]);
    } else {
      audioRef.current.currentTime = 0;
    }
  };

  const handleNext = () => {
    if (!audioRef.current || albums.length === 0) return;
    const tracks = albums[currentAlbumIndex].tracks;
    if (currentTrackIndex < tracks.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIndex);
      loadAndPlayTrack(tracks[nextIndex]);
    } else {
      setCurrentTrackIndex(0);
      loadAndPlayTrack(tracks[0]);
    }
  };

  // --- Dynamic Pattern Color Update (unchanged) ---
  useEffect(() => {
    let rafId;
    const updatePatternProgress = () => {
      if (
        audioRef.current &&
        audioRef.current.duration &&
        patternRef.current &&
        patternRef.current.geometry &&
        patternRef.current.geometry.attributes.color
      ) {
        // Only update if we are not overriding
        if (!patternOverrideRef.current) {
          const p = audioRef.current.currentTime / audioRef.current.duration;
          // Here we compute modifiedProgress – you can adjust this if 50% green is desired at p=0.
          let modifiedProgress = 0.57 + 0.5 * p;
          const geometry = patternRef.current.geometry;
          const colors = geometry.attributes.color.array;
          const totalVertices = geometry.attributes.color.count;
          const greenCount = Math.floor(totalVertices * modifiedProgress);
          for (let i = 0; i < greenCount; i++) {
            colors[i * 3] = 0;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 0;
          }
          for (let i = greenCount; i < totalVertices; i++) {
            colors[i * 3] = ((0xFF0000 >> 16) & 0xff) / 255;
            colors[i * 3 + 1] = ((0xFF0000 >> 8) & 0xff) / 255;
            colors[i * 3 + 2] = (0xFF0000 & 0xff) / 255;
          }
          geometry.attributes.color.needsUpdate = true;
        }
      }
      rafId = requestAnimationFrame(updatePatternProgress);
    };
    updatePatternProgress();
    return () => cancelAnimationFrame(rafId);
  }, []);
  
  

  return (
    <div className="music-page">
      <div className="music-container" ref={musicContainerRef}></div>
      <div className="music-options">
        {albums.length > 0 && (
          <>
            <div className="album-info">
              <h2>{albums[currentAlbumIndex].name}</h2>
              <p>{albums[currentAlbumIndex].artist} ({albums[currentAlbumIndex].year})</p>
            </div>
            <div className="album-switcher">
              <button className="album-switch-button" onClick={handleAlbumPrevious}>
                <FaChevronLeft size={28} />
              </button>
              <button className="album-switch-button" onClick={handleAlbumNext}>
                <FaChevronRight size={28} />
              </button>
            </div>
            <div className="music-player-bar">
              <button className="control-button" onClick={handlePrevious}>
                <FaStepBackward size={24} />
              </button>
              <button className="control-button" onClick={handlePlayPause}>
                {isPlaying ? <FaPause size={30} /> : <FaPlay size={30} />}
              </button>
              <button className="control-button" onClick={handleNext}>
                <FaStepForward size={24} />
              </button>
            </div>
            <div className="track-list">
              {albums[currentAlbumIndex].tracks &&
                albums[currentAlbumIndex].tracks.map((track, index) => (
                  <div
                    key={index}
                    className={`track ${index === currentTrackIndex ? 'active' : ''}`}
                    onMouseEnter={(e) => e.currentTarget.classList.add("highlight")}
                    onMouseLeave={(e) => e.currentTarget.classList.remove("highlight")}
                    onClick={() => handleTrackClick(track, index)}
                  >
                    <span className="track-number">{index + 1}.</span>
                    <span className="track-name">{track.name}</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Music;
