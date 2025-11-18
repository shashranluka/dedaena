import React, { useState } from "react";
import "./TourSentences.scss";

const TourSentences = ({
  currentTourData,
  dedaenaData,
  allPrevWords,
  currentWords,
  currentIndex,
  editingSentences,
  editedTexts,
  onToggleEdit,
  onUpdateText,
  onSave,
  onCancel,
  onOpenWordModal
}) => {
  // ✅ Global state for all words visibility
  const [showAllWords, setShowAllWords] = useState(false);

  if (!currentTourData) return null;

  // ✅ Toggle all words visibility
  const toggleAllWords = () => {
    setShowAllWords(prev => !prev);
  };

  return (
    <div className="tour-sentences">
      {/* ✅ Global Toggle Button */}
      <div className="global-toggle-container">
        <h2>წინადადებები ({currentTourData.letter}/{currentTourData.position})</h2>
        {/* <h3>ტური: {currentTourData.letter} - პოზიცია: {currentTourData.position}</h3> */}
        <button
          className={`btn-toggle-all-words ${showAllWords ? 'active' : ''}`}
          onClick={toggleAllWords}
        >
          {showAllWords ? (
            <>
              <span className="icon">🔼</span>
              <span className="text">ყველა სიტყვის დამალვა</span>
            </>
          ) : (
            <>
              <span className="icon">🔽</span>
              <span className="text">ყველა სიტყვის ჩვენება</span>
            </>
          )}
        </button>
      </div>

      {currentTourData.sentences.map((sentence, sentenceIdx) => {
        const sentenceId = sentence.id || `sentence-${sentenceIdx}`;
        const isEditing = editingSentences.has(sentenceId);

        return (
          <div className="sentence-container" key={sentenceId}>
            <div className="moderation-header">
              <div className="moderation-actions">
                <button 
                  className="btn-edit"
                  onClick={() => onToggleEdit(sentenceId, sentence)}
                  title="რედაქტირება"
                >
                  ✏️
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="edit-mode">
                <textarea
                  className="sentence-editor"
                  value={editedTexts[sentenceId] || sentence}
                  onChange={(e) => onUpdateText(sentenceId, e.target.value)}
                  rows={3}
                />
                <div className="edit-actions">
                  <button className="btn-save" onClick={() => onSave(sentenceId)}>
                    💾 შენახვა
                  </button>
                  <button className="btn-cancel" onClick={() => onCancel(sentenceId)}>
                    ❌ გაუქმება
                  </button>
                </div>
              </div>
            ) : (
              <div className="sentence-card">{sentence}</div>
            )}

            {/* ✅ Words Display - Conditional Rendering */}
            {showAllWords && (
              <div className="words-from-sentence">
                {sentence.split(" ").map((word, idx) => {
                //   const pureWord = word.replace(/[^ა-ჰ]/g, '').toLowerCase();
                  const pureWord = word
                    .replace(/[.,!?;:'"«»()[\]{}<>—–-]/g, '')
                    .replace(/\s+/g, '') // space-ები
                    .toLowerCase();
                  const wordKey = `${sentenceId}-word-${idx}`;

                  // ✅ 1. შემოწმება - არის თუ არა მიმდინარე ტურში
                  const isInCurrentTour = currentWords.some(w => w === pureWord);
                  
                  // ✅ 2. შემოწმება - არის თუ არა წინა ტურებში
                  const foundInPrevTour = allPrevWords.find(item => 
                    item.word === pureWord 
                  );
                  
                  // ✅ 3. Validation Status
                  const validationStatus = isInCurrentTour 
                    ? 'current'
                    : foundInPrevTour 
                    ? 'prev'
                    : 'invalid';
                  
                  // ✅ 4. ტურის ინფო
                  const tourInfo = validationStatus === 'current'
                    ? {
                        number: currentIndex + 1,
                        letter: currentTourData.letter,
                        position: currentTourData.position
                      }
                    : foundInPrevTour
                    ? {
                        number: foundInPrevTour.tourNumber,
                        letter: foundInPrevTour.tourLetter,
                        position: foundInPrevTour.tourPosition
                      }
                    : null;
                  
                  // ✅ 5. საწყისი სიტყვის პოვნა
                  const getOriginalWord = (cleanWord, wordsList) => {
                    const found = wordsList.find(w => {
                      const clean = w.toLowerCase().replace(/-/g, '');
                      return clean === cleanWord || 
                             cleanWord.includes(clean) || 
                             clean.includes(cleanWord);
                    });
                    return found || cleanWord;
                  };
                  
                  // ✅ 6. Tooltip text
                  const tooltipText = validationStatus === 'current'
                    ? `✅ მიმდინარე ტურის სიტყვა (ტური ${tourInfo.number}, ასო: ${tourInfo.letter}): "${getOriginalWord(pureWord, currentTourData.words)}"`
                    : validationStatus === 'prev'
                    ? `◆ წინა ტურის სიტყვა (ტური ${tourInfo.number}, ასო: ${tourInfo.letter}): "${foundInPrevTour.originalWord}"`
                    : '❌ არ არის არც მიმდინარე, არც წინა ტურების სიტყვებში';

                  // ✅ 7. Estimated Tour
                  const estimatedTour = dedaenaData.slice().reverse().find(tour => 
                    pureWord.includes(tour.letter)
                  );

                  return (
                    <div 
                      className={`word ${validationStatus}`} 
                      key={idx}
                      title={tooltipText}
                    >
                      <span className="word-text">{pureWord}</span>
                      
                      <span className="status-icon">
                        {validationStatus === 'current' ? '✓' : 
                         validationStatus === 'prev' ? '◆' : '✗'}
                      </span>

                      {tourInfo && (
                        <span className="tour-badge">
                          ტ{tourInfo.number} ({tourInfo.letter})
                        </span>
                      )}

                      {validationStatus === 'invalid' && estimatedTour && (
                        <div className="word-add-section">
                          <div className="estimated-tour-info">
                            <span className="estimated-tour">
                              🔍 {estimatedTour.letter} (პოზ. {estimatedTour.position})
                            </span>
                          </div>

                          <button
                            className="btn-add-word"
                            onClick={() => onOpenWordModal(wordKey, pureWord, word, estimatedTour)}
                            title={`დაამატე "${pureWord}"`}
                          >
                            ➕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TourSentences;