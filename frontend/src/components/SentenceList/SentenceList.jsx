import React from "react";
import "./SentenceList.scss";

const SentenceList = ({ 
  sentences, 
  foundSentences, 
  position, 
  onClose,
  sentencesnew 

}) => {
  const remainingSentencesCount = sentences.length - foundSentences.length;
  console.log("SentenceList rendering for position:", position, "with sentences:", sentencesnew);
  return (
    <div className="show-sentences-list">
      <div className="sentences-list-header">
        <span>ტური {position}-ის წინადადებები ({foundSentences.length}/{sentences.length})</span>
        <button className="close-sentences-list" onClick={onClose}>×</button>
      </div>
      <div className="sentences-list-content">
        {sentences.length > 0 ? (
          <div className="sentences-grid">
            {sentences.map((item, idx) => (
              <div
                key={idx}
                className={`sentence-item ${foundSentences.includes(item.sentence) ? 'found' : 'not-found'}`}
              >
                {item.sentence}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-sentences">ამ ტურისთვის წინადადებები არ არის</div>
        )}

        <div className="remaining-info">
          <div className="remaining-count">
            <span className="remaining-label">დარჩენილი:</span>
            <span className="remaining-number">{remainingSentencesCount}</span>
          </div>
          <div className="total-count">
            <span className="total-label">სულ:</span>
            <span className="total-number">{sentences.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentenceList;