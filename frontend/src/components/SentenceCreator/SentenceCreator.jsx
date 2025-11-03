import React from "react";
import "./SentenceCreator.scss";

const SentenceCreator = ({ 
  allFoundWords, 
  userSentence, 
  foundSentences, 
  totalSentences, 
  sentenceMessage,
  onWordAdd, 
  onPunctuationAdd,
  onCheck, 
  onClear, 
  onClose 
}) => {
  const remainingSentencesCount = totalSentences - foundSentences.length;

  return (
    <div className="create-sentence-div">
      <div className="create-sentence-header">
        <span>შექმენი წინადადება ({foundSentences.length}/{totalSentences})</span>
        <button className="close-create-sentence" onClick={onClose}>×</button>
      </div>

      <div className="found-words">
        <h4>ნაპოვნი სიტყვები ({allFoundWords.length} სულ ყველა ტურიდან):</h4>
        <div className="words-grid">
          {allFoundWords.map((w, idx) => (
            <button
              key={idx}
              className="word-card"
              onClick={() => onWordAdd(w)}
              title="დაკლიკე წინადადებაში დასამატებლად"
            >
              {w}
            </button>
          ))}
          <button
            className="punctuation-btn"
            onClick={() => onPunctuationAdd(".")}
          >
            .
          </button>
        </div>
      </div>

      <div className="sentence-section">
        <h4>წინადადების შედგენა:</h4>
        <div className="sentence-builder">
          {userSentence.length > 0 ? (
            <div className="sentence-words">
              <span className="sentence-word">
                {userSentence}
              </span>
            </div>
          ) : (
            <div className="sentence-placeholder">
              დააკლიკე ნაპოვნ სიტყვებს წინადადების შესადგენად
            </div>
          )}
        </div>

        <div className="sentence-actions">
          <button
            className="check-sentence-btn"
            onClick={onCheck}
            disabled={userSentence.length === 0}
          >
            წინადადების შემოწმება
          </button>
          <button
            className="clear-sentence-btn"
            onClick={onClear}
            disabled={userSentence.length === 0}
          >
            წინადადების გასუფთავება
          </button>
        </div>
      </div>

      {sentenceMessage && <div className="sentence-message">{sentenceMessage}</div>}

      <div className="remaining-info">
        <div className="remaining-count">
          <span className="remaining-label">დარჩენილი:</span>
          <span className="remaining-number">{remainingSentencesCount}</span>
        </div>
        <div className="total-count">
          <span className="total-label">სულ:</span>
          <span className="total-number">{totalSentences}</span>
        </div>
      </div>
    </div>
  );
};

export default SentenceCreator;