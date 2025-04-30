import React, { useEffect, useState } from 'react';
import './Writings.css';
import * as d3 from 'd3';

const Writings = () => {
    const [notes, setNotes] = useState([]);
    const [stats, setStats] = useState({ totalWords: 0, totalWritings: 0, monthlyActivity: {} });
    const [selectedNote, setSelectedNote] = useState(null);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const response = await fetch('/notes.json');
                const fetchedNotes = await response.json();
                setNotes(fetchedNotes);
                calculateStats(fetchedNotes);
            } catch (error) {
                console.error("Error fetching notes:", error);
            }
        };
        fetchNotes();
    }, []);

    const calculateStats = (notes) => {
        let totalWords = 0;
        let monthlyActivity = {};

        notes.forEach(note => {
            const wordCount = note.content.split(' ').length;
            totalWords += wordCount;
            const month = new Date(note.created_at).toISOString().slice(0, 7);
            monthlyActivity[month] = (monthlyActivity[month] || 0) + wordCount;
        });

        setStats({ totalWords, totalWritings: notes.length, monthlyActivity });
    };

    useEffect(() => {
        if (Object.keys(stats.monthlyActivity).length > 0) {
            renderBarChart();
        }
    }, [stats]);

    const renderBarChart = () => {
        const data = Object.entries(stats.monthlyActivity).map(([month, count]) => ({ month, count }));
        const svg = d3.select("#chart").html('').append("svg").attr("width", 500).attr("height", 300);
        const xScale = d3.scaleBand().domain(data.map(d => d.month)).range([0, 500]).padding(0.2);
        const yScale = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).range([300, 0]);

        svg.selectAll("rect").data(data).enter().append("rect")
            .attr("x", d => xScale(d.month))
            .attr("y", d => yScale(d.count))
            .attr("width", xScale.bandwidth())
            .attr("height", d => 300 - yScale(d.count))
            .attr("fill", "#ff00ff")
            .style("transition", "0.5s ease");
    };

    return (
        <div className="writings-container">
            <h1 className="writings-title">📖 Writings Dashboard</h1>
            <div className="stats-card">
                <p><strong>Total Writings:</strong> {stats.totalWritings}</p>
                <p><strong>Total Words Written:</strong> {stats.totalWords}</p>
            </div>
            <div id="chart" className="chart-container"></div>
            <div className="thought-jots">
                <h2>Recent Thought Jots</h2>
                <div className="thoughts-grid">
                    {notes.slice(0, 6).map(note => (
                        <div 
                            key={note.uuid} 
                            className={`thought-card ${selectedNote === note.uuid ? 'active' : ''}`}
                            onClick={() => setSelectedNote(note.uuid)}
                        >
                            <p>{note.content.slice(0, 50)}...</p>
                            <span>{new Date(note.created_at).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            </div>
            {selectedNote && (
                <div className="note-detail fade-in">
                    <button onClick={() => setSelectedNote(null)} className="close-btn">×</button>
                    <p>{notes.find(note => note.uuid === selectedNote).content}</p>
                </div>
            )}
        </div>
    );
};

export default Writings;
