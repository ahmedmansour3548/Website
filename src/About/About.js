/* ========================================================== */
/* src/About/About.css                                        */
/* ========================================================== */
/*
 * © Ahmed Mansour 2025
 */

import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import './About.css';

/* ────────────────────────────────────────────────────────── */
/*  Static data                                               */
/* ────────────────────────────────────────────────────────── */

const primaryTech = [
  { file: 'js.svg',       label: 'JavaScript', url: '/projects/coding/knighthacks2020' },
  { file: 'reactjs.svg',  label: 'React',      url: '/projects/react' },
  { file: 'threejs.svg',  label: 'Three.js',   url: '/projects/threejs' },
  { file: 'unity.svg',    label: 'Unity',      url: '/projects/unity' },
  { file: 'node.svg',     label: 'Node.js',    url: '/projects/nodejs' },
  { file: 'scss.svg',     label: 'SCSS',       url: '/projects/scss' }
];

const otherTech = [
  { file: 'typescript.svg', label: 'TypeScript', url: '/projects/typescript' },
  { file: 'git.svg',        label: 'Git',        url: '/projects/git' },
  { file: 'mysql.svg',      label: 'MySQL',      url: '/projects/mysql' },
  { file: 'angular.svg',    label: 'Angular',    url: '/projects/angular' },
  { file: 'nextjs.svg',     label: 'Next.js',    url: '/projects/nextjs' },
  { file: 'java.svg',       label: 'Java',       url: '/projects/java' }
];

const socialLinks = [
  { file: 'linkedin.svg',  url: 'https://www.linkedin.com/in/yourprofile', label: 'LinkedIn' },
  { file: 'github.svg',    url: 'https://github.com/yourusername',        label: 'GitHub' },
  { file: 'resume.svg',    url: '/assets/resume.pdf',                     label: 'Resume' },
  { file: 'soundcloud.svg',url: '/assets/soundcloud.pdf',                 label: 'Soundcloud' }
];

const sections = [
  {
    title: 'Who am I?',
    text : 'I’m Ahmed Mansour — software engineer, XR creator, musician, philosopher. Forever curious, I blend code, sound, and thought into immersive experiences.',
    img  : '/assets/photos/Me_1.JPG',
    tilt : 3,
    offset: -25
  },
  {
    title: 'Tools & Technologies I\'ve Used'   // tech grid in place of text
  },
  {
    title: 'Social Links',
    text : 'By merging tech and art, I empower presence and spark creativity — helping others feel, learn, and imagine differently.',
    img  : '/assets/photos/Creativity.jpg'
  }
];

