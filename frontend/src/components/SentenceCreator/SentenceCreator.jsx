import React from "react";
import "./SentenceCreator.scss";

const SentenceCreator = ({
  allFoundWords,
  userSentence,
  foundSentences,
  totalSentences,
  sentenceMessage,
  sentenceMessageKey,
  sentenceMessageType, // ✅ ახალი prop
  onWordAdd,
  onPunctuationAdd,
  onCheck,
  onClear,
  onClose,
  onRemoveLast,
  letters,
  position,
  setPosition
}) => {
  const remainingSentencesCount = totalSentences - foundSentences.length;

  return (
    <div className="create-sentence-div">
      <div className="create-sentence-header">
        <span>შექმენი წინადადება ({foundSentences.length}/{totalSentences})</span>
        <button className="next-quest" onClick={()=>setPosition(position+1)}>შემდეგი ქვესტი</button>
        {/* <button className="close-create-sentence" onClick={onClose}>×</button> */}
      </div>

      <div className="sentence-section">
        <div className="sentence-builder">
          {userSentence.length > 0 ? (
            <div className="sentence-words">
              <span className="sentence-word">
                {userSentence}
              </span>
            </div>
          ) : (
            <div className="sentence-placeholder">
              წინადადების შესადგენად დააკლიკე ასოების ბარათებს
            </div>
          )}
          
          {/* ✅ შეტყობინება უნიკალური key-ით და ტიპით */}
          {sentenceMessage && (
            <div 
              key={sentenceMessageKey}
              className={`sentence-message-overlay sentence-message-fadeout ${sentenceMessageType || 'success'}`}
            >
              {sentenceMessage}
            </div>
          )}
        </div>

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
          </div>
        )}
        
        <div className="signs">
          <button
            className="sign-btn"
            onClick={() => onWordAdd(" ")}
            title="ჰარი"
            style={{ minWidth: 100 }}
          >
          </button>
          <button
            className="sign-btn"
            onClick={() => onWordAdd(".")}
            title="წერტილი"
            style={{ minWidth: 36 }}
          >
            .
          </button>
          <button
            className="sign-btn"
            onClick={() => onWordAdd(",")}
            title="მძიმე"
            style={{ minWidth: 36 }}
          >
            ,
          </button>
          <button
            className="sign-btn"
            onClick={onRemoveLast}
            title="ბოლო სიმბოლოს წაშლა"
            style={{ minWidth: 36 }}
            disabled={userSentence.length === 0}
          >
            ⬅️
          </button>
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

      {/* <div className="remaining-info">
        <div className="remaining-count">
          <span className="remaining-label">დარჩენილი:</span>
          <span className="remaining-number">{remainingSentencesCount}</span>
        </div>
        <div className="total-count">
          <span className="total-label">სულ:</span>
          <span className="total-number">{totalSentences}</span>
        </div>
      </div> */}
    </div>
  );
};

export default SentenceCreator;