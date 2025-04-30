import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./KnightHacks2020.css";

gsap.registerPlugin(ScrollTrigger);

const KnightHacks2020 = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const navigate = useNavigate();
  const contentRef = useRef(null);

  useEffect(() => {
    fetch("/projects.json")
      .then((response) => response.json())
      .then((data) => {
        const projectData = data.categories
          .flatMap((category) => category.projects)
          .find((proj) => proj.id === id);
        setProject(projectData);
      })
      .catch((error) => console.error("Error fetching project data:", error));
  }, [id]);

  useEffect(() => {
    if (project) {
      requestAnimationFrame(() => {
        // Fade in project title first
        gsap.fromTo(".project-title",
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
        );

        // Fade in header image after title animation
        gsap.fromTo(".header-photo",
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 1, delay: 1, ease: "power2.out" }
        );

        // Fade in the rest of the content after the header image
        gsap.fromTo(".project-details-content",
          { opacity: 0 },
          { opacity: 1, duration: 1, delay: 2 }
        );

        // Fade in key takeaways
        gsap.fromTo(".key-takeaways",
          { opacity: 0, y: -20 },
          {
            opacity: 1, y: 0, duration: 2, ease: "power2.out", scrollTrigger: {
              trigger: ".key-takeaways",
              start: "top 90%",
            }
          }
        );

        // Fade in content blocks on scroll
        gsap.utils.toArray(".content-block").forEach((block) => {
          gsap.fromTo(block,
            { opacity: 0, y: 50 },
            {
              opacity: 1, y: 0, duration: 2, scrollTrigger: {
                trigger: block,
                start: "top 80%",
                toggleActions: "play none none none",
                scroller: ".project-page",
              }
            }
          );
        });

        // Fade in images on scroll
        gsap.utils.toArray(".content-image").forEach((img, index) => {
          gsap.fromTo(img,
            { opacity: 0, x: index % 2 === 0 ? -50 : 50 },
            {
              opacity: 1, x: 0, duration: 2, scrollTrigger: {
                trigger: img,
                start: "top 80%",
                toggleActions: "play none none none",
                scroller: ".project-page",
              }
            }
          );
        });

        ScrollTrigger.refresh();
      });
    }
  }, [project]);


  const handleBack = () => {
    navigate("/projects", { state: { reverseProjectId: id } });
  };

  if (!project) return <p>Loading...</p>;

  return (
    <div className="project-page">
      <button className="back-button" onClick={handleBack}>Back</button>

      <div className="project-details">

        {/* Header Image */}
        <div className="header-container">
          <img src={project.headerPhoto} alt={project.title} className="header-photo" />
          <div className="header-overlay">
            <h1 className="project-title">{project.title}</h1>
            <p className="header-caption">{project.headerPhotoCaption || "Project Overview"}</p>
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="key-takeaways">
          <h2>Key Takeaways</h2>
          <ul>
            {project.keyTakeaways.map((takeaway, index) => (
              <li key={index}>{takeaway}</li>
            ))}
          </ul>
        </div>

        {/* Content Blocks */}
        <div ref={contentRef} className="content-section">

        <div className="section-divider"></div>

          <div key={0} className="content-block">
            <h2>Section 1</h2>
            <div className="content-layout">
              <div className="content-text">
                <p>AAALorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ac tincidunt mi.</p>
                <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.</p>
              </div>
            </div>
          </div>

          <div className="section-divider"></div>


          <div key={1} className="content-block">
            <h2>Section 1</h2>
            <div className="content-layout">
              {project.photos[0] && (
                <div className="image-container">
                  <img
                    src={project.photos[0].url}
                    alt={`Project visual 1`}
                    className="content-image"
                    height={project.photos[0].height}
                    width={project.photos[0].width}
                  />
                  <p className="image-caption">{project.photos[0].caption || `Figure 1`}</p>
                </div>
              )}
              <div className="content-text">
                <p>AAALorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ac tincidunt mi.</p>
                <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.</p>
              </div>
            </div>

            <div className="section-divider"></div>


          </div><div key={2} className="content-block">
            <h2>Section 2</h2>
            <div className="content-layout" style={{ flexDirection: "column", alignItems: "center" }}>
              {project.photos[1] && (
                <div className="image-container">
                  <img
                    src={project.photos[1].url}
                    alt={`Project visual 2`}
                    className="content-image"
                    height={project.photos[1].height}
                    width={project.photos[1].width}
                    style={{ width: "100%", height: "auto" }}
                  />
                  <p className="image-caption">{project.photos[1].caption || `Figure 2`}</p>
                </div>
              )}
              <div className="content-text" style={!project.photos[1] ? { width: "100%" } : {}}>
                <p>AAALorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ac tincidunt mi.</p>
                <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.</p>
              </div>
            </div>
          </div>
          {/* Quick Facts Section */}
          <div className="quick-facts">
            <h2>Quick Facts</h2>
            <div className="facts-grid">
              <div className="fact">
                <h3>📅 Date Completed</h3>
                <p>10/7/2020</p>
              </div>
              <div className="fact">
                <h3>🖥️ Software Used</h3>
                <p>Unity</p>
              </div>
              <div className="fact">
                <h3>🔧 Hardware</h3>
                <p>Meta Quest 2</p>
              </div>
              <div className="fact">
                <h3>👥 Team Members</h3>
                <p>Javier Aguilar, Jeff Fortune, Timothy Jinks, Jacob Powers</p>
              </div>
              <div className="fact">
                <h3>🤝 Sponsors</h3>
                <p>Dr. Ryan McMahan, Dr. Michael Kolodrubetz</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnightHacks2020;
