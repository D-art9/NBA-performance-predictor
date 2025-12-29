from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import numpy as np
from tensorflow.keras.models import load_model
import joblib
import pandas as pd
from pathlib import Path
import os
import requests
from datetime import datetime, timedelta
from routers import nba_api_live
from routers import games
from nba_api.stats.endpoints import leaguestandingsv3

app = FastAPI(title="NBA Points Predictor")

# Mount new nba_api router
app.include_router(nba_api_live.router)
app.include_router(games.router)

# Enable CORS for local frontend development
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3003",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3003",
    "http://192.168.1.52:3003",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# load artifacts for inference only
model = load_model("models/lstm_points_model.h5", compile=False)
scaler = joblib.load("models/minmax_scaler.pkl")

# Load dataset once at startup
DATA_PATH = Path(__file__).parent / "raw_nba_dataset.csv"
try:
    df = pd.read_csv(DATA_PATH, parse_dates=["game_date"]) 
    # ensure proper datetime parsing and sorting
    df["game_date"] = pd.to_datetime(df["game_date"], errors="coerce")
    df = df.sort_values("game_date")
except Exception:
    df = pd.DataFrame()

# Compute rolling-average features per player (after loading)
def compute_rolling_features(df):
    """Add rolling-average features per player, sorted by game_date.
    
    Features added:
    - pts_rolling_5: rolling mean of pts over last 5 games
    - pts_rolling_10: rolling mean of pts over last 10 games
    - min_rolling_5: rolling mean of min over last 5 games
    
    Computed per player, no data leakage, NaNs forward-filled.
    """
    if df.empty:
        return df
    
    df = df.copy()
    rolling_features = []
    
    for player_id in df["player_id"].unique():
        player_data = df[df["player_id"] == player_id].sort_values("game_date").copy()
        player_data["pts_rolling_5"] = player_data["pts"].rolling(window=5, min_periods=1).mean()
        player_data["pts_rolling_10"] = player_data["pts"].rolling(window=10, min_periods=1).mean()
        player_data["min_rolling_5"] = player_data["min"].rolling(window=5, min_periods=1).mean()
        player_data[["pts_rolling_5", "pts_rolling_10", "min_rolling_5"]] = \
            player_data[["pts_rolling_5", "pts_rolling_10", "min_rolling_5"]].fillna(method="ffill")
        rolling_features.append(player_data)
    
    df_with_rolling = pd.concat(rolling_features, ignore_index=True)
    return df_with_rolling.sort_values("game_date").reset_index(drop=True)

if not df.empty:
    df = compute_rolling_features(df)

SEQUENCE_LENGTH = 5
NUM_FEATURES = 8

# Standings cache (10–15 min TTL)
standings_cache = {"ts": None, "data": None}


def fetch_standings_nba_api():
    """Fetch current season standings using nba_api library."""
    try:
        standings = leaguestandingsv3.LeagueStandingsV3(
            league_id="00",
            season="2025-26",
            season_type="Regular Season"
        )
        data = standings.get_data_frames()[0]
        
        east, west = [], []
        for _, row in data.iterrows():
            item = {
                "team": row["TeamName"],
                "wins": int(row["WINS"]) if pd.notna(row["WINS"]) else 0,
                "losses": int(row["LOSSES"]) if pd.notna(row["LOSSES"]) else 0,
                "gb": row.get("ConferenceGamesBack", "-"),
                "streak": row.get("strCurrentStreak", "-"),
                "rank": int(row["ConferenceRank"]) if pd.notna(row.get("ConferenceRank")) else 99
            }
            
            conf = row["Conference"]
            if conf and str(conf).lower() == "east":
                east.append(item)
            elif conf and str(conf).lower() == "west":
                west.append(item)
        
        # Sort by rank
        east.sort(key=lambda x: x["rank"])
        west.sort(key=lambda x: x["rank"])
        
        return {"east": east, "west": west}
    except Exception as e:
        print(f"NBA API standings error: {e}")
        raise


def get_recent_avg_points(player_df, n=5):
    """Return the average points over the last n games, or None if no games."""
    last = player_df.tail(n)
    if last.empty:
        return None
    return float(last["pts"].mean())


