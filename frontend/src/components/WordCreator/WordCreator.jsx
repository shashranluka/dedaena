import React from "react";
import "./WordCreator.scss";

const WordCreator = ({ 
  letters, 
  selected, 
  foundWords, 
  totalWords, 
  message,
  onLetterClick, 
  onCheck, 
  onClear, 
  onClose 
}) => {
  const remainingWordsCount = totalWords - foundWords.length;

  return (
    <div className="create-words-div">
      <div className="create-words-header">
        <span>შექმენი სიტყვები ({foundWords.length}/{totalWords})</span>
        <button className="close-create-words" onClick={onClose}>×</button>
      </div>

      <p>შექმენი სიტყვები ასოებით: <b>{letters.join(", ")}</b></p>

      <div className="letters-row">
        {letters.map((l, index) => (
          <button
            key={`${l}-${index}`}
            className="letter-btn"
            onClick={() => onLetterClick(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="selected-word">
        {selected.length > 0 ? selected.join("") : <span className="placeholder">დაწერე სიტყვა</span>}
      </div>

      {message && <div className="word-message">{message}</div>}

      <div className="actions">
        <button className="check-btn" onClick={onCheck} disabled={selected.length === 0}>
          შემოწმება
        </button>
        <button className="clear-btn" onClick={onClear} disabled={selected.length === 0}>
          გასუფთავება
        </button>
      </div>

      <div className="remaining-info">
        <div className="remaining-count">
          <span className="remaining-label">დარჩენილი:</span>
          <span className="remaining-number">{remainingWordsCount}</span>
        </div>
        <div className="total-count">
          <span className="total-label">სულ:</span>
          <span className="total-number">{totalWords}</span>
        </div>
      </div>
    </div>
  );
};

export default WordCreator;