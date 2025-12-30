import React, { useState, useEffect } from 'react';
import GameCard from './GameCard';
import './Results.css';

const Results = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/games`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setGames(data || []);
    } catch (err) {
      console.error('Failed to fetch games:', err);
      setError('Failed to load games. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const groupGamesByDate = (gamesData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const groups = {
      yesterday: [],
      today: [],
      upcoming: []
    };

    gamesData.forEach(game => {
      const gameDate = new Date(game.start_time_utc);
      gameDate.setHours(0, 0, 0, 0);
      
      const gameTime = gameDate.getTime();
      const todayTime = today.getTime();
      const yesterdayTime = yesterday.getTime();
      const tomorrowTime = tomorrow.getTime();

      if (gameTime === yesterdayTime) {
        groups.yesterday.push(game);
      } else if (gameTime === todayTime) {
        groups.today.push(game);
      } else if (gameTime >= tomorrowTime) {
        groups.upcoming.push(game);
      }
    });

    return groups;
  };

  const renderSkeletonLoaders = () => {
    return (
      <div className="results-section">
        <h2 className="results-date-header">Loading...</h2>
        <div className="games-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="game-card skeleton-card">
              <div className="skeleton-line skeleton-team"></div>
              <div className="skeleton-line skeleton-score"></div>
              <div className="skeleton-line skeleton-team"></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="results-page">
        <div className="results-container">
          <div className="results-header">
            <h1>NBA Games & Results</h1>
            <p className="results-subtitle">Live scores, final results, and upcoming matches</p>
          </div>
          {renderSkeletonLoaders()}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-page">
        <div className="results-container">
          <div className="results-header">
            <h1>NBA Games & Results</h1>
          </div>
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p className="error-message">{error}</p>
            <button className="btn-retry" onClick={fetchGames}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const groupedGames = groupGamesByDate(games);
  const hasAnyGames = games.length > 0;

  return (
    <div className="results-page">
      <div className="results-container">
        <div className="results-header">
          <h1>NBA Games & Results</h1>
          <p className="results-subtitle">Live scores, final results, and upcoming matches</p>
          <button className="btn-refresh" onClick={fetchGames}>
            🔄 Refresh
          </button>
        </div>

        {!hasAnyGames ? (
          <div className="empty-state">
            <div className="empty-icon">🏀</div>
            <h2>No Games Available</h2>
            <p>There are no games scheduled for the selected dates.</p>
          </div>
        ) : (
          <>
            {/* Yesterday's Games */}
            {groupedGames.yesterday.length > 0 && (
              <div className="results-section">
                <h2 className="results-date-header">Yesterday's Final Games</h2>
                <div className="games-grid">
                  {groupedGames.yesterday.map(game => (
                    <GameCard key={game.game_id} game={game} />
                  ))}
                </div>
              </div>
            )}

            {/* Today's Games */}
            {groupedGames.today.length > 0 && (
              <div className="results-section">
                <h2 className="results-date-header">Today's Games</h2>
                <div className="games-grid">
                  {groupedGames.today.map(game => (
                    <GameCard key={game.game_id} game={game} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Games */}
            {groupedGames.upcoming.length > 0 && (
              <div className="results-section">
                <h2 className="results-date-header">Upcoming Games</h2>
                <div className="games-grid">
                  {groupedGames.upcoming.map(game => (
                    <GameCard key={game.game_id} game={game} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Results;
