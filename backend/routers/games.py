from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta, timezone

try:
    from nba_api.live.nba.endpoints import scoreboard
except Exception:
    scoreboard = None

router = APIRouter(prefix="/api", tags=["games"])

_cache = {"ts": None, "data": None}
_CACHE_TTL = timedelta(seconds=60)


def _extract_games(sb_dict: dict) -> List[dict]:
    games = sb_dict.get("scoreboard", {}).get("games", [])
    out = []
    for g in games:
        home = g.get("homeTeam", {})
        away = g.get("awayTeam", {})
        out.append({
            "game_id": g.get("gameId"),
            "home_team": home.get("teamName"),
            "away_team": away.get("teamName"),
            "home_score": home.get("score"),
            "away_score": away.get("score"),
            "status": g.get("gameStatusText"),
            "start_time_utc": g.get("gameTimeUTC"),
        })
    return out


def _fetch_date(date_str: str) -> List[dict]:
    if scoreboard is None:
        return []
    try:
        sb = scoreboard.ScoreBoard(gameDate=date_str)
        return _extract_games(sb.get_dict())
    except Exception:
        return []


@router.get("/games")
def get_games():
    now = datetime.now(timezone.utc)
    if _cache["ts"] and _cache["data"] and (now - _cache["ts"]) < _CACHE_TTL:
        return _cache["data"]

    today = now.date()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    # Fetch yesterday, today, tomorrow
    all_games: List[dict] = []
    for d in (yesterday, today, tomorrow):
        ds = d.strftime("%Y-%m-%d")
        all_games.extend(_fetch_date(ds))

    # Fallback sample if nothing returned
    if not all_games:
        sample = [
            {
                "game_id": "sample-final",
                "home_team": "Los Angeles Lakers",
                "away_team": "Boston Celtics",
                "home_score": 112,
                "away_score": 108,
                "status": "Final",
                "start_time_utc": (now - timedelta(days=1)).isoformat().replace("+00:00", "Z"),
            },
            {
                "game_id": "sample-upcoming",
                "home_team": "Golden State Warriors",
                "away_team": "Phoenix Suns",
                "home_score": None,
                "away_score": None,
                "status": "Scheduled",
                "start_time_utc": (now + timedelta(days=1)).isoformat().replace("+00:00", "Z"),
            },
        ]
        all_games = sample

    _cache["ts"] = now
    _cache["data"] = all_games
    return all_games
