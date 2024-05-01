import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Pattern from './Pattern';
import './Home.css';
import Notes from './Notes';
import { useAnimationControl } from './AnimationControlContext';

import './Home.css';
import TimelineController from './TimelineController';

const Home = () => {
    const { toggleRepeatRotation } = useAnimationControl();
    
    
    const handleButtonClick = () => {

        toggleRepeatRotation();
    };

    return (
        <div className="home-page">
            <h1>Welcome to the Homepage</h1>
            <p>This is the starting point of our React application.</p>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/physics">Physics</Link></li>
                    <li><Link to="/thoughts">Thoughts</Link></li>
                    <li><Link to="/writings">Writings</Link></li>
                    <li><Link to="/professional">Professional</Link></li>
                </ul>
            </nav>
            <TimelineController></TimelineController>
            <Notes isVisible={false}></Notes>
            <div className="homepage-button-container">
                <button className="homepage-button" onClick={handleButtonClick}>Who I am</button>
                <button className="homepage-button" onClick={handleButtonClick}>What I do</button>
                <button className="homepage-button" onClick={handleButtonClick}>Got Stuff to do</button>
                <button className="homepage-button" onClick={handleButtonClick}>I'm Stuff</button>
            </div>
        </div>
    );
};

export default Home;