def build_input_sequence(player_df, feature_cols, seq_len=5):
    """Build a (1, seq_len, num_features) numpy array from the player's last games.

    If fewer than seq_len games are available, pad at the start by repeating the
    oldest available game so the sequence length matches seq_len.
    Returns None if there are no games.
    """
    last = player_df[feature_cols].tail(seq_len).values
    if last.shape[0] == 0:
        return None
    if last.shape[0] < seq_len:
        pad_count = seq_len - last.shape[0]
        pad = np.repeat(last[0:1, :], pad_count, axis=0)
        seq = np.vstack([pad, last])
    else:
        seq = last
    return seq.reshape(1, seq_len, len(feature_cols))

@app.get("/")
def root():
    return {"status": "NBA prediction backend running"}


@app.get("/players")
def get_players():
    """Return a static list of players (id + name) derived from the dataset.

    If the dataset failed to load, return an empty list.
    """
    if df.empty:
        return []
    players = df[["player_id", "player_name"]].drop_duplicates()
    return players.to_dict(orient="records")


@app.get("/standings")
def get_standings():
    """Return cached NBA standings (East/West) fetched from balldontlie.io.

    Uses a 15-minute TTL cache to reduce repeated upstream calls.
    """
    now = datetime.utcnow()
    ttl = timedelta(minutes=15)
    if standings_cache["ts"] and standings_cache["data"] and now - standings_cache["ts"] < ttl:
        return {
            "last_updated": standings_cache["ts"].isoformat() + "Z",
            **standings_cache["data"],
        }

    # Fetch using nba_api
    try:
        data = fetch_standings_nba_api()
    except Exception as e:
        print(f"NBA API standings failed: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch standings from NBA API")

    standings_cache["ts"] = now
    standings_cache["data"] = data
    return {
        "last_updated": now.isoformat() + "Z",
        **data,
    }


@app.get("/player/{player_id}/recent-games")
def recent_games(player_id: int):
    """Return the last 5 games for `player_id` as a list of lists with features
    in order: [pts, min, fg_pct, home, opp_def_rating, injury_flag]
    """
    if df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")

    player_df = df[df["player_id"] == player_id].sort_values("game_date")
    if player_df.empty:
        raise HTTPException(status_code=404, detail="Player not found")

    last5 = player_df.tail(5)
    if len(last5) < 5:
        raise HTTPException(status_code=400, detail="Player has fewer than 5 games")

    # Build list of dicts with required fields for frontend charts.
    out = []
    for _, row in last5.iterrows():
        out.append(
            {
                "game_date": row["game_date"].strftime("%Y-%m-%d") if not pd.isna(row["game_date"]) else None,
                "pts": int(row["pts"]) if not pd.isna(row["pts"]) else None,
                "min": float(row["min"]) if not pd.isna(row["min"]) else None,
                "fg_pct": float(row["fg_pct"]) if not pd.isna(row["fg_pct"]) else None,
            }
        )

    return out