/* ────────────────────────────────────────────────────────── */
/*  Component                                                 */
/* ────────────────────────────────────────────────────────── */
export default function About () {
  const navigate         = useNavigate();
  /* ──────────────────────────────── */
  /*  Refs                            */
  /* ──────────────────────────────── */
  const sectionRefs      = useRef([]);
  const techGridRef      = useRef(null);
  const scrollArrowRef   = useRef(null);

  /* ───  Once on mount: animate tech grid hint ────── */
  useEffect(() => {
    const hint = document.querySelector('.about-tech-grid-hint');
    if (!hint) return;

    /* replace text with individually animated <span>s */
    const chars = [...hint.textContent];
    hint.innerHTML = '';
    chars.forEach(c => {
      const span = document.createElement('span');
      span.textContent = c;
      hint.appendChild(span);
    });

    gsap.to('.about-tech-grid-hint span', {
      y: -16,
      duration: 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      stagger: 0.005
    });
  }, []);

  /* ───  Page-entry fade-ins / overlay ─────────────────── */
  useEffect(() => {
    gsap.set('.about-page > *:not(.about-transition-overlay)', { opacity: 0 });

    gsap.to('.about-gradient-overlay', { opacity: 1, duration: 1.5, delay: 0.2, ease: 'power2.inOut' });
    gsap.to('.about-hero',            { opacity: 1, duration: 3.2, delay: 0.2, ease: 'power2.out' });
    gsap.to('.about-callout',         { opacity: 1, duration: 1.0, delay: 0.8, ease: 'power2.out' });
    gsap.to('.about-content-section', { opacity: 1, duration: 1.0, delay: 1.2, stagger: 0.2, ease: 'power2.out' });
    gsap.to('.about-back-home',       { opacity: 1, duration: 0.8, delay: 0.2, ease: 'power2.out' });
  }, []);

  /* ───  Call-out wave animation ────────── */
  useEffect(() => {
    const callout = document.querySelector('.about-callout-text');
    if (!callout) return;

    /* preserve spaces by converting to &nbsp; */
    const original = [...callout.textContent];
    callout.innerHTML = '';
    original.forEach(ch => {
      const span = document.createElement('span');
      span.innerHTML = (ch === ' ') ? '&nbsp;' : ch;
      callout.appendChild(span);
    });

    const spans = gsap.utils.toArray('.about-callout-text span');
    gsap.to(spans, {
      yPercent: -10,
      duration: 3,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      stagger: { each: 0.05, yoyo: true, repeat: -1 }
    });
  }, []);

  /* ───  Parallax drift for section-1 image ────────────── */
  useEffect(() => {
    gsap.to('.about-image-block img', {
      y: -80,
      ease: 'none',
      scrollTrigger: {
        trigger: '.about-section-1',
        start: 'top bottom',
        end:   'bottom top',
        scrub: true
      }
    });
  }, []);

  /* ───  Reveal each section on first entry ────────────── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    sectionRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ─── 6.  Helpers ───────────────────────────────────────── */
  const handleScrollDown = () =>
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });

  const goBackHome = () => {
    /* dark-blue overlay + button slide */
    const overlay = document.createElement('div');
    overlay.classList.add('about-transition-overlay');
    document.body.appendChild(overlay);

    gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: () => navigate('/') })
        .to(overlay,            { opacity: 1, duration: 0.8 }, 0)
        .to('.about-back-home', { x: 15,     duration: 0.15  }, 0)
        .to('.about-back-home', { x: -200,   duration: 0.5   }, 0.15)
        .to('.about-back-home', { opacity: 0,duration: 0.2   }, '<');
  };

  /* ──────────────────────────────────────────────────────── */
  /*  Render JSX                                              */
  /* ──────────────────────────────────────────────────────── */
  return (
    <div className="about-page">
      {/* Back-to-home button */}
      <button className="about-back-home" onClick={goBackHome}>
        <div className="about-back-icon" aria-hidden="true" />
        To Home
      </button>

      {/* Fixed overlay tint */}
      <div className="about-gradient-overlay" />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="about-hero-text">
          <h1>Ahmed Mansour</h1>
          <p>“Always learning by creating.”</p>
        </div>

        <div className="about-scroll-arrow">
          <img
            ref={scrollArrowRef}
            onClick={handleScrollDown}
            src="/assets/icons/chevron-icon-down-white.png"
            alt="Scroll down"
          />
        </div>
      </section>

      {/* ── CALLOUT ───────────────────────────────────────── */}
      <section className="about-callout">
        <p className="about-callout-text">
          Merging code, sound, and philosophy to expand reality.
        </p>
      </section>

      {/* ── MAIN CONTENT SECTIONS ─────────────────────────── */}
      {sections.map((sec, i) => (
        <section
          key={i}
          ref={el => (sectionRefs.current[i] = el)}
          className={`about-content-section about-section-${i + 1}`}
        >
          <div className="about-section-card">

            {/* Section 0 — “Who am I?” */}
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

            {/* Section 1 — Tech grids */}
            {i === 1 && (
              <>
                <h2>{sec.title}</h2>

                <p className="about-tech-grid-hint">
                  Psst - Click on a tool to see how I've used it in a project! :)
                </p>

                <div className="about-tech-grid about-primary">
                  {primaryTech.map(({ file, label, url }) => (
                    <Link key={label} to={url} className="about-tech-item">
                      <img src={`/assets/icons/${file}`} alt={label} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>

                <hr className="about-divider" />
                <h3 className="about-subheading">Other&nbsp;Technologies</h3>

                <div className="about-tech-grid about-secondary">
                  {otherTech.map(({ file, label, url }) => (
                    <Link key={label} to={url} className="about-tech-item about-secondary-item">
                      <img src={`/assets/icons/${file}`} alt={label} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Section 2 — Social links */}
            {i === 2 && (
              <>
                <h2>{sec.title}</h2>
                <div className="about-social-bar">
                  {socialLinks.map(({ file, url, label }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="about-social-item"
                    >
                      <img src={`/assets/icons/${file}`} alt={label} />
                      <span>{label}</span>
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
