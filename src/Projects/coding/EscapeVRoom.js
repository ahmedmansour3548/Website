// src/Projects/coding/EscapeVRoom.js
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./EscapeVRoom.css";
import gsap from "gsap";
import Marquee from "react-fast-marquee";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

const EscapeVRoom = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const navigate = useNavigate();
  const sectionRefs = useRef([]);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  // refs
  const pageRef = useRef();
  const arrowRef = useRef();

  // fetch data
  useEffect(() => {
    fetch("/projects.json")
      .then((r) => r.json())
      .then((data) => {
        const p = data.categories
          .flatMap((c) => c.projects)
          .find((p) => p.id === id);
        setProject(p);
      })
      .catch(console.error);
  }, [id]);

  // fade in page
  useEffect(() => {
    if (!project) return;
    gsap.fromTo(
      pageRef.current,
      { autoAlpha: 0.5 },
      { autoAlpha: 1, duration: 1 }
    );
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

   if (!project) return <div className="iso-loading">Loading…</div>;

  return (
    <div className="iso-grid-page" ref={pageRef}>
      {/* Hero */}
      <section
        className="iso-hero"
        ref={(el) => (sectionRefs.current[0] = el)}
      >
        <div
          className="iso-hero-bg"
          style={{ backgroundImage: `url(${project.headerPhoto})` }}
        />
        <div className="iso-hero-shapes">
          <div className="decor-tri tri-1" />
          <div className="decor-tri tri-2" />
        </div>
        <div className="iso-hero-text">
          <h1>
            {project.title.split("").map((char, i) => (
              <span key={i} className="char">
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </h1>
          <p>{project.headerPhotoCaption || ""}</p>
        </div>
        <a
          className="iso-scroll-arrow"
          onClick={() =>
            sectionRefs.current[1]?.scrollIntoView({ behavior: "smooth" })
          }
          ref={arrowRef}
        >
          ▼
        </a>
      </section>

      {/* Quick Facts */}
      <section
        className="iso-section iso-facts"
        ref={(el) => (sectionRefs.current[1] = el)}
      >
        <div className="iso-card">
          <h2 className="iso-card-header">Quick Facts</h2>
          <div className="facts-grid">
            {[
              ["Date Completed", "date-completed.svg", project.dateCompleted],
              ["Software", "wrench.svg", project.softwareUsed],
              ["Hardware", "hmd.svg", project.hardware],
              ["Team", "handshake.svg", project.teamMembers.join(", ")],
              [
                "Sponsors",
                "team.svg",
                formatText(project.sponsors.join(", ")),
              ],
            ].map(([label, icon, value], i) => (
              <div className="iso-fact" key={i}>
                <div className="fact-shape" />
                <img
                  className="fact-icon"
                  src={`/assets/icons/${icon}`}
                  alt=""
                  aria-hidden="true"
                />
                <div className="fact-content">
                  <span className="fact-label">{label}</span>
                  <span className="fact-value">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Overview */}
      <section
        className="iso-section iso-overview"
        ref={(el) => (sectionRefs.current[3] = el)}
      >
        <div className="iso-card split">
          <div className="text-block">
            <h2 className="iso-card-header">Overview</h2>
            <p>
              {project.description
                ? formatText(project.description)
                : "No overview available."}
            </p>
          </div>
           <div className="img-block">
   <img
     src={project.photos && project.photos.length > 0
       ? project.photos[0].url
       : project.headerPhoto}
     alt={project.title}
   />
 </div>
        </div>
      </section>

      {/* Technologies */}
      <section
        className="iso-section iso-tech"
        ref={(el) => (sectionRefs.current[2] = el)}
      >
        <div className="iso-card">
          <h2 className="iso-card-header">Technologies</h2>
          <div className="tech-grid-simple">
            {techUsed.map((t, i) => (
              <Link to={t.url} className="tech-card-simple" key={i}>
                <img
                  src={t.icon}
                  alt={t.label}
                  className="tech-icon-simple"
                />
                <h3 className="tech-title-simple">{t.label}</h3>
                <ul className="tech-bullets">
                  {t.bullets.map((pt, j) => (
                    <li key={j}>{pt}</li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery with Marquee */}
      <section
        className="iso-section iso-gallery"
        ref={(el) => (sectionRefs.current[6] = el)}
      >
        <div className="iso-card">
          <h2 className="iso-card-header">Gallery</h2>
          <div className="gallery-marquee">
            <Marquee
              gradient={false}
              speed={30}
              loop={0}
              autoFill={true}
              pauseOnHover={false}
              pauseOnClick={false}
            >
              {slides.map((slide, idx) => (
                <div
                  key={idx}
                  className="gallery-item"
                  onClick={() => setLightboxIndex(idx)}
                >
                  <img src={slide.src} alt={`Screenshot ${idx + 1}`} />
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        index={lightboxIndex}
        plugins={[Thumbnails]}
        thumbnails={{
          position: "bottom",
          height: 80,
          spacing: 8
        }}
      />

      {/* Video */}
      <section
        className="iso-section iso-video"
        ref={(el) => (sectionRefs.current[4] = el)}
      >
        <div className="iso-card">
          <h2 className="iso-card-header">Demo Video</h2>
          <div className="video-wrapper">
            <iframe
              src="https://www.youtube.com/embed/m6_RoNpmwjk"
              title="Demo"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Resources */}
      <section
        className="iso-section iso-resources"
        ref={(el) => (sectionRefs.current[5] = el)}
      >
        <div className="iso-card">
          <h2 className="iso-card-header">Resources</h2>
          <div className="res-grid">
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                className="res-item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/assets/icons/github.svg" alt="GitHub" />
                <span>GitHub</span>
              </a>
            )}
            {project.downloadUrl && (
              <a
                href={project.downloadUrl}
                className="res-item"
                download
              >
                <img src="/assets/icons/zip.svg" alt="Download ZIP" />
                <span>Download</span>
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                className="res-item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/assets/icons/external.svg" alt="Live Demo" />
                <span>Live Demo</span>
              </a>
            )}
          </div>
        </div>
      </section>

      <button
        className="iso-back"
        onClick={goBack}
        aria-label="Go back to projects"
      >
         <img
          className="iso-back-icon"
          src={`/assets/icons/arrow-left-white.svg`}
          alt=""
          aria-hidden="true"
        />
        To Projects
       
      </button>
    </div>
  );
}

export default EscapeVRoom;