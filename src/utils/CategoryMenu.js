import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import "./CategoryMenu.css";

const CategoryMenu = ({ categories = [] }) => {
  const { pathname } = useLocation();
  const [openCat, setOpenCat] = useState(null);
  const listRefs = useRef({});                // map cat.id → <ul> element

  /* create refs as we render */
  const setRef = (id) => (el) => { listRefs.current[id] = el; };

  /* run accordion animation whenever openCat changes */
  useEffect(() => {
    categories.forEach((cat) => {
      const ul = listRefs.current[cat.id];
      if (!ul) return;

      const targetH = openCat === cat.id ? ul.scrollHeight : 0;
      gsap.to(ul, {
        height: targetH,
        opacity: openCat === cat.id ? 1 : 0,
        duration: 0.35,
        ease: "power2.inOut",
      });
    });
  }, [openCat, categories]);

  return (
    <nav className="cat-menu">
      {categories.map((cat) => (
        <div key={cat.id} className="cat-block">
          <button
            className={`cat-btn ${openCat === cat.id ? "open" : ""}`}
            onClick={() => setOpenCat((prev) => (prev === cat.id ? null : cat.id))}
          >
            {cat.title}
          </button>

          <ul ref={setRef(cat.id)} className="proj-list">
            {cat.projects.map((p) => (
              <li key={p.id}>
                <Link
                  to={p.link}
                  className={pathname.endsWith(p.id) ? "active" : ""}
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export default CategoryMenu;
