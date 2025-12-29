import React from "react";
import "./DataFlow.css";
import { useNavigate } from "react-router-dom";

export default function DataFlow() {
  const nav = useNavigate();

  return (
    <div className="df-page">
      <header className="df-hero">
        <div>
          <h1 className="df-title">How Data Flows Through the System</h1>
          <p className="df-sub">A step-by-step breakdown of how user input becomes predictions and insights.</p>
        </div>
        <div>
          <button className="btn-primary" onClick={() => nav("/dashboard")}>Open Dashboard</button>
        </div>
      </header>

      <section className="df-overview card">
        <strong>Overview</strong>
        <p>End‑to‑end pipeline combining live user input, historical NBA data, machine learning, and optional AI explanations. A single dashboard action triggers retrieval, preprocessing, inference, calibration, and clear visual output.</p>
      </section>

      <section className="df-steps">
        <div className="step card">
          <div className="step-num">1</div>
          <h4>User Interaction (Frontend)</h4>
          <p>Select a player and request a prediction; the UI sends a concise API request.</p>
        </div>

        <div className="step card">
          <div className="step-num">2</div>
          <h4>Data Retrieval (Backend)</h4>
          <p>Backend fetches the last games from the dataset: points, minutes, FG%, opponent context.</p>
        </div>

        <div className="step card">
          <div className="step-num">3</div>
          <h4>Feature Engineering</h4>
          <p>Compute rolling averages, trends and contextual flags to produce robust model features.</p>
        </div>

        <div className="step card">
          <div className="step-num">4</div>
          <h4>Model Inference (LSTM)</h4>
          <p>Scaled features (or validated raw-sequence fallback) are fed to the trained LSTM to predict next‑game points.</p>
        </div>

        <div className="step card">
          <div className="step-num">5</div>
          <h4>Post‑Processing & Calibration</h4>
          <p>Inverse‑scale model output and blend with recent form to improve realism and reduce extremes.</p>
        </div>

        <div className="step card">
          <div className="step-num">6</div>
          <h4>AI Insights (Optional)</h4>
          <p>Generate short, human‑friendly bullets that explain trends, minutes, and caveats.</p>
        </div>

        <div className="step card">
          <div className="step-num">7</div>
          <h4>Frontend Visualization</h4>
          <p>Render predictions, charts and insights in a concise dashboard for quick interpretation.</p>
        </div>
      </section>

      <section className="df-tech card">
        <h4>Technologies Used</h4>
        <div className="tech-grid">
          <div>Frontend: React</div>
          <div>Backend: FastAPI</div>
          <div>Data: pandas, NumPy</div>
          <div>Scaling: scikit‑learn</div>
          <div>ML: TensorFlow / Keras (LSTM)</div>
          <div>Viz: Recharts (or similar)</div>
          <div>AI Insights: LLM-based generation (optional)</div>
        </div>
      </section>

      <section className="df-stage card note">
        <strong>Stage 3 improvements</strong>
        <p>Stage 3 upgrades include disciplined feature engineering, smarter calibration, and improved explainability — making the system production‑ready and more trustworthy.</p>
      </section>

      <section className="df-close card">
        <p><strong>Why this matters:</strong> Clear data flow builds reliable products. This pipeline balances model accuracy with interpretability and user trust — key qualities for real‑world ML systems.</p>
      </section>
    </div>
  );
}
