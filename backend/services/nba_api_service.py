import pandas as pd
import time

from nba_api.stats.endpoints import (
    playergamelog,
    leaguedashteamstats,
    leaguedashplayerstats
)
from nba_api.stats.static import players, teams


# -----------------------------
# Get Top 50 Players (by PPG)
# -----------------------------
def get_top_50_players(season="2023-24"):
    df = leaguedashplayerstats.LeagueDashPlayerStats(
        season=season,
        per_mode_detailed="PerGame"
    ).get_data_frames()[0]

    df = df.sort_values("PTS", ascending=False)
    top_players = df.head(50)

    return set(top_players["PLAYER_ID"].tolist())


# -----------------------------
# Convert Team Abbreviation → Team ID
# -----------------------------
def get_team_id_from_abbrev(abbrev):
    if abbrev is None:
        return None

    all_teams = teams.get_teams()
    for t in all_teams:
        if t["abbreviation"] == abbrev:
            return t["id"]
    return None


# -----------------------------
# Seasons used to build dataset
# -----------------------------
SEASONS = ["2021-22", "2022-23", "2023-24"]


# -----------------------------
# Get All NBA Players
# -----------------------------
def get_all_players():
    return players.get_players()


# -----------------------------
# Get Team Defensive Ratings
# -----------------------------
def get_team_defensive_ratings(season):
    df = leaguedashteamstats.LeagueDashTeamStats(
        season=season,
        measure_type_detailed_defense="Advanced"  # FIXED parameter name
    ).get_data_frames()[0]

    return dict(zip(df["TEAM_ID"], df["DEF_RATING"]))


# -----------------------------
# Get Game Logs for a Player
# -----------------------------
def get_player_game_logs(season, player_id):
    try:
        logs = playergamelog.PlayerGameLog(
            season=season,
            player_id=player_id
        ).get_data_frames()[0]

        time.sleep(0.6)  # avoid NBA API rate-limit
        return logs

    except Exception as e:
        print(f"Error fetching logs for Player {player_id}: {e}")
        return None


# -----------------------------
# Build Raw Dataset
# -----------------------------
def build_raw_dataset():
    print("Fetching Top 50 scorers...")
    top_50_ids = get_top_50_players("2023-24")

    # Only include the top 50 players
    all_players = [p for p in get_all_players() if p["id"] in top_50_ids]

    rows = []

    for season in SEASONS:
        print(f"Getting defensive ratings for {season}...")
        def_ratings = get_team_defensive_ratings(season)

        for p in all_players:
            pid = p["id"]
            pname = p["full_name"]

            logs = get_player_game_logs(season, pid)
            if logs is None or logs.empty:
                continue

            # Ensure chronological order
            logs = logs.sort_values("GAME_DATE")

            prev_played = True  # for injury flag detection

            for _, row in logs.iterrows():

                # -----------------------------
                # Parse home / away from MATCHUP
                # -----------------------------
                matchup = row["MATCHUP"]
                home = 1 if (" vs " in matchup or " vs. " in matchup) else 0

                # -----------------------------
                # Extract opponent abbreviation
                # MATCHUP example: "GSW vs LAL" or "GSW @ LAL"
                # -----------------------------
                parts = matchup.split(" ")
                opponent_abbrev = parts[2] if len(parts) == 3 else None
                opp_id = get_team_id_from_abbrev(opponent_abbrev)

                # -----------------------------
                # Injury flag
                # -----------------------------
                if not prev_played:
                    injury_flag = 1  # returning from injury
                else:
                    injury_flag = 0

                # -----------------------------
                # Handle DNP (if MIN is 0 or missing)
                # -----------------------------
                raw_min = row["MIN"]

                if raw_min in ["0", 0, None]:
                    prev_played = False
                    continue
                else:
                    prev_played = True

                # -----------------------------
                # Safe minute conversion
                # -----------------------------
                try:
                    minutes = float(raw_min)
                except:
                    minutes = 0.0

                # -----------------------------
                # Add row to dataset
                # -----------------------------
                rows.append({
                    "player_id": pid,
                    "player_name": pname,
                    "season": season,
                    "game_date": row["GAME_DATE"],
                    "pts": row["PTS"],
                    "min": minutes,
                    "fg_pct": row["FG_PCT"],
                    "home": home,
                    "opponent_id": opp_id,
                    "opp_def_rating": def_ratings.get(opp_id, None),
                    "injury_flag": injury_flag
                })

    df = pd.DataFrame(rows)
    df.to_csv("raw_nba_dataset.csv", index=False)

    print("\n✅ Saved dataset as raw_nba_dataset.csv")
    print(f"Total rows collected: {len(df)}")

    return df


# -----------------------------
# Trigger When Run Directly
# -----------------------------
if __name__ == "__main__":
    print("Building dataset...")
    build_raw_dataset()

