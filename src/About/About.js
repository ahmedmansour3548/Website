/* ========================================================== */
/* src/About/About.js                                        */
/* ========================================================== */
/*
 * © Ahmed Mansour 2025
 */

import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './About.css';

gsap.registerPlugin(ScrollTrigger);

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
  const heroBgRef           = useRef(null);
  const heroRef             = useRef(null);
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

    useEffect(() => {
    const bg  = heroBgRef.current;
    const txt = heroRef.current.querySelector('.about-hero-text');
    const arrow = scrollArrowRef.current;


    /* Scroll-away parallax */
    ScrollTrigger.create({
      trigger: heroRef.current,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: self => {
        const prog = self.progress;
        gsap.to([txt, arrow], { yPercent: -prog * 100, opacity: 1 - prog, overwrite: 'auto' });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

/* ───  Call-out wave animation ────────── */
useEffect(() => {
  const callout = document.querySelector('.about-callout-text');
  if (!callout) return;

  // Split the sentence into words
  const words = callout.textContent.trim().split(' ');

  // 2. Rebuild the markup
  callout.innerHTML = '';
  words.forEach((word, idx) => {
    const wordWrapper = document.createElement('span');
    wordWrapper.className = 'callout-word';          // keep the entire word together
    wordWrapper.style.display = 'inline-block';

    [...word].forEach(ch => {
      const charSpan = document.createElement('span');
      charSpan.className = 'callout-char';
      charSpan.style.display = 'inline-block';
      charSpan.textContent = ch;
      wordWrapper.appendChild(charSpan);
    });

    callout.appendChild(wordWrapper);

    // Add a normal breaking space between words
    if (idx < words.length - 1) callout.appendChild(document.createTextNode(' '));
  });

  // Animate every character span
  const chars = callout.querySelectorAll('.callout-char');
  gsap.to(chars, {
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
      y: -40,
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

/* ── Floating tech icons ───────────────────────────────── */
useEffect(() => {
  gsap.utils.toArray('.about-tech-item').forEach(item => {
    // each icon gets its own randomised looping tween
    gsap.to(item, {
      y: () => gsap.utils.random(-8, 8),
      rotation: () => gsap.utils.random(-1, 1),
      duration: () => gsap.utils.random(2.5, 4),
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });
  });
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
      {/* Back-home btn */}
      <button className="about-back-home" onClick={goBackHome}>
        <div className="about-back-icon" aria-hidden="true" />
        To Home
      </button>

      {/* overlay tint */}
      <div className="about-gradient-overlay" />

      {/* ── HERO ───────────────── */}
      <section className="about-hero" ref={heroRef}>
        <div
          ref={heroBgRef}
          className="about-hero-bg"
          style={{ backgroundImage: "url('/assets/photos/Me_Hero.jpg')" }}
        />
        <div className="about-hero-text">
          <h1 className="about-hero-text-header">Ahmed Mansour</h1>
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

      {/* ── CALLOUT ────────────── */}
      <section className="about-callout">
        <p className="about-callout-text">
          Building the future of immersive experiences.
        </p>
      </section>

      {/* ── SECTION 1 — Who am I? ───────────────────────── */}
      <section
        ref={el => (sectionRefs.current[0] = el)}
        className="about-content-section about-section-1"
      >
        <div className="about-section-card">
          <div className="about-split-layout">
            <div className="about-text-block">
              <h2 className="about-text-block-header">Who am I?</h2>
              <p className="about-section-text">
                I’m a 26-year-old <strong>developer</strong> with a love for
                <strong> immersive experiences</strong>. My focus is shaping the
                next era of <strong>spatial computing</strong> by crafting
                <strong> XR systems</strong> that feel
                <strong> seamless, responsive,</strong> and <strong>real</strong>.
              </p>
            </div>
            <div className="about-image-block">
              <img src="/assets/photos/Me_1.JPG" alt="Portrait of Ahmed" />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — Tech grid ───────────────────────── */}
      <section
        ref={el => (sectionRefs.current[1] = el)}
        className="about-content-section about-section-2"
      >
        <div className="about-section-card">
          <h2 className="about-tech-grid-header">Core Technologies & Tools</h2>

          <p className="about-tech-grid-hint">
            Psst – click a tool to see how I’ve used it :)
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
          <h3 className="about-subheading">Other Technologies</h3>

          <div className="about-tech-grid about-secondary">
            {otherTech.map(({ file, label, url }) => (
              <Link key={label} to={url} className="about-tech-item about-secondary-item">
                <img src={`/assets/icons/${file}`} alt={label} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — Social links ────────────────────── */}
      <section
        ref={el => (sectionRefs.current[2] = el)}
        className="about-content-section about-section-3"
      >
        <div className="about-section-card">
          <h2 className="about-social-bar-header">Social Links</h2>
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
        </div>
      </section>
    </div>
  );
}
