import React from 'react';
import { GoTriangleRight } from "react-icons/go";
import { Link, useLocation } from 'react-router-dom';

const TOC = ({ categories, expandedCategories, toggleCategory, tocWidth, setCurrentProject }) => {
    const location = useLocation();

    return (
        <div className="toc-container" style={{ width: `${tocWidth}%` }}>
            <ul className="toc-list">
                <li>
                    <div className="toc-category" onClick={() => setCurrentProject('home')}>
                        {location.pathname === '/projects' ? <b>Home</b> : 'Home'}
                    </div>
                </li>
                {categories.map((category) => (
                    <li key={category.id}>
                        <div className="toc-category" onClick={() => {
                            toggleCategory(category.id);
                            setCurrentProject(category.id);
                        }}>
                            <GoTriangleRight className={`arrow ${expandedCategories[category.id] ? 'down' : 'right'}`} />
                            {location.pathname.includes(`/projects/${category.id}`) ? <b>{category.title}</b> : category.title}
                        </div>
                        {expandedCategories[category.id] && (
                            <ul className="toc-sublist">
                                {category.projects.map((project) => (
                                    <li key={project.id}>
                                        <Link to={project.link}>
                                            <p>{project.title}</p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TOC;