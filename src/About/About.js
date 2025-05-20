// src/About/About.js
import React, { useEffect, useRef, useContext } from 'react';
import './About.css';
import * as THREE from 'three';
import { PatternContext } from '../index';
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
  { file: 'resume.svg', url: '/assets/resume.pdf', label: 'Resume' },
  { file: 'soundcloud.svg', url: '/assets/soundcloud.pdf', label: 'Soundcloud' }
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
  const heroTextRef = useRef(null);
  const scrollImgRef = useRef(null);
  const heroSectionRef = useRef(null);

  const patternRef = useContext(PatternContext);
  const pattern = patternRef ? patternRef.current : null;

  useEffect(() => {
    const hint = document.querySelector('.about-tech-grid-hint');
    if (!hint) return;
    const text = hint.textContent.trim();
    hint.innerHTML = '';  
    text.split('').forEach(char => {
      const span = document.createElement('span');
      span.textContent = char;
      hint.appendChild(span);
    });
    gsap.to('.about-tech-grid-hint span', {
      y: -16,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.005
    });
  }, []);

  useEffect(() => {

        gsap.to('.about-gradient-overlay', {
      opacity: 1,
      duration: 1.5,
      ease: 'power2.inOut',
      delay: 0.2
    });
    
    // start everything invisible
    gsap.set('.about-page > *:not(.about-transition-overlay)', { opacity: 0 });
    // then fade in hero, callout, sections in sequence
    gsap.to('.about-hero', {
      opacity: 1,
      duration: 3.2,
      delay: 0.2,
      ease: 'power2.out'
    });
    gsap.to('.about-callout', {
      opacity: 1,
      duration: 1.0,
      delay: 0.8,
      ease: 'power2.out'
    });
    gsap.to('.about-content-section', {
      opacity: 1,
      duration: 1.0,
      delay: 1.2,
      stagger: 0.2,
      ease: 'power2.out'
    });
    // also fade in the back button
    gsap.to('.about-back-home', {
      opacity: 1,
      duration: 0.8,
      delay: 0.2,
      ease: 'power2.out'
    });
  }, []);

