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
  onClose,
  onRemoveLast, // ← შეცვლილი პროპი
  letters // ← დაამატეთ ეს prop
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



        {/* ✅ ასოების ღილაკები */}
        {letters && letters.length > 0 && (
          <div className="letters-row" style={{ marginBottom: 12 }}>
            {letters.map((l, index) => (
              <button
                key={`${l}-${index}`}
                className="letter-btn"
                onClick={() => onWordAdd(l)}
                title="დაამატე ასო წინადადებაში"
              >
                {l}
              </button>
            ))}
            <button
              className="letter-btn"
              onClick={() => onWordAdd(" ")}
              title="ჰარი"
              style={{ minWidth: 36 }}
            >
              
            </button>
            <button
              className="letter-btn"
              onClick={() => onWordAdd(".")}
              title="წერტილი"
              style={{ minWidth: 36 }}
            >
              .
            </button>
            {/* ✅ ბოლოს დამატებული სიმბოლოს წაშლის ღილაკი */}
            <button
              className="letter-btn"
              onClick={onRemoveLast}
              title="ბოლო სიმბოლოს წაშლა"
              style={{ minWidth: 36 }}
              disabled={userSentence.length === 0}
            >
              ⬅️
            </button>
          </div>
        )}




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