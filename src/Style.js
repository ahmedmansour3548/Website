import React from 'react';
import './Style.css';

function Style({ children }) {
    return (
        <div>
            {/* Header */}
            <header>
                {/* Header content */}
            </header>

            {/* Main content area */}
            <main>
                {children}
            </main>

            {/* Background container for the background effect */}
            <div id="background-container"></div>

            {/* Footer */}
            <footer>
                {/* Footer content */}
            </footer>
        </div>
    );
}

export default Style;
