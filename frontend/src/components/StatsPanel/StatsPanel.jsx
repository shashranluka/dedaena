import React from "react";
import "./StatsPanel.scss";

const StatsPanel = ({ 
  totalFoundWords, 
  totalFoundSentences,
  currentPosition,
  totalPositions,
  onNextTurn,
  nextTurnDisabled
}) => {
  return (
    <div className="stats-panel">
      <button
        className="next-btn"
        onClick={onNextTurn}
        disabled={nextTurnDisabled}
      >
        შემდეგი ტური {currentPosition < totalPositions ? `(${currentPosition + 1}/${totalPositions})` : ''}
      </button>

      <div className="global-stats">
        <h5>მთლიანი პროგრესი:</h5>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">ნაპოვნი სიტყვები:</span>
            <span className="stat-value">{totalFoundWords}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">ნაპოვნი წინადადებები:</span>
            <span className="stat-value">{totalFoundSentences}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">მიმდინარე ტური:</span>
            <span className="stat-value">{currentPosition}/{totalPositions}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">პროგრესი:</span>
            <span className="stat-value">{Math.round((currentPosition / totalPositions) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;