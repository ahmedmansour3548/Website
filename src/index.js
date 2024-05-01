import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Style from './Style.js';
import { Routes, Route, NavLink, BrowserRouter as Router } from 'react-router-dom';
import ReactDOM from 'react-dom/client'; // Corrected import for React 18
import React from 'react';
import Physics from './Physics';
import Home from './Home';
import Thoughts from './Thoughts';
import Ascii from './Ascii';
import { Provider } from 'react-redux';
import { store } from './store/index';
import { AnimationControlProvider } from './AnimationControlContext';
import PatternFactory from './PatternFactory';


// Use createRoot API for React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Provider store={store}>
        <Router>
            
                <AnimationControlProvider>
            
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/physics" element={<Physics />} />
                <Route path="/thoughts" element={<Thoughts />} />
                <Route path="/ascii" element={<Ascii />} />
                <Route path="/PatternFactory" element={<PatternFactory />} />
                <Route path="*" element={<p>There is nothing here: 404!</p>} />

                    </Routes>
                </AnimationControlProvider>
        </Router>
        </Provider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