useEffect(() => {
  const callout = document.querySelector(".about-callout-text");
  if (!callout) return;

  /* 1️⃣  split while preserving spaces */
  const raw = callout.textContent;          // no .trim() !
  callout.innerHTML = "";
  Array.from(raw).forEach((ch) => {
    const span = document.createElement("span");
    if (ch === " ") {
      /* keep word spacing */
      span.innerHTML = "&nbsp;";
      span.classList.add("space");
    } else {
      span.textContent = ch;
    }
    callout.appendChild(span);
  });

  const spans = gsap.utils.toArray(".about-callout-text span");

  /* 2️⃣  travelling wave:
         each char rises & falls but their clocks are offset,
         giving the illusion of a wave moving left→right   */
  gsap.to(spans, {
    yPercent: -10,
    duration: 3,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    stagger: {
      each: 0.05,      // offset between letters
      repeat: -1,
      yoyo: true
    }
  });
}, []);

  useEffect(() => {
    if (!patternRef || !patternRef.current) return;
    const pattern = patternRef.current;
    const saved = JSON.parse(sessionStorage.getItem('patternState') || 'null');
    const state = saved || { value: 100, xAxis: 0, yAxis: 0, deltaAngle: 1, opacity: 0 };
    Object.assign(pattern, state);
    pattern.material.opacity = state.opacity;
    pattern.regenerate({
      maxVertices: state.value,
      xPos: 0, yPos: 0, zPos: 0,
      xFunctionCode: 0, yFunctionCode: 1,
      deltaAngle: state.deltaAngle,
      scale: 1,
      xAngularFreq: 1, yAngularFreq: 1,
      xPhase: state.xAxis, yPhase: state.yAxis,
      loopVertex: 1000, paramsToAdjust: [], adjustAmounts: []
    });

    const tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine' } });
    tl.to(pattern, { xAngularFreq: 0.001, opacity: 0, duration: 5, onUpdate: () => {
      pattern.material.opacity = pattern.opacity;
      pattern.regenerate({
        maxVertices: state.value,
        xPos: 0, yPos: 0, zPos: 0,
        xFunctionCode: 0, yFunctionCode: 1,
        deltaAngle: pattern.deltaAngle,
        scale: 1,
        xAngularFreq: pattern.xAngularFreq,
        yAngularFreq: 1,
        xPhase: pattern.xAxis, yPhase: pattern.yAxis,
        loopVertex: 1000, paramsToAdjust: [], adjustAmounts: []
      });
    }});

    return () => tl.kill();
  }, [patternRef]);

   useEffect(() => {

    /* SECTION 1 IMAGE: slow upward drift for a depth feel */
    gsap.to(".about-image-block img", {
      y: -80,
      ease: "none",
      scrollTrigger: {
        trigger: ".about-section-1",
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  }, []);


const goBackHome = () => {
  const overlay = document.createElement('div');
  overlay.classList.add('about-transition-overlay');
  document.body.appendChild(overlay);

  const pat = patternRef?.current;
  const homeState = { value: 50, deltaAngle: 1.05, opacity: 0, xAxis: 0, yAxis: 0 };

  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    onComplete: () => navigate('/')
  });

  tl.to(overlay, { opacity: 1, duration: 0.8 }, 0)
    .to('.about-page > *:not(.pattern-background)', { opacity: 0, duration: 0.6 }, 0)
    .to(homeState, {
      duration: 1,
      onUpdate: () => {
        if (!pat) return;
        Object.assign(pat, homeState);
        pat.material.opacity = homeState.opacity;
        pat.regenerate({
          maxVertices: homeState.value,
          xPos: 0, yPos: 0, zPos: 0,
          xFunctionCode: 0, yFunctionCode: 1,
          deltaAngle: pat.deltaAngle,
          scale: 2,
          xAngularFreq: 1, yAngularFreq: 1,
          xPhase: pat.xAxis, yPhase: 0,
          loopVertex: 1000, paramsToAdjust: [], adjustAmounts: []
        });
      }
    }, 0.2)
    // spring right a bit, then shoot left off screen
      .to(".about-back-home", { x: 15, duration: 0.15, ease: "power2.out" }, 0)
      .to(".about-back-home", { x: -200, duration: 0.5, ease: "power2.out" }, 0.15)
      .to(".about-back-home", { opacity: 0, duration: 0.2, ease: "linear" }, '<')  // Fade out the back-home button at the same time;
};


  useEffect(() => {
    const obs = new IntersectionObserver((entries, obsr) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obsr.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });

    sectionRefs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);


  const scrollDown = () => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });

  return (
    <div className="about-page">
      <button className="about-back-home" onClick={goBackHome}>
        <div className="about-back-icon" aria-hidden="true" alt="Back home"/>
        To Home
      </button>
      
      <div className="about-gradient-overlay" />
      <section className="about-hero" ref={heroSectionRef}>
        <div className="about-hero-text" ref={heroTextRef}>
          <h1>Ahmed Mansour</h1>
          <p>“Always learning by creating.”</p>
        </div>
        <div className="about-scroll-arrow">
          <img
            src="/assets/icons/chevron-icon-down-white.png"
            alt="Scroll Down"
            ref={scrollImgRef}
            onClick={scrollDown}
          />
        </div>
      </section>

      <section className="about-callout">
        <p className="about-callout-text">
          Merging code, sound, and philosophy to expand reality.
        </p>
      </section>

      {sections.map((sec, i) => (
        <section
          key={i}
          className={`about-content-section about-section-${i + 1}`}
          ref={el => (sectionRefs.current[i] = el)}
        >
          <div className="about-section-card">
            {i === 0 && (
              <div className="about-split-layout">
                <div className="about-text-block">
                  <h2>{sec.title}</h2>
                  <p className="about-section-text">{sec.text}</p>
                </div>
                <div className="about-image-block">
                  <img src={sec.img} alt={sec.title} />
                </div>
              </div>
            )}

            {i === 1 && (
              <>
                <h2>{sec.title}</h2>
                <p className="about-tech-grid-hint">
                  Psst - Click on a tool to see how I've used it in a project! :)
                </p>
                <div className="about-tech-grid about-primary" ref={techGridRef}>
                  {primaryTech.map((tech, idx) => (
                    <Link to={tech.url} className="about-tech-item" key={idx}>
                      <img src={`/assets/icons/${tech.file}`} alt={tech.label} />
                      <span>{tech.label}</span>
                    </Link>
                  ))}
                </div>
                <hr className="about-divider" />
                <h3 className="about-subheading">Other Technologies</h3>
                <div className="about-tech-grid about-secondary">
                  {otherTech.map((tech, idx) => (
                    <Link
                      to={tech.url}
                      className="about-tech-item about-secondary-item"
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
                <div className="about-social-bar">
                  {socialLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="about-social-item"
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
    </div>  
  );
}
