// src/Projects/coding/KnightHacks2020.js
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./KnightHacks2020.css";
import gsap from "gsap";

export default function KnightHacks2020() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const navigate = useNavigate();
  const sectionRefs = useRef([]);

  // Page and arrow refs for animations
  const pageRef = useRef();
  const arrowRef = useRef();

  // 1) Fetch project data
  useEffect(() => {
    fetch("/projects.json")
      .then(r => r.json())
      .then(data => {
        const p = data.categories
          .flatMap(c => c.projects)
          .find(p => p.id === id);
        setProject(p);
      })
      .catch(console.error);
  }, [id]);

  // 2) Fade-in the entire page
  useEffect(() => {
    if (!project) return;
    gsap.fromTo(
      pageRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 1 }
    );
  }, [project]);

  // 3) Intersection Observer: add .visible to each section when it scrolls into view
  useEffect(() => {
    if (!project) return;
    const obs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    sectionRefs.current.forEach(sec => {
      if (sec) obs.observe(sec);
    });

    return () => obs.disconnect();
  }, [project]);

  if (!project) return <div className="iso-loading">Loading…</div>;

  const goBack = () => navigate("/projects");

  const techUsed = Array.isArray(project.techUsed)
    ? project.techUsed.map(t => ({
        label: t[0].toUpperCase() + t.slice(1),
        icon: `/assets/icons/${t}.svg`,
        url: `/projects/${t}`,
        // these two come from your JSON (add them there):
        description: t.description || "Description goes here.",
        proficiency: t.proficiency || 75
      }))
    : [];
    
  return (
    <div className="iso-grid-page" ref={pageRef}>
      {/* Hero */}
      <section
        className="iso-hero"
        ref={el => (sectionRefs.current[0] = el)}
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
          <h1>{project.title}</h1>
          <p>{project.headerPhotoCaption || ""}</p>
        </div>
        <a
          className="iso-scroll-arrow"
          onClick={() => sectionRefs.current[1]?.scrollIntoView({ behavior: "smooth" })}
          ref={arrowRef}
        >
          ▼
        </a>
      </section>

{/* Quick Facts */}
<section
  className="iso-section iso-facts"
  ref={el => (sectionRefs.current[1] = el)}
>
  <div className="iso-card">
    <h2 className="iso-card-header">Quick Facts</h2>
    <div className="facts-grid">
      {[
        ["Date Completed", "date-completed.svg", project.dateCompleted],
        ["Tool Used",      "wrench.svg",         project.softwareUsed],
        ["Hardware",       "hmd.svg",            project.hardware],
        ["Team",           "handshake.svg",      project.teamMembers.join(", ")],
        ["Sponsors",       "team.svg",           project.sponsors.join(", ")]
      ].map(([label, icon, value], i) => (
        <div className="iso-fact" key={i}>
          {/* the red triangle corner */}
          <div className="fact-shape" />

          {/* faded background icon, centered */}
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
        ref={el => (sectionRefs.current[3] = el)}
      >
        <div className="iso-card split">
          <div className="text-block">
            <h2 className="iso-card-header">Overview</h2>
            <p>{project.description || "No overview available."}</p>
          </div>
          <div className="img-block">
            <img src={project.headerPhoto} alt={project.title} />
          </div>
        </div>
      </section>

 {/* Technologies */}
      <section
        className="iso-section iso-tech"
        ref={el => (sectionRefs.current[2] = el)}
      >
        <div className="iso-card">
          <h2 className="iso-card-header">Technologies</h2>
          <div className="tech-grid">
            {techUsed.map((t, i) => (
              <Link to={t.url} className="tech-card" key={i}>
                <img src={t.icon} alt={t.label} className="tech-icon" />
                <div className="tech-info">
                  <h3 className="tech-title">{t.label}</h3>
                  <p className="tech-desc">{t.description}</p>
                  <div className="proficiency-bar">
                    <div
                      className="proficiency-fill"
                      style={{ width: `${t.proficiency}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* Learn */}
      <section
        className="iso-section iso-learn"
        ref={el => (sectionRefs.current[4] = el)}
      >
        <div className="iso-card split">
          <div className="learn-list">
            {[
              "Architected a WebSocket pub/sub layer",
              "Added optimistic UI feedback",
              "Monitored & throttled API calls"
            ].map((txt, i) => (
              <div className="learn-item" key={i}>
                <span className="bullet">▶</span>
                <span>{txt}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video */}
      <section
        className="iso-section iso-video"
        ref={el => (sectionRefs.current[5] = el)}
      >
        <div className="iso-card">
          <h2 className="iso-card-header">Demo Video</h2>
          <div className="video-wrapper">
            <iframe
              src="https://www.youtube.com/embed/⟨YOUR_VIDEO_ID⟩"
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
  ref={el => (sectionRefs.current[5] = el)}
>
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


      <button className="iso-back" onClick={goBack}>← Back</button>
    </div>
  );
}
