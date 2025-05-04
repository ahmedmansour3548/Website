// src/Projects/KnightHacks2020.js
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./KnightHacks2020.css";

export default function KnightHacks2020() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const navigate = useNavigate();
  const sectionRefs = useRef([]);

  // 1) fetch data
  useEffect(() => {
    fetch("/projects.json")
      .then(r => r.json())
      .then(data => {
        const found = data.categories
          .flatMap(c => c.projects)
          .find(p => p.id === id);
        setProject(found);
      })
      .catch(console.error);
  }, [id]);

  // 2) remove any leftover cover overlay
  useEffect(() => {
    const ov = document.querySelector(".mesh-cover-overlay");
    if (ov) {
      ov.style.transition = "opacity 0.5s";
      ov.style.opacity = 0;
      setTimeout(() => ov.remove(), 500);
    }
  }, []);

  // 3) Intersection Observer to add .visible
  useEffect(() => {
    if (!project) return;
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
  }, [project]);

  if (!project) return <div className="project-loading">Loading…</div>;

  const goBack = () => navigate("/projects");

  // map techUsed -> svg filenames
  const techUsed = Array.isArray(project.techUsed)
    ? project.techUsed.map(t => ({
        file: `${t}.svg`,
        label: t[0].toUpperCase() + t.slice(1),
        url: `/projects/${t}`
      }))
    : [];

  return (
    <div className="knight-page about-page">
      

      {/* Hero */}
      <section
        className="hero"
        style={{ background: `url(${project.headerPhoto}) center/cover no-repeat` }}
        ref={el => (sectionRefs.current[0] = el)}
      >
        <div className="hero-text">
          <h1>{project.title}</h1>
          <p>{project.headerPhotoCaption || ""}</p>
        </div>
        <div
          className="scroll-arrow"
          onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
        >
          <img src="/assets/icons/chevron-icon-down-white.png" alt="Scroll Down" />
        </div>
      </section>

      {/* Quick Facts */}
      <section
        className="content-section section-3"
        ref={el => (sectionRefs.current[1] = el)}
      >
        <div className="section-card quick-facts">
          <h2>Quick Facts</h2>
          <div className="facts-grid">
            <div className="fact">📅 {project.dateCompleted}</div>
            <div className="fact">🖥️ {project.softwareUsed}</div>
            <div className="fact">🔧 {project.hardware}</div>
            <div className="fact">👥 {project.teamMembers.join(", ")}</div>
            <div className="fact">🤝 {project.sponsors.join(", ")}</div>
          </div>
        </div>
      </section>

      {/* Technologies Used */}
      <section
        className="content-section section-2"
        ref={el => (sectionRefs.current[2] = el)}
      >
        <div className="section-card">
          <h2>Technologies Used in This Project</h2>
          <div className="tech-grid primary">
            {techUsed.map((tech, i) => (
              <Link to={tech.url} className="tech-item" key={i}>
                <img src={`/assets/icons/${tech.file}`} alt={tech.label} />
                <span>{tech.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Overview */}
      <section
        className="content-section section-1"
        ref={el => (sectionRefs.current[3] = el)}
      >
        <div className="section-card split-layout">
          <div className="text-block">
            <h2>Overview</h2>
            <p>{project.description || "No overview available."}</p>
          </div>
          <div className="image-block">
            <img src={project.headerPhoto} alt={project.title} />
          </div>
        </div>
      </section>

      {/* Section 5A: What I Learned */}
      <section
        className="content-section section-5a"
        ref={el => (sectionRefs.current[4] = el)}
      >
        <div className="section-card split-learn">
          <div className="learn-quotes">
            <blockquote>
              “Real-time sync challenges taught me to think in events, not requests.”
            </blockquote>
            <blockquote>
              “User feedback loops are as critical as code optimizations.”
            </blockquote>
          </div>
          <ul className="learn-bullets">
            <li>Architected a WebSocket-based pub/sub layer.</li>
            <li>Improved UX by adding optimistic UI updates.</li>
            <li>Learned to monitor & throttle API calls under load.</li>
          </ul>
        </div>
      </section>

      {/* Demo Video */}
      <section
        className="content-section section-4"
        ref={el => (sectionRefs.current[5] = el)}
      >
        <div className="section-card">
          <h2>Demo Video</h2>
          <div className="video-container">
            <iframe
              src="https://www.youtube.com/embed/⟨YOUR_VIDEO_ID⟩"
              title="Demo Video"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

{/* Resources */}
<section
  className="content-section section-resources"
  ref={el => (sectionRefs.current[6] = el)}   // adjust index if needed
>
  <div className="section-card">
    <h2>Resources</h2>
    <div className="resources-grid">
      {project.repoUrl && (
        <a
          href={project.repoUrl}
          className="resource-item"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/assets/icons/github.svg" alt="GitHub Repo" />
          <span>GitHub</span>
        </a>
      )}
      {project.downloadUrl && (
        <a
          href={project.downloadUrl}
          className="resource-item"
          download
        >
          <img src="/assets/icons/download.svg" alt="Download ZIP" />
          <span>Download ZIP</span>
        </a>
      )}
      {project.liveUrl && (
        <a
          href={project.liveUrl}
          className="resource-item"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/assets/icons/external-link.svg" alt="Play Live" />
          <span>Play Live</span>
        </a>
      )}
      {/* add more as needed */}
    </div>
  </div>
</section>
  <button className="back-home" onClick={goBack}></button>
    </div>
  );
}
