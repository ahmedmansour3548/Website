import '../Projects.css';
import React, { useState, useRef, useEffect } from 'react';
import { GoTriangleRight } from "react-icons/go";
import { Link } from 'react-router-dom';

const ARMural = ({ projects }) => {
    const [tocWidth, setTocWidth] = useState(20); // Initial width in percentage
    const [expandedCategories, setExpandedCategories] = useState({});
    const containerRef = useRef(null);

    const handleMouseDown = (e) => {
        e.preventDefault();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            let newTocWidth = (e.clientX / containerWidth) * 100;
            if (newTocWidth < 10) newTocWidth = 10; // Minimum width
            if (newTocWidth > 50) newTocWidth = 50; // Maximum width
            setTocWidth(newTocWidth);
        }
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const toggleCategory = (category) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    return (
        <div className="project-page" ref={containerRef}>
            <div className="toc-container" style={{ width: `${tocWidth}%` }}>
                <ul className="toc-list">
                    <li>
                        <div className="toc-category" onClick={() => window.location.href = '/projects'}>
                            Home
                        </div>
                    </li>
                    {projects.map((project) => (
                        <li key={project.id}>
                            <div className="toc-category" onClick={() => toggleCategory(project.id)}>
                                <GoTriangleRight className={`arrow ${expandedCategories[project.id] ? 'down' : 'right'}`} />
                                {project.id === 'mural' ? <b>{project.title}</b> : project.title}
                            </div>
                            {expandedCategories[project.id] && (
                                <ul className="toc-sublist">
                                    <li>
                                        <Link to={project.link}>
                                            <img
                                                src={project.headerPhoto}
                                                alt={project.title}
                                                className="project-header-photo"
                                                style={{
                                                    width: `${project.headerPhotoWidth}px`,
                                                    height: 'auto'
                                                }}
                                            />
                                        </Link>
                                    </li>
                                    <li>
                                        <p>{project.description}</p>
                                    </li>
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="divider" onMouseDown={handleMouseDown}></div>
            <div className="content-container" style={{ width: `${100 - tocWidth}%` }}>
                <div className="project-section">
                    <h2>VARLAB Augmented Reality Mural</h2>
                    <p>Description of the VARLAB Augmented Reality Mural project...</p>
                    {/* Add more content related to the AR Mural project here */}
                </div>
            </div>
        </div>
    );
};

export default ARMural;