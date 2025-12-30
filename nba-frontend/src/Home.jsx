import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const nav = useNavigate();
  const [players, setPlayers] = useState([]);
  const [spotlightId, setSpotlightId] = useState("");
  const [spotlightName, setSpotlightName] = useState("");
  const [spotlight, setSpotlight] = useState(null); // prediction payload
  const [spotLoading, setSpotLoading] = useState(false);
  const [spotError, setSpotError] = useState(null);
  const [standings, setStandings] = useState({ east: [], west: [] });
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsError, setStandingsError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // fetch a small list of players and seed spotlight
  useEffect(() => {
    console.log("FETCH PLAYERS CALLED");
    fetch(`${process.env.REACT_APP_API_BASE_URL}/players`)
      .then((r) => r.json())
      .then((data) => {
        console.log("PLAYERS DATA:", data);
        const list = (Array.isArray(data) ? data : data?.players || [])
          .map((p) => ({
            player_id: p?.player_id ?? p?.id ?? p?.playerId,
            player_name: p?.player_name ?? p?.name ?? p?.full_name ?? p?.playerName,
          }))
          .filter((p) => p.player_id && p.player_name);
        setPlayers(list);
        if (list.length) selectRandom(list);
      })
      .catch(() => {});
  }, []);

  const selectRandom = (list = players) => {
    if (!list.length) return;
    const pick = list[Math.floor(Math.random() * list.length)];
    setSpotlightId(pick.player_id);
    setSpotlightName(pick.player_name);
  };

  // load spotlight prediction when id changes
  useEffect(() => {
    if (!spotlightId) return;
    setSpotLoading(true);
    setSpotError(null);
    fetch(`${process.env.REACT_APP_API_BASE_URL}/predict/player/${spotlightId}`, { method: "POST" })
      .then((r) => {
        if (!r.ok) throw new Error("Prediction failed");
        return r.json();
      })
      .then((data) => setSpotlight(data))
      .catch((e) => setSpotError(e.message))
      .finally(() => setSpotLoading(false));
  }, [spotlightId]);

  // fetch standings
  const loadStandings = () => {
    setStandingsLoading(true);
    setStandingsError(null);
    fetch(`${process.env.REACT_APP_API_BASE_URL}/standings`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load standings");
        return r.json();
      })
      .then((data) => {
        console.log("STANDINGS DATA:", data);
        setStandings({ east: data.east || [], west: data.west || [] });
        setLastUpdated(data.last_updated);
      })
      .catch((e) => setStandingsError(e.message))
      .finally(() => setStandingsLoading(false));
  };

  useEffect(() => {
    console.log("FETCH STANDINGS CALLED");
    loadStandings();
  }, []);

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">NBA Player Performance Predictor</h1>
        <p className="home-subtitle">A machine-learning powered app to analyze recent player form and predict next-game scoring.</p>
        <div className="home-cta">
          <button className="btn-primary" onClick={() => nav("/dashboard")}>Go to Dashboard</button>
          <button className="btn-ghost" onClick={() => nav("/about")} style={{ marginLeft: 12 }}>About the Creator</button>
          <button className="btn-ghost" onClick={() => nav("/data-flow")} style={{ marginLeft: 12 }}>Data Flow</button>
        </div>
      </div>

      {/* Unique: Live Player Spotlight (lightweight demo) */}
      <section className="home-spotlight">
        <div className="spot-head">
          <h3>Player spotlight</h3>
          <div className="spot-actions">
            <button className="btn-ghost" onClick={() => selectRandom()}>Shuffle</button>
            <button className="btn-ghost" onClick={() => spotlightId && nav(`/dashboard?player=${spotlightId}`)}>Open in dashboard</button>
          </div>
        </div>
        <div className="spot-card">
          <div className="spot-left">
            {spotlightId ? (
              <img
                src={`https://cdn.nba.com/headshots/nba/latest/260x190/${spotlightId}.png`}
                alt={spotlightName || "player"}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div className="spot-img-skeleton" />
            )}
          </div>
          <div className="spot-right">
            <div className="spot-name">{spotlightName || "Loading player..."}</div>
            {spotLoading ? (
              <div className="spot-row">Loading prediction…</div>
            ) : spotError ? (
              <div className="spot-row spot-error">{spotError}</div>
            ) : spotlight ? (
              <>
                <div className="spot-row">
                  <span className="spot-label">Predicted points:</span>
                  <span className="spot-value">{spotlight?.predicted_points?.toFixed?.(1) ?? "--"}</span>
                </div>
                {spotlight?.confidence && (
                  <div className="spot-row">
                    <span className="spot-label">Confidence:</span>
                    <span className="spot-chip">{spotlight.confidence.label}</span>
                    <span className="spot-note">±{spotlight.confidence.band} pts</span>
                  </div>
                )}
                {spotlight?.form_summary && (
                  <div className="spot-mini">
                    <div>
                      <div className="spot-mini-label">5-game avg</div>
                      <div className="spot-mini-value">{spotlight.form_summary.avg_pts_5 ?? "--"}</div>
                    </div>
                    <div>
                      <div className="spot-mini-label">Minutes</div>
                      <div className="spot-mini-value">{spotlight.form_summary.avg_min_5 ?? "--"}</div>
                    </div>
                    <div>
                      <div className="spot-mini-label">Trend</div>
                      <div className="spot-mini-value">{spotlight.form_summary.scoring_trend ?? "--"}</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="spot-row">Select a player to preview.</div>
            )}
          </div>
        </div>
      </section>

      {/* Conference Standings */}
      <section className="home-standings">
        <div className="stand-head">
          <div>
            <h3>2025-26 Conference Standings</h3>
            <div className="stand-sub">Live pull from balldontlie.io • refresh on load + manual</div>
          </div>
          <div className="stand-actions">
            <button className="btn-ghost" onClick={loadStandings} disabled={standingsLoading}>
              {standingsLoading ? "Refreshing..." : "Refresh"}
            </button>
            {lastUpdated && <span className="stand-updated">Updated {new Date(lastUpdated).toLocaleString()}</span>}
          </div>
        </div>
        {standingsError ? (
          <div className="stand-error">{standingsError}</div>
        ) : (
          <div className="stand-grid">
            <div className="stand-card">
              <div className="stand-title">East</div>
              <div className="stand-table">
                <div className="stand-row stand-header">
                  <span>#</span><span>Team</span><span>W-L</span><span>GB</span><span>Streak</span>
                </div>
                {(standings.east || []).map((t) => (
                  <div key={`${t.team}-E`} className="stand-row">
                    <span>{t.rank}</span>
                    <span className="stand-team">{t.team}</span>
                    <span>{t.wins}-{t.losses}</span>
                    <span>{t.gb ?? "--"}</span>
                    <span>{t.streak ?? "--"}</span>
                  </div>
                ))}
                {(!standings.east || standings.east.length === 0) && (
                  <div className="stand-row stand-empty">No data</div>
                )}
              </div>
            </div>
            <div className="stand-card">
              <div className="stand-title">West</div>
              <div className="stand-table">
                <div className="stand-row stand-header">
                  <span>#</span><span>Team</span><span>W-L</span><span>GB</span><span>Streak</span>
                </div>
                {(standings.west || []).map((t) => (
                  <div key={`${t.team}-W`} className="stand-row">
                    <span>{t.rank}</span>
                    <span className="stand-team">{t.team}</span>
                    <span>{t.wins}-{t.losses}</span>
                    <span>{t.gb ?? "--"}</span>
                    <span>{t.streak ?? "--"}</span>
                  </div>
                ))}
                {(!standings.west || standings.west.length === 0) && (
                  <div className="stand-row stand-empty">No data</div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="home-about">
        <h2>About this project</h2>
        <p>
          This is a passion project built to combine basketball analytics, machine learning, and full-stack development. It showcases an
          end-to-end pipeline for ingestion, modelling and an interactive analytics frontend. By the end of Stage 3 this project will be
          production-ready and suitable for portfolio demonstration.
        </p>
      </section>

      {/* Unique: Tech + Method badges not covered elsewhere */}
      <section className="home-badges">
        <div className="badge">Seq2Seq LSTM core</div>
        <div className="badge">Feature engineering guardrails</div>
        <div className="badge">MinMax scaler locked at train-time</div>
        <div className="badge">Confidence bands from residuals</div>
        <div className="badge">Form-aware adjustments</div>
      </section>

      {/* Unique: public roadmap */}
      <section className="home-roadmap">
        <h3>Roadmap</h3>
        <ul>
          <li><strong>v2.1</strong> Team-adjusted pace and opponent scheme tags</li>
          <li><strong>v2.2</strong> On/off splits overlay and rest-day factor</li>
          <li><strong>v2.3</strong> Shot-quality proxy and role-change detector</li>
        </ul>
      </section>

      <section className="home-features">
        <h3>Features</h3>
        <div className="feature-grid">
          <div className="feature-card">Predict next-game points using ML</div>
          <div className="feature-card">Analyze last 5 games performance</div>
          <div className="feature-card">Visualize trends with interactive charts</div>
          <div className="feature-card">Designed as an end-to-end analytics product</div>
        </div>
      </section>

      <div className="home-social">
        <a href="https://www.linkedin.com/in/devang-aswani-847535300/" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="https://github.com/D-art9" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </div>
  );
}
