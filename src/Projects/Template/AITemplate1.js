// src/Projects/coding/KnightHacks2020.js
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./KnightHacks2020.css";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
gsap.registerPlugin(ScrollToPlugin);

export default function KnightHacks2020() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const navigate = useNavigate();
  const sectionRefs = useRef([]);

  const containerRef = useRef();
  const heroOverlayRef = useRef();
  const heroTextRef = useRef();
  const arrowRef = useRef();

  useEffect(() => {
    fetch("/projects.json")
      .then(res => res.json())
      .then(data => {
        const found = data.categories
          .flatMap(c => c.projects)
          .find(p => p.id === id);
        setProject(found);
      });
  }, [id]);

  useEffect(() => {
    if (!project) return;
    gsap.fromTo(
      containerRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 1.2, ease: "power2.out" }
    );
  }, [project]);

  useEffect(() => {
    const mesh = document.querySelector(".mesh-cover-overlay");
    if (mesh) {
      mesh.style.transition = "opacity 0.5s";
      mesh.style.opacity = 0;
      setTimeout(() => mesh.remove(), 500);
    }
  }, []);

  useEffect(() => {
    if (!project) return;
    const tl = gsap.timeline();
    tl.to(heroOverlayRef.current, {
      autoAlpha: 0,
      duration: 2,
      ease: "power2.inOut"
    });
    tl.fromTo(
      heroTextRef.current,
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out" },
      "-=1.4"
    );
    tl.fromTo(
      arrowRef.current,
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out" },
      "-=1.0"
    );
  }, [project]);

  useEffect(() => {
    if (!project) return;
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    sectionRefs.current.forEach(ref => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, [project]);

  if (!project) return <div className="project-loading">Loading vector matrix...</div>;

  const goBack = () => navigate("/projects");

  const techUsed = Array.isArray(project.techUsed)
    ? project.techUsed.map(t => ({
        file: `${t}.svg`,
        label: t[0].toUpperCase() + t.slice(1),
        url: `/projects/${t}`
      }))
    : [];

  return (
    <div className="knight-hacks-vector-page" ref={containerRef}>
      <section
        className="hero-vector"
        style={{ backgroundImage: `url(${project.headerPhoto})` }}
        ref={el => (sectionRefs.current[0] = el)}
      >
        <div className="hero-overlay-neon" ref={heroOverlayRef} />
        <div className="hero-text-glow" ref={heroTextRef}>
          <h1 className="vector-title">{project.title}</h1>
          <p className="vector-subtitle">{project.headerPhotoCaption || ""}</p>
        </div>
        <div
          className="vector-scroll-arrow"
          onClick={() =>
            sectionRefs.current[1]?.scrollIntoView({ behavior: "smooth" })
          }
          ref={arrowRef}
        >
          <img src="/assets/icons/chevron-icon-down-white.png" alt="Scroll Down" />
        </div>
      </section>

      <section
        className="vector-section facts-section"
        ref={el => (sectionRefs.current[1] = el)}
      >
        <div className="vector-card neon-border">
          <h2 className="section-title">Quick Facts</h2>
          <div className="facts-grid">
            {[
              ["Date Completed", "date-completed.svg", project.dateCompleted],
              ["Principle Tool Used", "wrench.svg", project.softwareUsed],
              ["Hardware", "hmd.svg", project.hardware],
              ["Team Members", "handshake.svg", project.teamMembers.join(", ")],
              ["Sponsors", "team.svg", project.sponsors.join(", ")]
            ].map(([label, icon, value], i) => (
              <div className="fact-item neon-glow" key={i}>
                <img className="fact-icon" src={`/assets/icons/${icon}`} alt="" />
                <div className="fact-header">{label}</div>
                <div className="fact-value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="vector-section tech-section"
        ref={el => (sectionRefs.current[2] = el)}
      >
        <div className="vector-card neon-border">
          <h2 className="section-title">Technologies Used</h2>
          <div className="tech-grid">
            {techUsed.map((tech, i) => (
              <Link to={tech.url} className="tech-item-glow" key={i}>
                <img src={`/assets/icons/${tech.file}`} alt={tech.label} />
                <span>{tech.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        className="vector-section overview-section"
        ref={el => (sectionRefs.current[3] = el)}
      >
        <div className="vector-card split-layout neon-border">
          <div className="text-block">
            <h2 className="section-title">Overview</h2>
            <p>{project.description || "No overview available."}</p>
          </div>
          <div className="image-block vector-frame">
            <img src={project.headerPhoto} alt={project.title} />
          </div>
        </div>
      </section>

      <section
        className="vector-section learn-section"
        ref={el => (sectionRefs.current[4] = el)}
      >
        <div className="vector-card split-learn neon-border">
          <div className="learn-quotes">
            <blockquote>“Real-time sync challenges taught me to think in events, not requests.”</blockquote>
            <blockquote>“User feedback loops are as critical as code optimizations.”</blockquote>
          </div>
          <ul className="learn-bullets">
            <li>Architected a WebSocket-based pub/sub layer.</li>
            <li>Improved UX by adding optimistic UI updates.</li>
            <li>Learned to monitor & throttle API calls under load.</li>
          </ul>
        </div>
      </section>

      <section
        className="vector-section demo-video-section"
        ref={el => (sectionRefs.current[5] = el)}
      >
        <div className="vector-card neon-border">
          <h2 className="section-title">Demo Video</h2>
          <div className="video-container">
            <iframe
              src="https://www.youtube.com/embed/⟨YOUR_VIDEO_ID⟩"
              title="Demo Video"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section
        className="vector-section resources-section"
        ref={el => (sectionRefs.current[6] = el)}
      >
        <div className="vector-card neon-border">
          <h2 className="section-title">Resources</h2>
          <p>Links, repos, and documentation go here.</p>
        </div>
      </section>
    </div>
  );
}