@app.post("/predict/player/{player_id}")
def predict_player(player_id: int):
    """Predict next-game points for a player using their last 5 games.

    - No request body required (frontend should only send `player_id`).
    - Uses the same MinMaxScaler (do NOT refit) applied to the exact 6 features.
    - Inverse-scales only the predicted `pts` value.
    """
    if df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")

    player_df = df[df["player_id"] == player_id].sort_values("game_date")
    if player_df.empty:
        raise HTTPException(status_code=404, detail="Player not found")

    # Compute recent average points (uses up to last SEQUENCE_LENGTH games)
    # Compute recent average points (uses up to last SEQUENCE_LENGTH games)
    recent_avg = get_recent_avg_points(player_df, SEQUENCE_LENGTH)

    # Use last up to SEQUENCE_LENGTH games to compute engineered features
    last_n = player_df.tail(SEQUENCE_LENGTH)
    n_games = len(last_n)
    if n_games == 0:
        raise HTTPException(status_code=400, detail="Player has no game data")

    # Feature engineering
    avg_pts_5 = float(last_n["pts"].mean())
    avg_min_5 = float(last_n["min"].mean())
    # pts_trend: (last - first) / number_of_games
    pts_first = float(last_n["pts"].iloc[0])
    pts_last = float(last_n["pts"].iloc[-1])
    pts_trend = (pts_last - pts_first) / float(n_games)
    # home_next: use last game's home flag as a proxy
    home_next = int(last_n["home"].iloc[-1]) if not pd.isna(last_n["home"].iloc[-1]) else 0
    # opponent defensive rating: use last game's opp_def_rating
    opp_def = float(last_n["opp_def_rating"].iloc[-1]) if not pd.isna(last_n["opp_def_rating"].iloc[-1]) else 0.0
    # rolling features from dataset (with safe fallback to avg_pts_5)
    pts_rolling_5 = float(last_n["pts_rolling_5"].iloc[-1]) if "pts_rolling_5" in last_n.columns and not pd.isna(last_n["pts_rolling_5"].iloc[-1]) else avg_pts_5
    pts_rolling_10 = float(last_n["pts_rolling_10"].iloc[-1]) if "pts_rolling_10" in last_n.columns and not pd.isna(last_n["pts_rolling_10"].iloc[-1]) else avg_pts_5

    engineered = {
        "avg_pts_5": avg_pts_5,
        "avg_min_5": avg_min_5,
        "pts_trend": pts_trend,
        "home_next": home_next,
        "opp_def": opp_def,
        "pts_rolling_5": pts_rolling_5,
        "pts_rolling_10": pts_rolling_10,
    }

    # Log engineered features before scaling
    print("ENGINEERED FEATURES:", engineered)

    # Build DataFrame for scaler transform to preserve column order/names
    feat_df = pd.DataFrame([engineered], columns=["avg_pts_5", "avg_min_5", "pts_trend", "home_next", "opp_def", "pts_rolling_5", "pts_rolling_10"])

    use_fallback_raw_sequence = False
    try:
        X_scaled = scaler.transform(feat_df)
        # Log scaled features before prediction
        print("SCALED FEATURES:", X_scaled.tolist())

        # Reshape to (1, timesteps, features). We use 1 timestep and len(features) features.
        X_input = np.array(X_scaled).reshape(1, 1, X_scaled.shape[1])
    except Exception as e:
        # Scaler transform failed (feature mismatch). Fall back to the previous
        # raw-sequence input (last 5 per-game features) to avoid 500 error.
        print(f"WARNING: scaler.transform failed: {e}. Falling back to raw sequence input.")
        use_fallback_raw_sequence = True

    try:
        if use_fallback_raw_sequence:
            # Build original raw per-game sequence (5 timesteps x 6 features)
            orig_cols = ["pts", "min", "fg_pct", "home", "opp_def_rating", "injury_flag"]
            X_seq = build_input_sequence(player_df, orig_cols, seq_len=SEQUENCE_LENGTH)
            if X_seq is None:
                raise HTTPException(status_code=400, detail="Player has no game data for fallback input")
            y_scaled = model.predict(X_seq)[0][0]
        else:
            y_scaled = model.predict(X_input)[0][0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

    # Inverse-scale only the predicted points (assumes pts was the first feature used in the scaler during training)
    pts_min = scaler.data_min_[0]
    pts_max = scaler.data_max_[0]
    model_prediction = float(y_scaled * (pts_max - pts_min) + pts_min)

    # Blend model prediction with recent form
    MODEL_WEIGHT = 0.6
    RECENT_WEIGHT = 0.4
    if recent_avg is None:
        final_prediction = model_prediction
    else:
        final_prediction = MODEL_WEIGHT * model_prediction + RECENT_WEIGHT * float(recent_avg)

    # Log final predicted points
    print(f"FINAL PREDICTED POINTS: {final_prediction}")

    # Build recent_games array for response (date, pts, min, fg_pct)
    recent_games = []
    for _, row in last_n.iterrows():
        recent_games.append(
            {
                "date": row["game_date"].strftime("%Y-%m-%d") if not pd.isna(row["game_date"]) else None,
                "pts": int(row["pts"]) if not pd.isna(row["pts"]) else None,
                "min": float(row["min"]) if not pd.isna(row["min"]) else None,
                "fg_pct": float(row["fg_pct"]) if not pd.isna(row["fg_pct"]) else None,
            }
        )

    # CONFIDENCE BAND: compute recent pts std and derive band + label
    try:
        pts_std = float(last_n["pts"].std(ddof=0)) if not last_n["pts"].isna().all() else 0.0
    except Exception:
        pts_std = 0.0
    confidence_band = round(float(pts_std * 1.5), 2)  # multiplier to widen the band slightly
    # label relative to recent average
    try:
        ratio = confidence_band / (avg_pts_5 if avg_pts_5 > 0 else 1)
    except Exception:
        ratio = 0.0
    if ratio < 0.15:
        conf_label = "Small"
    elif ratio < 0.3:
        conf_label = "Medium"
    else:
        conf_label = "Large"

    # MINUTES STABILITY
    try:
        min_std = float(last_n["min"].std(ddof=0)) if not last_n["min"].isna().all() else 0.0
    except Exception:
        min_std = 0.0
    minutes_stability = "Stable" if min_std < 5.0 else "Volatile"

    # SCORING TREND LABEL
    if pts_trend > 1.0:
        trend_label = "Improving"
    elif pts_trend < -1.0:
        trend_label = "Declining"
    else:
        trend_label = "Flat"

    # OPPONENT DEFENSE CONTEXT
    league_opp_def = df["opp_def_rating"].mean() if ("opp_def_rating" in df.columns and not df["opp_def_rating"].isna().all()) else None
    opp_phrase = ""
    if league_opp_def is not None:
        if opp_def > league_opp_def + 1.5:
            opp_phrase = "a tougher-than-average opponent defense slightly lowered it"
        elif opp_def < league_opp_def - 1.5:
            opp_phrase = "a weaker opponent defense slightly boosted it"
        else:
            opp_phrase = "opponent defense was average and had little effect"

    # Build a short human-readable explanation
    explain_parts = []
    if minutes_stability == "Stable":
        explain_parts.append("Consistent minutes")
    else:
        explain_parts.append("Volatile minutes")
    if avg_pts_5 >= 15:
        explain_parts.append("strong recent scoring")
    else:
        explain_parts.append("modest recent scoring")
    # combine with opponent phrase
    explanation = (
        f"{explain_parts[0]} and {explain_parts[1]} influenced the prediction, while {opp_phrase}."
    )

    # FORM SUMMARY (structured)
    form_summary = {
        "avg_pts_5": round(float(avg_pts_5), 2),
        "minutes_stability": minutes_stability,
        "scoring_trend": trend_label,
    }

    # AVERAGE ERROR (approx) over last 10 games using a simple baseline: previous-5-game mean
    errors = []
    try:
        total_games = len(player_df)
        num_considered = min(10, total_games)
        for k in range(1, num_considered + 1):
            idx = total_games - k
            # preceding 5 games end at idx-1, start at idx-5
            start = max(0, idx - 5)
            end = idx
            if end - start >= 5:
                baseline = float(player_df.iloc[start:end]["pts"].mean())
                actual = float(player_df.iloc[idx]["pts"])
                errors.append(abs(baseline - actual))
    except Exception:
        errors = []
    avg_error_last_10 = round(float(sum(errors) / len(errors)), 2) if errors else None

    # TEAM METADATA: small static mapping (expand as needed)
    TEAM_METADATA = {
        203507: {"team_name": "Milwaukee Bucks", "city": "Milwaukee", "conference": "East", "abbreviation": "MIL", "colors": ["#00471B", "#EEE1C6"], "logo_url": "https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg"},
        2544: {"team_name": "Los Angeles Lakers", "city": "Los Angeles", "conference": "West", "abbreviation": "LAL", "colors": ["#552583", "#FDB927"], "logo_url": "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg"},
    }
    team_info = TEAM_METADATA.get(player_id, {"team_name": None, "city": None, "conference": None, "abbreviation": None, "colors": None, "logo_url": None})

    # Build final response with new fields
    return {
        "player_id": player_id,
        "predicted_points": round(float(final_prediction), 2),
        "model_prediction": round(float(model_prediction), 2),
        "recent_avg_points": None if recent_avg is None else round(float(recent_avg), 2),
        "recent_games": recent_games,
        "summary": {
            "avg_pts_5": round(float(avg_pts_5), 2),
            "avg_min_5": round(float(avg_min_5), 2),
            "pts_trend": round(float(pts_trend), 4),
        },
        "confidence": {
            "band": confidence_band,
            "std": round(float(pts_std), 2),
            "label": conf_label,
        },
        "explanation": explanation,
        "form_summary": form_summary,
        "avg_error_last_10": avg_error_last_10,
        "team": team_info,
    }


@app.post("/insights/player/{player_id}")
def player_insights(player_id: int, payload: dict = Body({})):
    """Generate concise bullet-point insights using Gemini (if available).

    Expects JSON payload with keys:
      - predicted_points (number)
      - recent_games (list of {date, pts, min, fg_pct})

    Returns: {"insights": [str, ...]}
    """
    # Basic validation
    predicted_points = payload.get("predicted_points")
    recent_games = payload.get("recent_games") or payload.get("recentGames") or []

    # Build a short prompt for Gemini
    prompt_lines = [
        f"Player ID: {player_id}",
        f"Predicted points: {predicted_points}",
        "Recent games:",
    ]
    for g in recent_games:
        date = g.get("date") or g.get("game_date")
        pts = g.get("pts")
        mins = g.get("min")
        fg = g.get("fg_pct")
        prompt_lines.append(f"{date}: {pts} pts, {mins} min, FG% {fg}")

    prompt_lines.append(
        "Summarize the player's recent performance and expected next game in 4 short bullet points. Focus on form, consistency, minutes, and scoring trend."
    )

    prompt = "\n".join(prompt_lines)

    api_key = os.environ.get("GEMINI_API_KEY")
    api_url = os.environ.get("GEMINI_API_URL") or "https://api.generative.googleapis.com/v1/models/gemini-1.0:generate"

    # If no API key, return fallback insights
    if not api_key:
        fallback = [
            "AI insights not available (no API key).",
            "Use recent game averages and trends for quick checks.",
        ]
        return {"insights": fallback}

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    body = {
        "prompt": prompt,
        "maxOutputTokens": 256,
        "temperature": 0.2,
    }

    # Determine TLS verification behavior. Prefer an explicit GEMINI_CA_BUNDLE
    # or REQUESTS_CA_BUNDLE (path to PEM file) for corporate proxies or custom CAs.
    ca_bundle = os.environ.get("GEMINI_CA_BUNDLE") or os.environ.get("REQUESTS_CA_BUNDLE")
    verify_param = ca_bundle if ca_bundle else True

    try:
        print(f"Calling Gemini API at: {api_url} (verify={verify_param})")
        resp = requests.post(api_url, headers=headers, json=body, timeout=10, verify=verify_param)
        resp.raise_for_status()
        data = resp.json()
        # Try several possible response shapes
        text = None
        if isinstance(data, dict):
            # models may return candidates or outputs depending on API version
            if "candidates" in data and data["candidates"]:
                text = data["candidates"][0].get("content") or data["candidates"][0].get("output")
            elif "output" in data and isinstance(data["output"], list) and data["output"]:
                # some responses nest text under output[0].content[0].text
                o0 = data["output"][0]
                if isinstance(o0, dict):
                    # find text fields
                    if "content" in o0 and isinstance(o0["content"], list) and o0["content"]:
                        # join text entries
                        parts = []
                        for c in o0["content"]:
                            if isinstance(c, dict):
                                if "text" in c:
                                    parts.append(c["text"])
                                elif "text" in c.get("span", {}):
                                    parts.append(c["span"]["text"])
                        text = "\n".join(parts)
        if not text:
            # fallback: try to stringify response
            text = data.get("text") if isinstance(data, dict) else None

        if not text:
            raise ValueError("No text returned from Gemini")

        # Split into bullet points by newlines and return up to 6 bullets
        bullets = [line.strip(" -•\t") for line in text.splitlines() if line.strip()]
        if len(bullets) == 0:
            bullets = [text]
        return {"insights": bullets[:6]}
    except requests.exceptions.SSLError as ssl_err:
        print(f"Gemini SSL error: {ssl_err}")
        # Provide actionable guidance: prefer configuring a CA bundle.
        if ca_bundle:
            msg = (
                "SSL verification failed even when using GEMINI_CA_BUNDLE/REQUESTS_CA_BUNDLE. "
                "Check that the PEM file contains the correct CA and is readable by the process."
            )
            print(msg)
            fallback = [
                "AI insights unavailable due to SSL verification error.",
                "Check GEMINI_CA_BUNDLE/REQUESTS_CA_BUNDLE points to a valid PEM with the proxy CA.",
            ]
            return {"insights": fallback}
        # If no CA bundle provided, suggest the secure fix
        print("SSL verification failed. Suggest setting GEMINI_CA_BUNDLE or installing the corporate CA into the system trust store.")
        fallback = [
            "AI insights unavailable due to SSL verification error.",
            "Set GEMINI_CA_BUNDLE (path to PEM) or add your proxy CA to the OS trust store for a permanent fix.",
        ]
        return {"insights": fallback}
    except Exception as e:
        print(f"Gemini call failed: {e}")
        fallback = [
            "AI insights temporarily unavailable.",
            "Fallback: look at recent average points and minutes for quick context.",
        ]
        return {"insights": fallback}

# End of file



