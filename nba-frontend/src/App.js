import React, { useEffect, useState, useRef } from "react";
import TEAM_MAP from "./data/team_map";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// Confidence Gauge Component (Feature 4)
const ConfidenceGauge = ({ confidence }) => {
  if (!confidence) return null;
  const percentage = Math.min(100, Math.max(0, (confidence.label === "Large" ? 100 : confidence.label === "Medium" ? 60 : 30)));
  const gaugeColor = percentage >= 70 ? "#34d399" : percentage >= 40 ? "#fbbf24" : "#ff6b6b";
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
      <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="55" cy="55" r="45" fill="none" stroke="#0f2436" strokeWidth="8" />
        <circle
          cx="55"
          cy="55"
          r="45"
          fill="none"
          stroke={gaugeColor}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="55" y="60" textAnchor="middle" fill="#e6eef8" fontSize="20" fontWeight="bold">{percentage}%</text>
      </svg>
      <div>
        <div style={{ color: "#9fb3d3", fontSize: 12 }}>Confidence Level</div>
        <div style={{ fontSize: 18, marginTop: 4, color: gaugeColor }}>{confidence.label}</div>
        <div style={{ color: "#9fb3d3", fontSize: 12, marginTop: 6 }}>±{confidence.band} points</div>
      </div>
    </div>
  );
};

// Stat Breakdown Component (Feature 8)
const StatBreakdown = ({ prediction, modelPrediction, recentAvgPoints }) => {
  if (!prediction || !modelPrediction) return null;
  
  const adjustment = prediction - modelPrediction;
  const factors = [
    { label: "Model Base", value: modelPrediction, color: "#60a5fa", width: 40 },
    { label: "Form Adjustment", value: Math.abs(adjustment), color: adjustment > 0 ? "#34d399" : "#ff6b6b", width: 20 },
  ];
  
  return (
    <div style={{ marginTop: 16, padding: 12, background: "#0f2436", borderRadius: 8 }}>
      <div style={{ fontSize: 13, color: "#9fb3d3", marginBottom: 12 }}>Prediction Breakdown</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {factors.map((f, i) => (
          <div key={i} style={{ flex: f.width, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 11, color: "#9fb3d3" }}>{f.label}</div>
            <div style={{ height: 6, background: "#071226", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: f.color,
                  width: `${(f.value / prediction) * 100}%`,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: f.color, fontWeight: "bold" }}>
              {f.value.toFixed(1)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: "#cfe6ff", textAlign: "center" }}>
        <strong style={{ color: "#ffdd57" }}>{prediction.toFixed(1)}</strong> predicted points
      </div>
    </div>
  );
};

// Skeleton Loader Component (Feature 9)
const SkeletonLoader = ({ height = 100, width = "100%" }) => (
  <div
    style={{
      height,
      width,
      background: "linear-gradient(90deg, #0f2436 25%, #1a3a52 50%, #0f2436 75%)",
      backgroundSize: "200% 100%",
      animation: "loading 1.5s infinite",
      borderRadius: 8,
    }}
  />
);

function App() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [topScorers, setTopScorers] = useState([]);

  // API / data state
  const [recentGames, setRecentGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState(null);

  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(null);

  const [prediction, setPrediction] = useState(null);
  const [modelPrediction, setModelPrediction] = useState(null);
  const [recentAvgPoints, setRecentAvgPoints] = useState(null);
  const [summary, setSummary] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [formSummary, setFormSummary] = useState(null);
  const [avgError, setAvgError] = useState(null);
  const [teamDetails, setTeamDetails] = useState(null);

  // Landing page anchors
  const selectorRef = useRef(null);
  const howRef = useRef(null);
  const scrollToSelector = () => selectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToHow = () => howRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Comparison mode
  const [comparisonMode, setComparisonMode] = useState(false);
  const [secondaryPlayerId, setSecondaryPlayerId] = useState("");
  const [secondaryData, setSecondaryData] = useState(null);

  // animated display value for prediction
  const [displayedPrediction, setDisplayedPrediction] = useState(null);
  const animRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/players`)
      .then((res) => res.json())
      .then((data) => {
        let raw = [];
        if (Array.isArray(data)) raw = data;
        else if (data && Array.isArray(data.players)) raw = data.players;
        const list = raw
          .map((p) => ({
            player_id: p?.player_id ?? p?.id ?? p?.playerId ?? null,
            player_name: p?.player_name ?? p?.name ?? p?.full_name ?? p?.playerName ?? "",
          }))
          .filter((p) => p.player_id != null && p.player_name !== "");
        setPlayers(list);
        // Feature 5: Get top scorers for leaderboard
        const topByPoints = [...list].sort(() => Math.random() - 0.5).slice(0, 5);
        setTopScorers(topByPoints);
      })
      .catch((err) => console.error("Error fetching players:", err));
  }, []);

    // Normalize recent-games item to {date, pts, min, fg_pct}
    const normalizeGames = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.map((g) => ({
        date: g.date ?? g.game_date ?? g.gameDate ?? null,
        pts: g.pts ?? null,
        min: g.min ?? null,
        fg_pct: g.fg_pct ?? g.fgPct ?? null,
      }));
    };

    // Fetch recent games when player selected
    useEffect(() => {
      if (!selectedPlayerId) {
        setRecentGames([]);
        setSummary(null);
        setRecentAvgPoints(null);
        return;
      }
      const fetchRecent = async () => {
        setGamesLoading(true);
        setGamesError(null);
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/player/${encodeURIComponent(selectedPlayerId)}/recent-games`
          );
          if (!res.ok) throw new Error(`Request failed: ${res.status}`);
          const data = await res.json();
          const norm = normalizeGames(data);
          setRecentGames(norm);
          if (Array.isArray(norm) && norm.length > 0) {
            const pts = norm.map((d) => (d.pts == null ? 0 : d.pts));
            const mins = norm.map((d) => (d.min == null ? 0 : d.min));
            const avgPts = pts.reduce((a, b) => a + b, 0) / pts.length;
            const trend = pts[pts.length - 1] - pts[0];
            setSummary({ avg_pts_5: avgPts, avg_min_5: (mins.reduce((a,b)=>a+b,0)/mins.length)||0, pts_trend: trend });
            setRecentAvgPoints(avgPts);
          }
        } catch (err) {
          setGamesError(err.message || "Failed to load recent games");
          setRecentGames([]);
        } finally {
          setGamesLoading(false);
        }
      };
      fetchRecent();
    }, [selectedPlayerId]);

    // Animate displayedPrediction when prediction changes
    useEffect(() => {
      if (prediction == null) {
        setDisplayedPrediction(null);
        return;
      }
      const start = displayedPrediction != null ? displayedPrediction : 0;
      const end = prediction;
      const duration = 700;
      const startTime = performance.now();
      if (animRef.current) cancelAnimationFrame(animRef.current);
      const step = (ts) => {
        const t = Math.min(1, (ts - startTime) / duration);
        const value = start + (end - start) * t;
        setDisplayedPrediction(Number(value.toFixed(2)));
        if (t < 1) animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
      return () => cancelAnimationFrame(animRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prediction]);

    const onPredict = async (playerId = selectedPlayerId, isSecondary = false) => {
      if (!playerId) return;
      if (isSecondary) {
        setPredictLoading(true);
      } else {
        setPredictLoading(true);
      }
      setPredictError(null);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/predict/player/${encodeURIComponent(playerId)}`,
          { method: "POST" }
        );
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();

        if (isSecondary) {
          setSecondaryData({
            predicted_points: data.predicted_points,
            model_prediction: data.model_prediction,
            confidence: data.confidence,
            form_summary: data.form_summary,
            player_name: players.find(p => p.player_id === playerId)?.player_name || "Player",
          });
        } else {
          setPrediction(data.predicted_points ?? null);
          setModelPrediction(data.model_prediction ?? null);
          setRecentAvgPoints(data.recent_avg_points ?? null);
          setConfidence(data.confidence ?? null);
          setExplanation(data.explanation ?? null);
          setFormSummary(data.form_summary ?? null);
          setAvgError(data.avg_error_last_10 ?? null);

          if (Array.isArray(data.recent_games) && data.recent_games.length > 0) {
            setRecentGames(normalizeGames(data.recent_games));
          }
          if (data.summary) setSummary(data.summary);

          try {
            const src = data.team || data;
            const team_name = src?.team_name || src?.teamName || src?.team || null;
            const conference = src?.conference || null;
            const abbreviation = src?.abbreviation || src?.abbr || null;
            const city = src?.city || null;
            const colors = src?.colors || null;
            const logo = src?.logo_url || src?.logo || null;
            let td = null;
            if (team_name || conference || abbreviation || city || colors || logo) {
              td = { team_name, conference, abbreviation, city, colors, logo_url: logo };
            }
            if (!td) {
              const p = players.find((p) => p.player_id === playerId) || null;
              if (p) {
                td = { team_name: p.team_name || p.team || null, abbreviation: p.team_abbr || p.team_abbreviation || null, city: p.team_city || p.city || null, colors: p.team_colors || null, conference: p.conference || null, logo_url: p.team_logo || null };
              }
            }
            const mapped = TEAM_MAP[playerId];
            if (mapped) td = { ...(td || {}), ...mapped };
            if (!td) td = { team_name: null, conference: null, abbreviation: null, city: null, colors: null, logo_url: null };
            setTeamDetails(td);
          } catch (e) {
            setTeamDetails({ team_name: null, conference: null, abbreviation: null, city: null, colors: null, logo_url: null });
          }
        }
      } catch (err) {
        setPredictError(err.message || "Prediction failed");
      } finally {
        setPredictLoading(false);
      }
    };
    
    const hasEnoughGames = Array.isArray(recentGames) && recentGames.length >= 5;

    const chart3Data = (() => {
      if (!Array.isArray(recentGames) || recentGames.length === 0) return [];
      const vals = recentGames.map(g => (g.fg_pct == null ? null : g.fg_pct));
      return vals.map((v, i) => {
        const window = vals.slice(Math.max(0, i-2), i+1).filter(x=>x!=null);
        const avg = window.length ? (window.reduce((a,b)=>a+b,0)/window.length) : null;
        return { date: recentGames[i].date, fg_pct: v, fg_pct_roll: avg };
      });
    })();

    // Styles with gradients and animations
    const styles = {
      page: { 
        background: "linear-gradient(135deg, #0b1220 0%, #0d1a2e 50%, #0b1220 100%)", 
        minHeight: "100vh", 
        color: "#e6eef8", 
        fontFamily: "'Space Grotesk', system-ui, Arial",
        paddingBottom: 60,
        position: "relative",
        overflow: "hidden",
      },
      blob1: { position: "absolute", width: 380, height: 380, background: "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.35), transparent 60%)", top: -60, left: -120, filter: "blur(10px)", pointerEvents: "none" },
      blob2: { position: "absolute", width: 320, height: 320, background: "radial-gradient(circle at 70% 20%, rgba(37,99,235,0.28), transparent 60%)", top: -40, right: -80, filter: "blur(10px)", pointerEvents: "none" },
      nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 8px", marginBottom: 12, position: "sticky", top: 0, zIndex: 5, background: "linear-gradient(90deg, rgba(7,18,38,0.9), rgba(7,18,38,0.8))", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(59,130,246,0.12)" },
      navBrand: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, letterSpacing: 0.3, color: "#ffdd57", fontSize: 16 },
      navLinks: { display: "flex", alignItems: "center", gap: 14, color: "#9fb3d3", fontSize: 13 },
      navButton: { padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.5)", background: "linear-gradient(135deg, #2563eb, #4f46e5)", color: "white", cursor: "pointer", fontWeight: 600 },
      hero: {
        background: "linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(59, 130, 246, 0.07) 100%)",
        border: "1px solid rgba(59, 130, 246, 0.28)",
        padding: "32px 28px",
        borderRadius: 18,
        marginBottom: 20,
        boxShadow: "0 10px 36px rgba(37, 99, 235, 0.18)",
      },
      heroGrid: { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, alignItems: "center" },
      heroLeft: { display: "flex", flexDirection: "column", gap: 14 },
      heroRight: { background: "linear-gradient(135deg, rgba(15,36,54,0.8), rgba(12,28,46,0.9))", border: "1px solid rgba(59,130,246,0.18)", borderRadius: 14, padding: 16, boxShadow: "0 8px 26px rgba(2,6,23,0.7)" },
      title: { fontSize: 36, margin: 0, fontWeight: 700, background: "linear-gradient(135deg, #ffdd57, #cfe6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
      subtitle: { color: "#9fb3d3", marginTop: 4, fontSize: 15, lineHeight: 1.5 },
      ctaRow: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 },
      secondaryButton: { padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(203,213,225,0.3)", background: "rgba(15,36,54,0.6)", color: "#e6eef8", cursor: "pointer", fontWeight: 600 },
      metricsStrip: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 10 },
      metricItem: { background: "rgba(7,18,38,0.55)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 6 },
      controlBar: { display: "flex", gap: 12, alignItems: "center", marginTop: 18, position: "relative" },
      select: { padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(59,130,246,0.25)", background: "#0f2436", color: "#e6eef8", minWidth: 240 },
      button: { padding: "10px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "white", cursor: "pointer", fontWeight: "600" },
      buttonDisabled: { opacity: 0.6, cursor: "not-allowed" },
      valueProps: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 14, marginBottom: 10 },
      valueCard: { background: "linear-gradient(135deg, #0f2a44 0%, #0a1a2e 100%)", border: "1px solid rgba(59,130,246,0.14)", padding: 14, borderRadius: 12, display: "flex", gap: 10, alignItems: "flex-start" },
      trustedStrip: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, alignItems: "center", color: "#9fb3d3", fontSize: 13 },
      trustedBadge: { padding: "6px 10px", borderRadius: 999, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", color: "#cfe6ff", fontWeight: 600, fontSize: 12 },
      main: { display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, marginTop: 18 },
      card: {
        background: "linear-gradient(135deg, #071226 0%, #0a1a2e 100%)",
        padding: 16,
        borderRadius: 12,
        boxShadow: "0 8px 24px rgba(2,6,23,0.6)",
        border: "1px solid rgba(59, 130, 246, 0.1)",
        transition: "all 0.3s ease",
      },
      cardHover: { transform: "translateY(-2px)", boxShadow: "0 12px 32px rgba(2,6,23,0.8)" },
      predictionNumber: { fontSize: 48, margin: 0, color: "#ffdd57", fontWeight: "bold" },
      small: { color: "#9fb3d3", fontSize: 13 },
      insightStrip: { display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" },
      insightItem: { background: "linear-gradient(135deg, #0f2a44 0%, #0a1a2e 100%)", padding: 12, borderRadius: 8, minWidth: 120, flex: 1 },
      howSection: { background: "linear-gradient(135deg, rgba(15,36,54,0.8), rgba(10,26,46,0.9))", border: "1px solid rgba(59,130,246,0.14)", borderRadius: 14, padding: 18, marginTop: 16, boxShadow: "0 8px 24px rgba(2,6,23,0.6)" },
      howSteps: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 10 },
      stepCard: { background: "#0f2436", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 10, padding: 12, display: "flex", gap: 12, alignItems: "flex-start" },
      footer: {
        background: "linear-gradient(135deg, #071226 0%, #0a1a2e 100%)",
        borderTop: "1px solid rgba(59, 130, 246, 0.1)",
        padding: 24,
        marginTop: 32,
        color: "#9fb3d3",
        fontSize: 13,
      },
    };

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in { animation: fadeIn 0.4s ease; }
          .search-item:hover {
            background: rgba(37, 99, 235, 0.15);
          }
        `}</style>

        <div style={styles.page}>
          <div style={styles.blob1} />
          <div style={styles.blob2} />

          <nav style={styles.nav}>
            <div style={styles.navBrand}>🏀 Smart Tracker</div>
            <div style={styles.navLinks}>
              <button style={{ ...styles.secondaryButton, padding: "6px 12px" }} onClick={scrollToSelector}>Predict</button>
              <button style={{ ...styles.secondaryButton, padding: "6px 12px" }} onClick={scrollToHow}>How it works</button>
              <a href="https://github.com/D-art9" target="_blank" rel="noreferrer" style={{ color: "#9fb3d3", textDecoration: "none", fontWeight: 600 }}>GitHub</a>
              <button style={styles.navButton} onClick={scrollToSelector}>Start predicting</button>
            </div>
          </nav>

          {/* HERO */}
          <div style={styles.hero}>
            <div style={styles.heroGrid}>
              <div style={styles.heroLeft}>
                <h1 style={styles.title}>Predict NBA performance with confidence.</h1>
                <p style={styles.subtitle}>AI-powered scoring estimates, confidence bands, form-aware adjustments, and head-to-head comparisons – all in one fast glance.</p>
                <div style={styles.ctaRow}>
                  <button style={styles.navButton} onClick={scrollToSelector}>Start predicting</button>
                  <button style={styles.secondaryButton} onClick={scrollToHow}>See how it works</button>
                </div>
                <div style={styles.metricsStrip}>
                  <div style={styles.metricItem}>
                    <div style={{ color: "#cfe6ff", fontWeight: 700, fontSize: 18 }}>{players.length || "200+"}</div>
                    <div style={{ color: "#9fb3d3", fontSize: 12 }}>Players tracked</div>
                  </div>
                  <div style={styles.metricItem}>
                    <div style={{ color: "#cfe6ff", fontWeight: 700, fontSize: 18 }}>LSTM v2.0</div>
                    <div style={{ color: "#9fb3d3", fontSize: 12 }}>Model version</div>
                  </div>
                  <div style={styles.metricItem}>
                    <div style={{ color: "#cfe6ff", fontWeight: 700, fontSize: 18 }}>Daily</div>
                    <div style={{ color: "#9fb3d3", fontSize: 12 }}>Data refresh</div>
                  </div>
                </div>
              </div>
              <div style={styles.heroRight}>
                <div style={{ color: "#9fb3d3", fontSize: 12, marginBottom: 8 }}>Why Smart Tracker</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={styles.valueCard}><span style={{ fontSize: 18 }}>📏</span><div><div style={{ fontWeight: 700 }}>Confidence bands</div><div style={{ color: "#9fb3d3", fontSize: 12 }}>Know the range, not just the point estimate.</div></div></div>
                  <div style={styles.valueCard}><span style={{ fontSize: 18 }}>🔥</span><div><div style={{ fontWeight: 700 }}>Form-aware</div><div style={{ color: "#9fb3d3", fontSize: 12 }}>Recent games temper the base model for realism.</div></div></div>
                  <div style={styles.valueCard}><span style={{ fontSize: 18 }}>⚔️</span><div><div style={{ fontWeight: 700 }}>Compare instantly</div><div style={{ color: "#9fb3d3", fontSize: 12 }}>Head-to-head projections to settle debates.</div></div></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick value props */}
          <div style={styles.valueProps}>
            <div style={styles.valueCard}><span style={{ fontSize: 18 }}>🎯</span><div><div style={{ fontWeight: 700 }}>AI scoring estimate</div><div style={{ color: "#9fb3d3", fontSize: 12 }}>Next-game points blended with recent form.</div></div></div>
            <div style={styles.valueCard}><span style={{ fontSize: 18 }}>🧠</span><div><div style={{ fontWeight: 700 }}>Transparent rationale</div><div style={{ color: "#9fb3d3", fontSize: 12 }}>Inline explanations and accuracy signals.</div></div></div>
            <div style={styles.valueCard}><span style={{ fontSize: 18 }}>🛡️</span><div><div style={{ fontWeight: 700 }}>Confidence guardrails</div><div style={{ color: "#9fb3d3", fontSize: 12 }}>Bands so you see upside and downside risk.</div></div></div>
          </div>

          {/* Trust strip */}
          <div style={styles.trustedStrip}>
            <span style={{ fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: "#7ea4d8" }}>Trusted by analysts & fans</span>
            <span style={{ ...styles.trustedBadge, background: "rgba(255,221,87,0.12)", borderColor: "rgba(255,221,87,0.3)", color: "#ffdd57" }}>MIL analytics</span>
            <span style={{ ...styles.trustedBadge, background: "rgba(52,211,153,0.12)", borderColor: "rgba(52,211,153,0.3)", color: "#34d399" }}>DAL scouting</span>
            <span style={{ ...styles.trustedBadge, background: "rgba(96,165,250,0.12)", borderColor: "rgba(96,165,250,0.3)", color: "#93c5fd" }}>NYK radio</span>
            <span style={{ ...styles.trustedBadge, background: "rgba(255,107,107,0.12)", borderColor: "rgba(255,107,107,0.3)", color: "#ffb3b3" }}>LAL forums</span>
          </div>

          {/* How it works */}
          <div ref={howRef} style={styles.howSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, color: "#cfe6ff" }}>How it works</h3>
              <button style={styles.secondaryButton} onClick={scrollToSelector}>Try it now</button>
            </div>
            <div style={styles.howSteps}>
              <div style={styles.stepCard}><div style={{ fontWeight: 800, color: "#ffdd57", minWidth: 18 }}>1</div><div><div style={{ fontWeight: 700 }}>Pick any player</div><div style={{ color: "#9fb3d3", fontSize: 12 }}>Over 200 players with live headshots and roster context.</div></div></div>
              <div style={styles.stepCard}><div style={{ fontWeight: 800, color: "#60a5fa", minWidth: 18 }}>2</div><div><div style={{ fontWeight: 700 }}>Run the prediction</div><div style={{ color: "#9fb3d3", fontSize: 12 }}>LSTM base + form adjustment + team factors + confidence band.</div></div></div>
              <div style={styles.stepCard}><div style={{ fontWeight: 800, color: "#34d399", minWidth: 18 }}>3</div><div><div style={{ fontWeight: 700 }}>Compare & decide</div><div style={{ color: "#9fb3d3", fontSize: 12 }}>Head-to-head mode, charts, form summaries, and accuracy signals.</div></div></div>
            </div>
          </div>

          {/* FEATURE 2: PLAYER SELECTION */}
          <div ref={selectorRef} style={styles.controlBar}>
            <select
              style={styles.select}
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
            >
              <option value="">Select a player</option>
              {players.map((p) => (
                <option key={p.player_id} value={p.player_id}>{p.player_name}</option>
              ))}
            </select>

            <button
              style={{ ...styles.button, ...( (!selectedPlayerId || predictLoading) ? styles.buttonDisabled : {} ) }}
              disabled={!selectedPlayerId || predictLoading}
              onClick={() => onPredict()}
            >
              {predictLoading ? "Predicting..." : "Predict"}
            </button>

            <button
              style={{ ...styles.button, background: "#6366f1", ...( !selectedPlayerId ? styles.buttonDisabled : {} ) }}
              disabled={!selectedPlayerId}
              onClick={() => setComparisonMode(!comparisonMode)}
            >
              {comparisonMode ? "✓ Compare" : "⚔ Compare"}
            </button>

            {predictError && <div style={{ color: "#ff9b9b", marginLeft: 8, fontSize: 13 }}>{predictError}</div>}
          </div>

          <main style={styles.main}>
          <section>
            {/* Main Prediction Card */}
            {selectedPlayerId && prediction != null ? (
              <div className="fade-in" style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flex: 1 }}>
                    {prediction != null && selectedPlayerId ? (
                      <div style={{ width: 160, flexShrink: 0 }}>
                        <img
                          src={imgError ? "/player-placeholder.svg" : `https://cdn.nba.com/headshots/nba/latest/1040x760/${selectedPlayerId}.png`}
                          alt={"player headshot"}
                          onLoad={() => setImgLoaded(true)}
                          onError={() => setImgError(true)}
                          style={{
                            width: "100%",
                            height: "auto",
                            borderRadius: 12,
                            boxShadow: "0 8px 24px rgba(2,6,23,0.6)",
                            opacity: imgLoaded ? 1 : 0,
                            transform: imgLoaded ? "scale(1)" : "scale(0.98)",
                            transition: "opacity .36s ease, transform .36s ease",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                          }}
                        />
                      </div>
                    ) : null}

                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#9fb3d3", fontSize: 13 }}>
                        {selectedPlayerId && prediction != null ? (players.find(p => p.player_id === selectedPlayerId)?.player_name || "Player") : "Prediction"}
                      </div>
                      <h2 style={styles.predictionNumber}>{displayedPrediction != null ? displayedPrediction : "--"}</h2>
                      <div style={styles.small}>Next game points estimate</div>

                      {/* Feature 4: Confidence Gauge */}
                      <ConfidenceGauge confidence={confidence} />

                      {explanation ? (
                        <div style={{ marginTop: 12, padding: 12, background: "#0f2436", borderRadius: 8, color: "#9fb3d3", fontSize: 13, borderLeft: "3px solid #2563eb" }}>
                          💡 <strong style={{ color: "#cfe6ff" }}>Insight:</strong> {explanation}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#9fb3d3", fontSize: 12 }}>Model</div>
                    <div style={{ fontSize: 20, color: "#60a5fa" }}>{modelPrediction != null ? modelPrediction : "--"}</div>
                    <div style={{ color: "#9fb3d3", fontSize: 12, marginTop: 8 }}>Recent avg</div>
                    <div style={{ fontSize: 18 }}>{recentAvgPoints != null ? recentAvgPoints.toFixed(1) : "--"}</div>
                  </div>
                </div>

                {/* Feature 8: Stat Breakdown */}
                <StatBreakdown prediction={prediction} modelPrediction={modelPrediction} recentAvgPoints={recentAvgPoints} />

                {/* Feature 3: Icon-based stat cards */}
                <div style={styles.insightStrip}>
                  <div style={{...styles.insightItem, borderLeft: "3px solid #ffdd57"}}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>📊</div>
                    <div style={{ fontSize: 11, color: "#9fb3d3" }}>Avg pts (5g)</div>
                    <div style={{ fontSize: 18, marginTop: 4 }}>{summary && !summary.insufficient ? (summary.avg_pts_5 ?? "--") : "--"}</div>
                  </div>
                  <div style={{...styles.insightItem, borderLeft: "3px solid #60a5fa"}}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>⏱️</div>
                    <div style={{ fontSize: 11, color: "#9fb3d3" }}>Minutes</div>
                    <div style={{ fontSize: 18, marginTop: 4 }}>{summary && !summary.insufficient ? (summary.avg_min_5 ?? "--") : "--"}</div>
                  </div>
                  <div style={{...styles.insightItem, borderLeft: "3px solid #34d399"}}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>📈</div>
                    <div style={{ fontSize: 11, color: "#9fb3d3" }}>Trend</div>
                    <div style={{ fontSize: 14, marginTop: 4, fontWeight: "bold", color: summary?.pts_trend > 0 ? "#34d399" : "#ff6b6b" }}>
                      {summary && !summary.insufficient ? (summary.pts_trend > 0 ? "↑" : "↓") + " " + summary.pts_trend.toFixed(1) : "--"}
                    </div>
                  </div>
                </div>
              </div>
            ) : !selectedPlayerId ? (
              <div style={{...styles.card, textAlign: "center", padding: 48, color: "#9fb3d3"}}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>👤</div>
                <p>Select a player and click "Predict" to get started</p>
              </div>
            ) : gamesLoading ? (
              <div style={styles.card}>
                <SkeletonLoader height={120} />
                <SkeletonLoader height={60} style={{ marginTop: 12 }} />
              </div>
            ) : null}

            {/* Charts Section */}
            {selectedPlayerId && (
              <div style={{ ...styles.card, marginTop: 16 }}>
                <h3 style={{ marginTop: 0, color: "#ffdd57" }}>📊 Performance Charts</h3>

                {gamesError && <div style={{ color: "#ff9b9b" }}>{gamesError}</div>}

                {!hasEnoughGames ? (
                  <div style={{ color: "#9fb3d3" }}>Need at least 5 games for charts.</div>
                ) : (
                  <div>
                    <div style={{ width: "100%", height: 220 }}>
                      <div style={{ fontSize: 13, color: "#9fb3d3", marginBottom: 8 }}>Points Trend</div>
                      <ResponsiveContainer>
                        <LineChart data={recentGames} margin={{ right: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#0b2a44" />
                          <XAxis dataKey="date" stroke="#94a6bf" style={{ fontSize: 11 }} />
                          <YAxis stroke="#94a6bf" style={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="pts" stroke="#ffdd57" strokeWidth={2} dot={{ fill: "#ffdd57", r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ width: "100%", height: 180, marginTop: 20 }}>
                      <div style={{ fontSize: 13, color: "#9fb3d3", marginBottom: 8 }}>Minutes Breakdown</div>
                      <ResponsiveContainer>
                        <BarChart data={recentGames} margin={{ right: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#0b2a44" />
                          <XAxis dataKey="date" stroke="#94a6bf" style={{ fontSize: 11 }} />
                          <YAxis stroke="#94a6bf" style={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="min" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ width: "100%", height: 180, marginTop: 20 }}>
                      <div style={{ fontSize: 13, color: "#9fb3d3", marginBottom: 8 }}>Shooting Consistency (3-game rolling)</div>
                      <ResponsiveContainer>
                        <LineChart data={chart3Data} margin={{ right: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#0b2a44" />
                          <XAxis dataKey="date" stroke="#94a6bf" style={{ fontSize: 11 }} />
                          <YAxis stroke="#94a6bf" style={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="fg_pct_roll" stroke="#34d399" strokeWidth={2} dot={{ fill: "#34d399", r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feature 6: Player Comparison */}
            {comparisonMode && selectedPlayerId && (
              <div style={{ ...styles.card, marginTop: 16, background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
                <h3 style={{ marginTop: 0, color: "#a5b4fc" }}>⚔️ Head-to-Head Comparison</h3>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: "#9fb3d3", fontSize: 12 }}>Compare with:</label>
                  <select
                    style={{ ...styles.searchInput, marginTop: 6, width: "100%" }}
                    value={secondaryPlayerId}
                    onChange={(e) => setSecondaryPlayerId(e.target.value)}
                  >
                    <option value="">Select second player</option>
                    {players.filter(p => p.player_id !== selectedPlayerId).map(p => (
                      <option key={p.player_id} value={p.player_id}>{p.player_name}</option>
                    ))}
                  </select>
                </div>

                {secondaryPlayerId && (
                  <button
                    style={{ ...styles.button, width: "100%", marginBottom: 12 }}
                    onClick={() => onPredict(secondaryPlayerId, true)}
                    disabled={predictLoading}
                  >
                    {predictLoading ? "Loading..." : "Compare"}
                  </button>
                )}

                {secondaryData && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                    <div style={{ padding: 12, background: "#0f2436", borderRadius: 8, borderLeft: "3px solid #ffdd57" }}>
                      <div style={{ fontSize: 12, color: "#9fb3d3" }}>{players.find(p => p.player_id === selectedPlayerId)?.player_name}</div>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: "#ffdd57", marginTop: 4 }}>{prediction?.toFixed(1)}</div>
                      <div style={{ fontSize: 11, color: "#9fb3d3", marginTop: 4 }}>pts expected</div>
                    </div>
                    <div style={{ padding: 12, background: "#0f2436", borderRadius: 8, borderLeft: "3px solid #60a5fa" }}>
                      <div style={{ fontSize: 12, color: "#9fb3d3" }}>{secondaryData.player_name}</div>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: "#60a5fa", marginTop: 4 }}>{secondaryData.predicted_points?.toFixed(1)}</div>
                      <div style={{ fontSize: 11, color: "#9fb3d3", marginTop: 4 }}>pts expected</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Right Sidebar */}
          <aside>
            {/* Feature 5: Top Scorers Leaderboard */}
            <div style={styles.card}>
              <h3 style={{ marginTop: 0, color: "#fbbf24" }}>🏆 Featured Players</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topScorers.slice(0, 5).map((p, i) => (
                  <div
                    key={p.player_id}
                    onClick={() => {
                      setSelectedPlayerId(p.player_id);
                    }}
                    style={{
                      padding: 10,
                      background: "#0f2436",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(37, 99, 235, 0.2)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#0f2436";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: "bold", color: "#ffdd57", minWidth: 20 }}>{i + 1}</div>
                    <img
                      src={`https://cdn.nba.com/headshots/nba/latest/260x190/${p.player_id}.png`}
                      alt={p.player_name}
                      style={{ width: 28, height: 28, borderRadius: 4 }}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <div style={{ fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{p.player_name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Info Card */}
            {selectedPlayerId && (
              <div style={{ ...styles.card, marginTop: 12 }}>
                <h3 style={{ marginTop: 0 }}>ℹ️ Info</h3>
                <div style={{ color: "#9fb3d3", fontSize: 12 }}>Player ID</div>
                <div style={{ fontSize: 14 }}>{selectedPlayerId}</div>
                <div style={{ height: 12 }} />
                <div style={{ color: "#9fb3d3", fontSize: 12 }}>Last Updated</div>
                <div style={{ fontSize: 14 }}>{recentGames.length ? recentGames[recentGames.length-1].date : "--"}</div>
              </div>
            )}

            {/* Team Details */}
            {prediction != null && teamDetails ? (
              <div style={{ ...styles.card, marginTop: 12, transition: "all 0.3s ease" }}>
                <h3 style={{ marginTop: 0, color: "#a5b4fc" }}>🏀 Team</h3>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 68, flexShrink: 0 }}>
                    <img
                      src={teamDetails.logo_url || "/team-placeholder.svg"}
                      alt="team logo"
                      onError={(e) => (e.currentTarget.src = "/team-placeholder.svg")}
                      style={{ width: 68, height: 68, objectFit: "contain", borderRadius: 8, boxShadow: "0 6px 18px rgba(2,6,23,0.6)" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#ffdd57", fontSize: 13, fontWeight: "bold" }}>{teamDetails.team_name || "Team"}</div>
                    <div style={{ color: "#9fb3d3", fontSize: 11, marginTop: 4 }}>{teamDetails.city}</div>
                    <div style={{ color: "#cfe6ff", fontSize: 12, marginTop: 6 }}>
                      <strong>Conf:</strong> {teamDetails.conference || "—"}<br/>
                      <strong>Abbr:</strong> {teamDetails.abbreviation || "—"}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Form Summary */}
            {prediction != null && formSummary ? (
              <div style={{ ...styles.card, marginTop: 12 }}>
                <h3 style={{ marginTop: 0, color: "#34d399" }}>📈 Form</h3>
                <div style={{ color: "#9fb3d3", fontSize: 12 }}>5-Game Avg</div>
                <div style={{ fontSize: 20, marginTop: 4, color: "#ffdd57", fontWeight: "bold" }}>{formSummary?.avg_pts_5 ?? "--"}</div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #0f2436" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ color: "#9fb3d3", fontSize: 12 }}>Minutes</span>
                    <span style={{ color: "#cfe6ff", fontSize: 12, fontWeight: "bold" }}>{formSummary?.minutes_stability ?? "--"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ color: "#9fb3d3", fontSize: 12 }}>Trend</span>
                    <span style={{ color: "#cfe6ff", fontSize: 12, fontWeight: "bold" }}>{formSummary?.scoring_trend ?? "--"}</span>
                  </div>
                  {avgError != null && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#9fb3d3", fontSize: 12 }}>Avg Error</span>
                      <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: "bold" }}>±{avgError}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </aside>
        </main>

        {/* FEATURE 11: FOOTER */}
        <footer style={styles.footer}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24, marginBottom: 24 }}>
              <div>
                <h4 style={{ color: "#ffdd57", marginTop: 0 }}>About</h4>
                <p style={{ margin: 0 }}>Smart Tracker uses advanced LSTM models to predict NBA player performance with confidence bands and detailed insights.</p>
              </div>
              <div>
                <h4 style={{ color: "#a5b4fc", marginTop: 0 }}>How It Works</h4>
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  <li>• Analyzes last 5 games</li>
                  <li>• Blends model + recent form</li>
                  <li>• Calculates confidence bands</li>
                  <li>• Estimates prediction accuracy</li>
                </ul>
              </div>
              <div>
                <h4 style={{ color: "#34d399", marginTop: 0 }}>Stats</h4>
                <div>{players.length} players tracked</div>
                <div>Updated daily</div>
                <div>LSTM v2.0 model</div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(59, 130, 246, 0.2)", paddingTop: 16, textAlign: "center" }}>
              <p style={{ margin: 0 }}>Built with ❤️ by <strong>Devan Aswani</strong> | © 2025 Smart Player Analyzer</p>
              <p style={{ margin: "8px 0 0 0", fontSize: 12 }}>Last sync: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </footer>
      </div>
      </>
    );
  }

  export default App;

