import './index.css';
import reportWebVitals from './reportWebVitals';
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import React from 'react';
import Physics from './Physics/Physics.js';
import Home from './Home/Home.js';
import Thoughts from './Thoughts/Thoughts.js';
import Ascii from './ASCII/Ascii.js';
import { Provider } from 'react-redux';
import { store } from './store/index';
import { AnimationControlProvider } from './utils/AnimationControlContext.js';
import PatternFactory from './PatternFactory/PatternFactory';
import About from './About/About.js';
import Projects from './Projects/Projects.js';
import KnightHacks2020 from './Projects/coding/KnightHacks2020'; // <-- Import here
import History from './History/History.js';
import Music from './Music/Music.js';
import Writings from './Writings/Writings.js';
import Contact from './Contact/Contact.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    //<React.StrictMode>
        <Provider store={store}>
          <Router>
            <AnimationControlProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route exact path="/projects" element={<Projects />} />
                <Route path="/projects/coding/:id" element={<KnightHacks2020 />} />
                <Route exact path="/music" element={<Music />} />
                <Route path="/physics" element={<Physics />} />
                <Route path="/thoughts" element={<Thoughts />} />
                <Route path="/writings" element={<Writings />} />
                <Route path="/ascii" element={<Ascii />} />
                <Route path="/PatternFactory" element={<PatternFactory />} />
                <Route path="/About" element={<About />} />
                <Route path="/History" element={<History />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<p>There is nothing here: 404!</p>} />
              </Routes>
            </AnimationControlProvider>
          </Router>
        </Provider>
   // </React.StrictMode>
);

reportWebVitals();
