import React from "react";
import "./WordsList.scss";

const WordsList = ({ 
  words, 
  foundWords, 
  position, 
  onClose 
}) => {
  const remainingWordsCount = words.length - foundWords.length;

  return (
    <div className="current-words-list">
      <div className="words-list-header">
        <span>ტური {position}-ის სიტყვები ({foundWords.length}/{words.length})</span>
        <button className="close-words-list" onClick={onClose}>×</button>
      </div>
      <div className="words-list-content">
        {words.length > 0 ? (
          <div className="words-grid">
            {words.map((word, idx) => (
              <div
                key={idx}
                className={`word-item ${foundWords.includes(word) ? 'found' : 'not-found'}`}
              >
                {word}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-words">ამ ტურისთვის სიტყვები არ არის</div>
        )}

        <div className="remaining-info">
          <div className="remaining-count">
            <span className="remaining-label">დარჩენილი:</span>
            <span className="remaining-number">{remainingWordsCount}</span>
          </div>
          <div className="total-count">
            <span className="total-label">სულ:</span>
            <span className="total-number">{words.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordsList;