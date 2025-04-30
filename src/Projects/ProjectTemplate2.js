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
                // Parallax Effect on Header
                gsap.to(".header-photo", {
                    yPercent: -20,
                    scrollTrigger: {
                        trigger: ".header-photo",
                        start: "top top",
                        end: "bottom top",
                        scrub: true,
                    }
                });

                // Staggered content appearance
                gsap.utils.toArray(".content-section .content-block").forEach((block, index) => {
                    gsap.fromTo(block,
                        { opacity: 0, y: 30 },
                        {
                            opacity: 1, y: 0, duration: 1, delay: index * 0.2, scrollTrigger: {
                                trigger: block,
                                start: "top 85%",
                                toggleActions: "play none none none",
                            }
                        }
                    );
                });

                // Floating quick facts panel animation
                gsap.fromTo(".quick-facts",
                    { opacity: 0, x: 50 },
                    {
                        opacity: 1, x: 0, duration: 1.5, ease: "power2.out", scrollTrigger: {
                            trigger: ".quick-facts",
                            start: "top 90%",
                        }
                    }
                );

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
            {/* Floating Back Button */}
            <button className="floating-back-button" onClick={handleBack}>← Back</button>

            {/* Header Image */}
            <div className="header-container">
                <img src={project.headerPhoto} alt={project.title} className="header-photo" />
                <div className="header-overlay">
                    <h1 className="project-title">{project.title}</h1>
                    <p className="header-caption">{project.headerPhotoCaption || "Project Overview"}</p>
                </div>
            </div>

            {/* Content Blocks */}
            <div ref={contentRef} className="content-section">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className={`content-block ${index % 2 === 0 ? "left" : "right"}`}>
                        <h2>Section {index + 1}</h2>
                        <div className="content-layout">
                            {project.photos[index] && (
                                <img src={project.photos[index].url} alt={`Project visual ${index + 1}`} className="content-image" />
                            )}
                            <div className="content-text">
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ac tincidunt mi.</p>
                                <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Quick Facts Panel */}
            <div className="quick-facts">
                <h2>Quick Facts</h2>
                <ul>
                    <li><strong>📅 Date:</strong> 10/7/2020</li>
                    <li><strong>🖥️ Software:</strong> Unity</li>
                    <li><strong>🔧 Hardware:</strong> Meta Quest 2</li>
                    <li><strong>👥 Team:</strong> Javier Aguilar, Jeff Fortune, Timothy Jinks, Jacob Powers</li>
                    <li><strong>🤝 Sponsors:</strong> Dr. Ryan McMahan, Dr. Michael Kolodrubetz</li>
                </ul>
            </div>
        </div>
    );
};

export default KnightHacks2020;
