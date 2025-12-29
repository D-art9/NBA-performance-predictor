import React from 'react';

const GameCard = ({ game }) => {
  const {
    home_team,
    away_team,
    home_score,
    away_score,
    status,
    start_time_utc
  } = game;

  // Convert UTC time to local time
  const getLocalTime = (utcTime) => {
    if (!utcTime) return 'TBD';
    const date = new Date(utcTime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getLocalDate = (utcTime) => {
    if (!utcTime) return '';
    const date = new Date(utcTime);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Determine game status display
  const getStatusDisplay = () => {
    if (!status) return 'Scheduled';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('final')) return 'Final';
    if (statusLower.includes('ot')) return status;
    if (statusLower.includes('live') || statusLower.includes('q')) return status;
    if (statusLower.includes('scheduled')) return 'Scheduled';
    return status;
  };

  const isFinal = status && status.toLowerCase().includes('final');
  const isLive = status && (status.toLowerCase().includes('live') || status.toLowerCase().includes('q'));
  const isScheduled = !isFinal && !isLive;

  // Get status badge class
  const getStatusClass = () => {
    if (isFinal) return 'status-final';
    if (isLive) return 'status-live';
    return 'status-scheduled';
  };

  // Team logo placeholder (using team abbreviation)
  const getTeamLogo = (teamName) => {
    // Simple abbreviation logic - take first 3 letters
    const abbr = teamName ? teamName.substring(0, 3).toUpperCase() : '???';
    return (
      <div className="team-logo-placeholder">
        {abbr}
      </div>
    );
  };

  return (
    <div className="game-card">
      <div className="game-card-header">
        <span className={`game-status ${getStatusClass()}`}>
          {getStatusDisplay()}
        </span>
        <span className="game-time">
          {isScheduled ? getLocalTime(start_time_utc) : getLocalDate(start_time_utc)}
        </span>
      </div>

      <div className="game-matchup">
        {/* Away Team */}
        <div className="team-row">
          <div className="team-info">
            {getTeamLogo(away_team)}
            <span className="team-name">{away_team || 'TBD'}</span>
          </div>
          <span className="team-score">
            {!isScheduled && away_score !== null && away_score !== undefined 
              ? away_score 
              : '-'}
          </span>
        </div>

        <div className="matchup-divider">@</div>

        {/* Home Team */}
        <div className="team-row">
          <div className="team-info">
            {getTeamLogo(home_team)}
            <span className="team-name">{home_team || 'TBD'}</span>
          </div>
          <span className="team-score">
            {!isScheduled && home_score !== null && home_score !== undefined 
              ? home_score 
              : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
