import React from "react";
import "./TableOfContents.scss";

const TableOfContents = ({ 
  staticData, 
  position, 
  foundWordsByPosition, 
  foundSentencesByPosition, 
  onCardClick, 
  onClose 
}) => {
  return (
    <div className="alphabet-cards-full">
      <div className="alphabet-header">
        <span>აირჩიე ტური</span>
        <button className="close-alphabet" onClick={onClose}>×</button>
      </div>
      <div className="alphabet-cards">
        {staticData.map((pageInfo, idx) => {
          const positionFoundWords = foundWordsByPosition[idx + 1] || [];
          const positionFoundSentences = foundSentencesByPosition[idx + 1] || [];
          
          return (
            <div
              key={idx}
              className={`alphabet-card ${idx < position ? 'learned' : 'unlearned'} ${idx + 1 === position ? 'current' : ''}`}
              onClick={() => onCardClick(idx + 1)}
              title={`ტური ${idx + 1} - ${pageInfo.letter} (სიტყვები: ${positionFoundWords.length}, წინადადებები: ${positionFoundSentences.length})`}
            >
              <span className="card-letter">{pageInfo.letter}</span>
              <span className="card-position">{idx + 1}</span>

              <div className="card-content">
                <div className="content-dot words">
                  <span className="icon">🔤</span>
                  <span className="count">{pageInfo.word_count || 0}</span>
                </div>
                <div className="content-dot sentences">
                  <span className="icon">📝</span>
                  <span className="count">{pageInfo.sentence_count || 0}</span>
                </div>
              </div>

              <div className="card-content">
                <div className={`content-dot proverbs ${pageInfo.has_proverbs ? 'available' : 'unavailable'}`}>
                  <span className="icon">💡</span>
                  {pageInfo.has_proverbs && <span className="prize">📜</span>}
                </div>
                <div className={`content-dot reading ${pageInfo.has_reading ? 'available' : 'unavailable'}`}>
                  <span className="icon">📖</span>
                  {pageInfo.has_reading && <span className="prize">📖</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TableOfContents;