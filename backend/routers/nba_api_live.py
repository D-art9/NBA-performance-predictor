from fastapi import APIRouter
from services import nba_live_service

router = APIRouter(prefix="/api/nba", tags=["nba_api"])


@router.get("/player/{player_id}/season-stats")
def player_latest_season_stats(player_id: int):
    """Return latest season aggregate stats for a player (cached)."""
    return nba_live_service.get_player_latest_season_stats(player_id)
