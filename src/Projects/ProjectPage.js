// src/Projects/coding/EscapeVRoom.js
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./ProjectPage.css";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import Marquee from "react-fast-marquee";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import CategoryMenu from "../utils/CategoryMenu";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";


gsap.registerPlugin(Flip);

const COLOR_MAP = {
  vrar: 0xf94144,
  art: 0xf3722c,
  programming: 0x577590,
  toys: 0x43aa8b,
  archive: 0x90be6d,
  xplor: 0xf9c74f,
};

// Utility function to lighten/darken colors
function adjustColor(color, amount) {
  let r = (color >> 16) + amount;
  let g = ((color >> 8) & 0x00FF) + amount;
  let b = (color & 0x0000FF) + amount;
  
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  
  return (r << 16) | (g << 8) | b;
}

const tweenPalette = (vars) => {
  const root = document.documentElement;
  gsap.to(root, {
    duration: 0.8,
    ease: "power2.inOut",
    ...Object.entries(vars).reduce(
      (acc, [k, v]) => ({ ...acc, [`--${k}`]: v }),
      {}
    ),
  });
};

const ProjectPage = () => {
  const { category, id } = useParams();
  const [project, setProject]         = useState(null); // currently displayed
const [queuedProject, setQueued]    = useState(null); // awaiting display

  const navigate = useNavigate();
  const sectionRefs = useRef([]);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [categories, setCategories] = useState([]);
  

  // refs
  const pageRef = useRef();
  const arrowRef = useRef();
  const firstLoad = useRef(true);

// ─────────── Fetch project + category once ───────────
useEffect(() => {
  fetch("/projects.json")
    .then((r) => r.json())
    .then((data) => {
      setCategories(data.categories);

      for (const cat of data.categories) {
        const match = cat.projects.find((p) => p.id === id);
        if (match) {
          setQueued({ ...match, category });
          break;
        }
      }
    })
    .catch(console.error);
}, [id]);


// ─────────── Push theme colours to CSS custom-props ───────────
useEffect(() => {
  if (!project || !firstLoad.current) return;

  const base   = COLOR_MAP[project.category] ?? COLOR_MAP.placeholder;
  const toHex  = n => `#${n.toString(16).padStart(6, "0")}`;

  const vars = {
    "--project-color":      toHex(base),
    "--project-dark":       toHex(adjustColor(base, -60)),
    "--project-light":      toHex(adjustColor(base,  60)),
    "--project-background": toHex(adjustColor(base,-100)),
    "--project-card":       toHex(adjustColor(base, -30)),
  };

  Object.entries(vars).forEach(([k,v]) =>
    document.documentElement.style.setProperty(k, v)
  );
}, [project]);


useEffect(() => {
  if (!queuedProject) return;

  /* ─── 1  palette tween (only after first load) ─── */
  if (!firstLoad.current) {
    const base  = COLOR_MAP[queuedProject.category] ?? COLOR_MAP.placeholder;
    const toHex = (n) => `#${n.toString(16).padStart(6, "0")}`;

    tweenPalette({
      "project-color":      toHex(base),
      "project-dark":       toHex(adjustColor(base, -60)),
      "project-light":      toHex(adjustColor(base,  60)),
      "project-background": toHex(adjustColor(base,-100)),
      "project-card":       toHex(adjustColor(base, -30)),
    });
  }

  /* ─── 2  capture & swap ─── */
  const state = Flip.getState(".iso-section, .iso-hero");
  setProject(queuedProject);

  /* ─── 3  immediately mark new sections as visible (skip scroll-reveal) ─── */
  requestAnimationFrame(() => {
    document
      .querySelectorAll(".iso-section")
      .forEach((s) => s.classList.add("visible"));

    /* ─── 4  animate layout only (no opacity flash) ─── */
    Flip.from(state, {
      duration: 0.8,
      ease: "power2.inOut",
      stagger: 0.05,
    });
  });
}, [queuedProject]);

/* ---------- page fade only once ---------- */
useEffect(() => {
  if (!project || !firstLoad.current) return;

  gsap.set(".cat-menu", { autoAlpha: 0 });

  gsap.timeline()
      .fromTo(pageRef.current, { autoAlpha:0.5 }, { autoAlpha:1, duration:1 })
      .to(".cat-menu",        { autoAlpha:1, duration:1, ease:"power2.out" }, "-=0.3");

  firstLoad.current = false;      // subsequent navigations skip this
}, [project]);


  // animate hero letters
  useEffect(() => {
    if (!project) return;
    const h1 = pageRef.current.querySelector(".iso-hero-text h1");
    const spans = Array.from(h1.querySelectorAll(".char"));
    const gradient = getComputedStyle(h1).backgroundImage;
    const totalW = h1.scrollWidth;

    // apply gradient once per letter, offset correctly
    spans.forEach((span) => {
      span.style.backgroundImage = gradient;
      span.style.backgroundSize = `${totalW}px 100%`;
      span.style.backgroundPosition = `-${span.offsetLeft}px 0`;
      span.style.webkitBackgroundClip = "text";
      span.style.backgroundClip = "text";
      span.style.color = "transparent";
    });

    // now animate
    gsap.set(spans, { autoAlpha: 0, y: 20 });
    gsap.to(spans, {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.05,
      delay: 0.5,
    });
  }, [project]);

  // intersection observer for sections
  useEffect(() => {
    if (!project) return;
    const obs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    sectionRefs.current.forEach((sec) => sec && obs.observe(sec));
    return () => obs.disconnect();
  }, [project]);
  



  // ─────────── Entrance fade once project exists ───────────
  useEffect(() => {
    if (!project) return;
    gsap.fromTo(pageRef.current, { autoAlpha: 0.4 }, { autoAlpha: 1, duration: 1 });
  }, [project]);

  if (!project) return <div className="iso-loading">Loading…</div>;

  const goBack = () => navigate("/projects");

  const photos = project.photos || [];
  const slides = photos.map((p) => ({ src: p.url }));

  const techUsed = Array.isArray(project.techUsed)
    ? project.techUsed.map((t) => ({
      label: t.label,
      icon: `/assets/icons/${t.icon}`,
      url: t.url,
      bullets: Array.isArray(t.bullets) ? t.bullets : [],
    }))
    : [];

  function formatText(str) {
    return str
      .replace(/\t/g, "\u00A0\u00A0\u00A0\u00A0")
      .split("\n")
      .map((line, i) => (
        <React.Fragment key={i}>
          {line}
          <br />
        </React.Fragment>
      ));
  }

return (
  <>
    <CategoryMenu categories={categories} />

    <div className="iso-grid-page" ref={pageRef}>
      {/* ────────── HERO ────────── */}
      <section className="iso-hero">
        <div className="iso-hero-bg" style={{ backgroundImage:`url(${project.headerPhoto})` }} />
        <div className="iso-hero-shapes">
          <div className="decor-tri tri-1" />
          <div className="decor-tri tri-2" />
        </div>

        <div className="iso-hero-text">
          <h1>
            {project.title.split("").map((c,i)=>(
              <span key={i} className="char">
                {c === " " ? "\u00A0" : c}
              </span>
            ))}
          </h1>
          <p>{project.headerPhotoCaption || ""}</p>
        </div>

        <a
          className="iso-scroll-arrow"
          onClick={() => document.querySelector(".iso-section")?.scrollIntoView({ behavior:"smooth" })}
        >
          ▼
        </a>
      </section>

      {/* ────────── QUICK FACTS ────────── */}
      {Array.isArray(project.quickFacts) && project.quickFacts.length > 0 && (
        <section className="iso-section">
          <div className="iso-card">
            <h2 className="iso-card-header">Quick Facts</h2>

            <div className="facts-grid">
              {project.quickFacts.map((q,i)=>(
                <div className="iso-fact" key={i}>
                  <div className="fact-shape" />
                  <img className="fact-icon" src={`/assets/icons/${q.icon}`} alt="" aria-hidden="true" />
                  <div className="fact-content">
                    <span className="fact-label">{q.label}</span>
                    <span className="fact-value">{formatText(String(q.value))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ────────── OVERVIEW ────────── */}
      {project.description && (
        <section className="iso-section iso-overview">
          <div className="iso-card split">
            <div className="text-block">
              <h2 className="iso-card-header">Overview</h2>
              <p>{formatText(project.description)}</p>
            </div>

            <div className="img-block">
              <img
                src={project.photos?.[0]?.url || project.headerPhoto}
                alt={project.title}
              />
            </div>
          </div>
        </section>
      )}

      {/* ────────── TECHNOLOGIES ────────── */}
      {Array.isArray(project.techUsed) && project.techUsed.length > 0 && (
        <section className="iso-section iso-tech">
          <div className="iso-card">
            <h2 className="iso-card-header">Technologies</h2>

            <div className="tech-grid-simple">
              {project.techUsed.map((t,i)=>(
                <Link to={t.url} className="tech-card-simple" key={i}>
                  <img src={`/assets/icons/${t.icon}`} alt={t.label} className="tech-icon-simple" />
                  <h3 className="tech-title-simple">{t.label}</h3>
                  <ul className="tech-bullets">
                    {(t.bullets||[]).map((b,j)=><li key={j}>{b}</li>)}
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ────────── GALLERY ────────── */}
      {project.photos?.length > 1 && (
        <section className="iso-section iso-gallery">
          <div className="iso-card">
            <h2 className="iso-card-header">Gallery</h2>

            <div className="gallery-marquee">
              <Marquee gradient={false} speed={30} loop={0} autoFill>
                {project.photos.slice(1).map((ph,i)=>(
                  <div key={i} className="gallery-item" onClick={()=>setLightboxIndex(i)}>
                    <img src={ph.url} alt={`Screenshot ${i+1}`} />
                  </div>
                ))}
              </Marquee>
            </div>
          </div>
        </section>
      )}

      {/* ────────── LIGHTBOX (always present if photos) ────────── */}
      {project.photos?.length > 1 && (
        <Lightbox
          open={lightboxIndex >= 0}
          close={() => setLightboxIndex(-1)}
          slides={project.photos.slice(1).map(ph=>({ src: ph.url }))}
          index={lightboxIndex}
          plugins={[Thumbnails]}
          thumbnails={{ position:"bottom", height:80, spacing:8 }}
        />
      )}

      {/* ────────── VIDEO ────────── */}
      {project.videoUrl && (
        <section className="iso-section iso-video">
          <div className="iso-card">
            <h2 className="iso-card-header">Demo Video</h2>
            <div className="video-wrapper">
              <iframe
                src={project.videoUrl}
                title="Demo Video"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* ────────── RESOURCES ────────── */}
      {(project.resources) && (
        <section className="iso-section iso-resources">
          <div className="iso-card">
            <h2 className="iso-card-header">Resources</h2>

            <div className="res-grid">
              {project.repoUrl && (
                <a href={project.repoUrl} className="res-item" target="_blank" rel="noopener noreferrer">
                  <img src="/assets/icons/github.svg" alt="GitHub" />
                  <span>GitHub</span>
                </a>
              )}
              {project.downloadUrl && (
                <a href={project.downloadUrl} className="res-item" download>
                  <img src="/assets/icons/zip.svg" alt="Download ZIP" />
                  <span>Download</span>
                </a>
              )}
              {project.liveUrl && (
                <a href={project.liveUrl} className="res-item" target="_blank" rel="noopener noreferrer">
                  <img src="/assets/icons/external.svg" alt="Live Demo" />
                  <span>Live Demo</span>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ────────── BACK HOME BUTTON ────────── */}
      <button className="iso-back" onClick={()=>navigate("/projects")} aria-label="Go back to projects">
        To Projects
      </button>
    </div>
  </>
);

}

export default ProjectPage;