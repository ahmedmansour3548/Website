// src/Projects/ProjectTemplate3.js
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
        gsap.fromTo(
          ".project-title",
          { opacity: 0, y: -30 },
          { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
        );
        // Fade in header section (image and overlay) next
        gsap.fromTo(
          ".header-section",
          { opacity: 0, y: -30 },
          { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: "power2.out" }
        );
        // Then fade in the remaining content
        gsap.fromTo(
          ".project-details-content",
          { opacity: 0 },
          { opacity: 1, duration: 1, delay: 1.5 }
        );

        // Animate key takeaways on scroll
        gsap.fromTo(
          ".key-takeaways",
          { opacity: 0, y: -20 },
          {
            opacity: 1,
            y: 0,
            duration: 2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".key-takeaways",
              start: "top 90%",
            },
          }
        );

        // Animate content blocks on scroll
        gsap.utils.toArray(".content-block").forEach((block, index) => {
          gsap.fromTo(
            block,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: index * 0.2,
              scrollTrigger: {
                trigger: block,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        });

        // Animate images on scroll
        gsap.utils.toArray(".content-image").forEach((img, index) => {
          gsap.fromTo(
            img,
            { opacity: 0, x: index % 2 === 0 ? -50 : 50 },
            {
              opacity: 1,
              x: 0,
              duration: 2,
              scrollTrigger: {
                trigger: img,
                start: "top 85%",
                toggleActions: "play none none none",
              },
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
      <button className="back-button" onClick={handleBack}>
        Back
      </button>

      <div className="project-details">
        {/* Header Section */}
        <header className="header-section">
          <img
            src={project.headerPhoto}
            height={project.headerPhotoHeight}
            width={project.headerPhotoWidth}
            alt={project.title}
            className="header-photo"
          />
          <div className="header-overlay">
            <h1 className="project-title">{project.title}</h1>
            <p className="header-caption">
              {project.headerPhotoCaption || "Project Overview"}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <div className="project-details-content" ref={contentRef}>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="content-block">
              <h2>Section {index + 1}</h2>
              {index === 1 ? (
                // Variant 2: Section 2 has a full-width image with text underneath.
                <div className="content-layout variant-2">
                  {project.photos[index] && (
                    <div className="image-container fullwidth">
                      <img
                        src={project.photos[index].url}
                        alt={`Section ${index + 1}`}
                        className="content-image fullwidth"
                      />
                      <p className="image-caption">
                        {project.photos[index].caption || `Figure ${index + 1}`}
                      </p>
                    </div>
                  )}
                  <div className="content-text fullwidth">
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Proin ac tincidunt mi.
                    </p>
                    <p>
                      Sed ut perspiciatis unde omnis iste natus error sit
                      voluptatem accusantium.
                    </p>
                  </div>
                </div>
              ) : (
                // Variant 1: For other sections, show text above and then a row with image (if any) on the left and additional text on the right.
                <div className="content-layout variant-1">
                  <div className="text-above">
                    <p>
                      This is introductory text for section {index + 1} that
                      appears above.
                    </p>
                  </div>
                  <div className="row">
                    {project.photos[index] && (
                      <div className="image-container">
                        <img
                          src={project.photos[index].url}
                          alt={`Figure ${index + 1}`}
                          className="content-image"
                        />
                        <p className="image-caption">
                          {project.photos[index].caption || `Figure ${index + 1}`}
                        </p>
                      </div>
                    )}
                    <div
                      className="content-text"
                      style={!project.photos[index] ? { width: "100%" } : {}}
                    >
                      <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Proin ac tincidunt mi.
                      </p>
                      <p>
                        Sed ut perspiciatis unde omnis iste natus error sit
                        voluptatem accusantium.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
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
              <p>
                Javier Aguilar, Jeff Fortune, Timothy Jinks, Jacob Powers
              </p>
            </div>
            <div className="fact">
              <h3>🤝 Sponsors</h3>
              <p>Dr. Ryan McMahan, Dr. Michael Kolodrubetz</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnightHacks2020;
