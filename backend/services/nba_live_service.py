"""Live NBA stats service using nba_api with simple in-memory caching.

This module is intentionally standalone to avoid touching existing logic.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, Tuple
import time
import requests
from fastapi import HTTPException
from nba_api.stats.endpoints import playercareerstats

# Cache structure: {(player_id, season_key): {"ts": datetime, "data": dict}}
_CACHE: Dict[Tuple[int, str], Dict[str, Any]] = {}
_CACHE_TTL = timedelta(minutes=15)


def _rank_latest_row(df):
    if df is None or df.empty:
        raise ValueError("No season data")
    return df.sort_values("SEASON_ID").iloc[-1]


def _season_key_latest():
    return "latest"


def _from_cache(key: Tuple[int, str]):
    now = datetime.utcnow()
    if key in _CACHE and now - _CACHE[key]["ts"] < _CACHE_TTL:
        return _CACHE[key]["data"]
    return None


def _store_cache(key: Tuple[int, str], data: Dict[str, Any]):
    _CACHE[key] = {"ts": datetime.utcnow(), "data": data}


def get_player_latest_season_stats(player_id: int) -> Dict[str, Any]:
    cache_key = (int(player_id), _season_key_latest())
    cached = _from_cache(cache_key)
    if cached:
        return cached

    try:
        start = time.time()
        endpoint = playercareerstats.PlayerCareerStats(player_id=player_id, timeout=10)
        resp_time = time.time() - start
        data_frames = endpoint.get_data_frames()
        if not data_frames:
            raise ValueError("Empty response")
        latest = _rank_latest_row(data_frames[0])
        result = {
            "player_id": player_id,
            "season": latest.get("SEASON_ID"),
            "team_id": latest.get("TEAM_ID"),
            "team_abbreviation": latest.get("TEAM_ABBREVIATION"),
            "games_played": latest.get("GP"),
            "minutes": latest.get("MIN"),
            "points": latest.get("PTS"),
            "rebounds": latest.get("REB"),
            "assists": latest.get("AST"),
            "steals": latest.get("STL"),
            "blocks": latest.get("BLK"),
            "fg_pct": latest.get("FG_PCT"),
            "fg3_pct": latest.get("FG3_PCT"),
            "ft_pct": latest.get("FT_PCT"),
            "resp_time_sec": round(resp_time, 3),
        }
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="nba_api timeout")
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 429:
            raise HTTPException(status_code=429, detail="nba_api rate limit")
        raise HTTPException(status_code=502, detail="nba_api HTTP error")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"nba_api error: {e}")

    _store_cache(cache_key, result)
    return result
