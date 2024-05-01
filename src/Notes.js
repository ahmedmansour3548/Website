import React, { useState, useEffect } from 'react';
import './Notes.css';

const Notes = ({ isVisible }) => {

    const [notes, setNotes] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {

        const fetchNotes = async () => {
            const response = await fetch('/notes.json');
            const fetchedNotes = await response.json();
            setNotes(fetchedNotes);
            setCurrentIndex(0);
        };
        fetchNotes();
    }, []);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
    };

    const goToNextNote = () => {
        setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, notes.length - 1));
    };

    const goToPreviousNote = () => {
        setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    };
    if (!isVisible) {
        return null; // Do not render anything if not visible
    }
    return (
        <div className="book-container">
            <div className="book">
                {notes.length > 0 && currentIndex < notes.length && (
                    <>
                        <div className="page left">
                            <p>{notes[currentIndex].content}</p>
                        </div>
                        <div className="page right">
                            <p>{formatDate(notes[currentIndex].created_at)}</p>
                            {/* Additional meta information */}
                        </div>
                    </>
                )}
            </div>
            <div className="navigation">
                <button onClick={goToPreviousNote} disabled={currentIndex <= 0}>Previous</button>
                <button onClick={goToNextNote} disabled={currentIndex >= notes.length - 1}>Next</button>
            </div>
        </div>
    );
};

export default Notes;
