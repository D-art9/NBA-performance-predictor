import React from "react";
import "./About.css";

export default function About() {
  return (
    <div className="about-page">
      <div className="about-card">
        <h1>About the Creator</h1>
        <p>
          I’m a computer science student and basketball enthusiast with a strong interest in building data-driven products. This
          project started as a passion for understanding the game beyond the box score and evolved into a full-stack machine learning
          application.
        </p>

        <p>
          I enjoy working at the intersection of software engineering, machine learning, and analytics, turning raw data into meaningful
          insights that people can actually use. For me, this isn’t just about building a model — it’s about designing an end-to-end system
          that feels intuitive, reliable, and purposeful.
        </p>

        <p>
          This NBA Player Performance Predictor reflects that mindset. It combines real game data, predictive modeling, and modern web
          development to analyze recent player form and estimate next-game performance. By Stage 3, the project is designed to be
          production-ready, with a focus on clean architecture, explainability, and user experience.
        </p>

        <p>
          I’m constantly learning, experimenting, and refining my approach — whether it’s improving model logic, optimizing backend
          systems, or polishing frontend interactions. I see projects like this as both a creative outlet and a way to build skills that
          translate directly to real-world engineering problems.
        </p>

        <div className="about-links">
          <a href="https://www.linkedin.com/in/devang-aswani-847535300/" target="_blank" rel="noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 8 }}><path fill="#9fb3d3" d="M4.98 3.5C4.98 4.88 3.88 6 2.49 6C1.11 6 0 4.88 0 3.5C0 2.12 1.11 1 2.49 1C3.88 1 4.98 2.12 4.98 3.5ZM0.5 23.5H4.5V8.5H0.5V23.5ZM8.5 8.5H12.3V10.2H12.4C13 9.1 14.7 7.9 17 7.9C22 7.9 23 10.9 23 15.2V23.5H19V15.9C19 13.6 18.5 12 16 12C13.6 12 12.9 13.7 12.9 15.8V23.5H8.5V8.5Z"/></svg>
            LinkedIn
          </a>
          <a href="https://github.com/D-art9" target="_blank" rel="noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 8 }}><path fill="#9fb3d3" d="M12 .5C5.73.5.9 5.33.9 11.6c0 4.6 2.99 8.5 7.14 9.9.52.1.7-.23.7-.5v-1.8c-2.9.64-3.5-1.28-3.5-1.28-.47-1.2-1.15-1.52-1.15-1.52-.94-.64.07-.63.07-.63 1.04.07 1.59 1.07 1.59 1.07.92 1.56 2.42 1.11 3 .85.1-.66.36-1.11.66-1.36-2.3-.26-4.72-1.15-4.72-5.12 0-1.13.39-2.05 1.03-2.77-.1-.27-.45-1.36.1-2.83 0 0 .84-.27 2.75 1.04A9.45 9.45 0 0112 6.8c.85 0 1.71.11 2.5.32 1.9-1.31 2.74-1.04 2.74-1.04.55 1.47.2 2.56.1 2.83.64.72 1.03 1.64 1.03 2.77 0 4-2.43 4.86-4.75 5.11.37.33.7.98.7 1.98v2.94c0 .26.18.61.7.5 4.15-1.4 7.14-5.3 7.14-9.9C23.1 5.33 18.27.5 12 .5z"/></svg>
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
