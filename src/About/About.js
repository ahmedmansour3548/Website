// src/About/About.js
import React, { useEffect, useRef } from 'react';
import './About.css';
import * as THREE from 'three';
import Pattern from "../utils/Pattern";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const primaryTech = [
  { file: 'js.svg', label: 'JavaScript', url: '/projects/coding/knighthacks2020' },
  { file: 'reactjs.svg', label: 'React', url: '/projects/react' },
  { file: 'threejs.svg', label: 'Three.js', url: '/projects/threejs' },
  { file: 'unity.svg', label: 'Unity', url: '/projects/unity' },
  { file: 'nodejs.svg', label: 'Node.js', url: '/projects/nodejs' },
  { file: 'scss.svg', label: 'SCSS', url: '/projects/scss' }
];

const otherTech = [
  { file: 'typescript.svg', label: 'TypeScript', url: '/projects/typescript' },
  { file: 'git.svg', label: 'Git', url: '/projects/git' },
  { file: 'mysql.svg', label: 'MySQL', url: '/projects/mysql' },
  { file: 'angular.svg', label: 'Angular', url: '/projects/angular' },
  { file: 'nextjs.svg', label: 'Next.js', url: '/projects/nextjs' },
  { file: 'java.svg', label: 'Java', url: '/projects/java' }
];

const socialLinks = [
  { file: 'linkedin.svg', url: 'https://www.linkedin.com/in/yourprofile', label: 'LinkedIn' },
  { file: 'github.svg', url: 'https://github.com/yourusername', label: 'GitHub' },
  { file: 'resume.svg', url: '/assets/resume.pdf', label: 'Resume' }
];
const sections = [
  {
    title: 'Who am I?',
    text:
      'I’m Ahmed Mansour — software engineer, XR creator, musician, philosopher. Forever curious, I blend code, sound, and thought into immersive experiences.',
    img: '/assets/photos/Me_1.JPG',
    tilt: 3,
    offset: -25
  },
  {
    title: 'Tools & Technologies I\'ve Used',
    // Section 2 uses tech grid instead of text
  },
  {
    title: 'Social Links',
    text:
      'By merging tech and art, I empower presence and spark creativity — helping others feel, learn, and imagine differently.',
    img: '/assets/photos/Creativity.jpg'
  }
];

