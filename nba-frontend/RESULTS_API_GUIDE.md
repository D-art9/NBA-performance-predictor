# NBA Results Page - Backend Integration Guide

## Overview
The Results page expects a `/api/games` endpoint that returns NBA game data.

## Expected API Response Format

```json
[
  {
    "game_id": "0022400456",
    "home_team": "Los Angeles Lakers",
    "away_team": "Boston Celtics",
    "home_score": 112,
    "away_score": 108,
    "status": "Final",
    "start_time_utc": "2025-12-26T02:30:00Z"
  },
  {
    "game_id": "0022400457",
    "home_team": "Golden State Warriors",
    "away_team": "Phoenix Suns",
    "home_score": null,
    "away_score": null,
    "status": "Scheduled",
    "start_time_utc": "2025-12-27T03:00:00Z"
  }
]
```

## Field Descriptions

- `game_id` (string, required): Unique identifier for the game
- `home_team` (string, required): Home team name
- `away_team` (string, required): Away team name
- `home_score` (number|null): Home team score (null for scheduled games)
- `away_score` (number|null): Away team score (null for scheduled games)
- `status` (string, required): Game status - "Final", "Final OT", "Q1", "Q2", "Q3", "Q4", "Halftime", "Scheduled", "Live"
- `start_time_utc` (string, required): ISO 8601 UTC timestamp

## Frontend Behavior

1. **Date Grouping**: Games are automatically grouped into:
   - Yesterday's Final Games
   - Today's Games
   - Upcoming Games

2. **Time Conversion**: All UTC times are converted to user's local timezone

3. **Status Display**:
   - "Final" - Shows final score with green badge
   - "Live" or "Q1-Q4" - Shows current score with red pulsing badge
   - "Scheduled" - Shows "-" for scores with yellow badge

4. **Empty States**:
   - No games: Shows friendly empty state
   - API error: Shows error message with retry button

## Sample Backend Implementation (FastAPI)

```python
from fastapi import APIRouter
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class GameResponse(BaseModel):
    game_id: str
    home_team: str
    away_team: str
    home_score: Optional[int]
    away_score: Optional[int]
    status: str
    start_time_utc: str

@router.get("/api/games", response_model=List[GameResponse])
def get_games():
    # This is a sample implementation
    # Replace with actual API calls to NBA API or database
    
    today = datetime.utcnow()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)
    
    sample_games = [
        {
            "game_id": "0022400456",
            "home_team": "Los Angeles Lakers",
            "away_team": "Boston Celtics",
            "home_score": 112,
            "away_score": 108,
            "status": "Final",
            "start_time_utc": yesterday.isoformat() + "Z"
        },
        {
            "game_id": "0022400457",
            "home_team": "Golden State Warriors",
            "away_team": "Phoenix Suns",
            "home_score": None,
            "away_score": None,
            "status": "Scheduled",
            "start_time_utc": tomorrow.isoformat() + "Z"
        }
    ]
    
    return sample_games
```

## Integration with nba_api

To fetch real NBA game data, you can use the nba_api library:

```python
from nba_api.live.nba.endpoints import scoreboard
from datetime import datetime

def get_live_games():
    try:
        games_data = scoreboard.ScoreBoard()
        games = games_data.get_dict()['scoreboard']['games']
        
        result = []
        for game in games:
            result.append({
                "game_id": game['gameId'],
                "home_team": game['homeTeam']['teamName'],
                "away_team": game['awayTeam']['teamName'],
                "home_score": game['homeTeam']['score'],
                "away_score": game['awayTeam']['score'],
                "status": game['gameStatusText'],
                "start_time_utc": game['gameTimeUTC']
            })
        
        return result
    except Exception as e:
        print(f"Error fetching games: {e}")
        return []
```

## CORS Configuration

Make sure your backend allows requests from the frontend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing the Endpoint

Test with curl:
```bash
curl http://127.0.0.1:8000/api/games
```

## Notes

- The frontend expects UTC timestamps in ISO 8601 format
- Scores should be `null` (not 0) for scheduled games
- Status strings are case-insensitive on the frontend
- The page auto-groups games by date, no need for backend date filtering