export default function About() {
  const navigate = useNavigate();
  const sectionRefs = useRef([]);
  const techGridRef = useRef(null);
  const patternRef = useRef(null);
  const heroTextRef = useRef(null);
  const scrollImgRef = useRef(null);
  const heroSectionRef = useRef(null);


  useEffect(() => {
    const hint = document.querySelector('.tech-grid-hint');
    if (!hint) return;
  
    // 1) split text into spans
    const text = hint.textContent.trim();
    hint.innerHTML = '';  
    text.split('').forEach(char => {
      const span = document.createElement('span');
      span.textContent = char;
      hint.appendChild(span);
    });
  
    // 2) animate with GSAP
    gsap.to('.tech-grid-hint span', {
      y: -15,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.01
    });
  }, []);

  // HERO enter animation
  useEffect(() => {
    const tl = gsap.timeline();

    // 1) fade in the hero container (with its bg-image)
    tl.from(heroSectionRef.current, {
      opacity: 0,
      duration: 6,
      ease: "power3.out",
    });

    // 2) fade‐in & rise for the hero text
    tl.from(heroTextRef.current, {
      opacity: 0,
      y: -30,
      duration: 1,
      ease: "power3.out",
    }, "-=3"); // overlap so it starts 0.8s before step 1 ends

    // 3) fade & rise the arrow
    tl.from(scrollImgRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.8,
      ease: "power3.out",
    }, "-=2");
  }, []);

  // one-time reveal observer
  useEffect(() => {
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // tech grid animation
          if (entry.target.classList.contains('section-2')) {
            gsap.fromTo(
              techGridRef.current.children,
              { y: 30, opacity: 0 },
              { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' }
            );
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -15% 0px' });

    sectionRefs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // three.js background pattern
  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("patternState") || "null");
    const state = saved || { value: 100, xAxis: 0, yAxis: 0, deltaAngle: 1, opacity: 0};
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 400;
    const pattern = new Pattern(scene, camera, true, state.opacity, "about-pattern", 0x00ffff);
    Object.assign(pattern, { ...state, xAngularFreq: 1, opacity: state.opacity });
    pattern.material.opacity = state.opacity;
    patternRef.current = pattern;
    const tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine" } });
    tl.to(state, {
      xAngularFreq: 0.001, opacity: 0, duration: 5, onUpdate: () => {
        pattern.xAngularFreq = state.xAngularFreq;
        pattern.xAxis = state.xAxis;
        pattern.regeneratePatternArea({
          maxVertices: 1,
          xPos: 0,
          yPos: 0,
          xFunctionCode: 5,
          yFunctionCode: 1,
          deltaAngle: state.deltaAngle,
          scale: 1,
          xAngularFreq: pattern.xAngularFreq,
          yAngularFreq: 1,
          xPhase: pattern.xAxis,
          yPhase: pattern.yAxis,
          loopVertex: 1000,
          paramsToAdjust: [],
          adjustAmounts: []
        });
      }
    });
    window.addEventListener('resize', pattern.onWindowResize.bind(pattern));
    return () => {
      pattern.cleanup();
      window.removeEventListener('resize', pattern.onWindowResize.bind(pattern));
    };
  }, []);

  const goBackHome = () => {
    const pattern  = patternRef.current;
    const homeState = { value: 50, deltaAngle: 1.05, opacity: 0, xAxis: 0, yAxis: 0 };

    gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => navigate("/")
    })
    // fade out everything except the pattern canvas
    .to(".about-page > *:not(.about-pattern)", { opacity: 0, duration: 0.6 }, 0)
    // fade + shrink back button
    .to(".back-home", { opacity: 0, scale: 0.8, duration: 0.4 }, 0)
    // background to black
    .to(".about-page", { backgroundColor: "#000", duration: 0.8 }, 0)
    // morph the Pattern to home state
    .to(homeState, {
      xAxis: homeState.xAxis,
      deltaAngle: homeState.deltaAngle,
      duration: 1.5,
      onUpdate: () => {
        Object.assign(pattern, {
          xAxis: homeState.xAxis,
          deltaAngle: homeState.deltaAngle,
          opacity: homeState.opacity
        });
        pattern.material.opacity = homeState.opacity;
        pattern.regeneratePatternArea({
          maxVertices: homeState.value,
          xPos: 0, yPos: 0,
          xFunctionCode: 0, yFunctionCode: 1,
          deltaAngle: homeState.deltaAngle,
          scale: 2,
          xAngularFreq: 1, yAngularFreq: 1,
          xPhase: homeState.xAxis, yPhase: 0,
          loopVertex: 1000, paramsToAdjust: [], adjustAmounts: []
        });
      }
    }, 0.2);
  };

  const scrollDown = () => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });

  return (
    <div className="about-page">
      <section className="hero" ref={heroSectionRef}>
        <div className="hero-text" ref={heroTextRef}>
          <h1>Ahmed Mansour</h1>
          <p>“Always learning by creating.”</p>
        </div>
        <div className="scroll-arrow" onClick={scrollDown} >
          <img src="/assets/icons/chevron-icon-down-white.png" alt="Scroll Down" ref={scrollImgRef} />
        </div>
      </section>

      <section className="callout">
        <p className="callout-text">Merging code, sound, and philosophy to expand reality.</p>
      </section>

      {sections.map((sec, i) => (
        <section
          key={i}
          className={`content-section section-${i + 1}`}
          ref={el => (sectionRefs.current[i] = el)}
        >
          <div className="section-card">
            {i === 0 && (
              <div className="split-layout">
                <div className="text-block">
                  <h2>{sec.title}</h2>
                  <p className="about-section-text">{sec.text}</p>
                </div>
                <div className="image-block">
                  <img src={sec.img} alt={sec.title} />
                </div>
              </div>
            )}

            {i === 1 && (
              <>
                <h2>{sec.title}</h2>
                <p className="tech-grid-hint">Psst - Click on a tool to see how I've used it in a project! :)</p>
                <div className="tech-grid primary" ref={techGridRef}>
                  {primaryTech.map((tech, idx) => (
                    <Link
                               to={tech.url}
                               className="tech-item"
                               key={idx}
                             >
                      <img src={`/assets/icons/${tech.file}`} alt={tech.label} />
                      <span>{tech.label}</span>
                      </Link>
                  ))}
                </div>
                <hr className="divider" />
                <h3 className="subheading">Other Technologies</h3>
                <div className="tech-grid secondary">
                  {otherTech.map((tech, idx) => (
                    <Link
                               to={tech.url}
                               className="tech-item secondary-item"
                               key={idx}
                             >
                      <img src={`/assets/icons/${tech.file}`} alt={tech.label} />
                      <span>{tech.label}</span>
                      </Link>
                  ))}
                </div>
              </>
            )}

            {i === 2 && (
              <>
                <h2>{sec.title}</h2>
                <div className="social-bar">
                  {socialLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-item"
                    >
                      <img src={`/assets/icons/${link.file}`} alt={link.label} />
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      ))}

      <button
        className="back-home"
        onClick={goBackHome}
      ></button>
    </div>
  );
}