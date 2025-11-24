import React, { useState } from 'react';
import './ModeratorSentence.scss';

const ModeratorSentence = ({
  sentence,
  sentenceId,
  isEditing,
  editedTexts,
  showAllWords,
  currentWords,
  allPrevWords,
  currentIndex,
  currentTourData,
  dedaenaData,
  onToggleEdit,
  onUpdateText,
  onSave,
  onCancel,
//   onOpenWordModal,
//   handleSaveWord,
  addWordRelevantTour,
}) => {
  // ✅ State to manage which word is being added inline
  const [addingWordKey, setAddingWordKey] = useState(null);
  // ✅ State now holds the value of the word to be added
  const [newWordValue, setNewWordValue] = useState('');

  // ✅ Handler to show the inline form and pre-fill with pureWord
  const handleStartAdd = (wordKey, initialWord) => {
    setAddingWordKey(wordKey);
    setNewWordValue(initialWord); // ✅ Set the initial value from pureWord
  };

  // ✅ Handler to cancel the inline form
  const handleCancelAdd = () => {
    setAddingWordKey(null);
    setNewWordValue('');
  };

  // ✅ Handler to confirm and save the word
  const handleConfirmAdd = (originalWord, estimatedTour) => {
    if (addWordRelevantTour) {
      // ✅ Pass the (potentially edited) value from the input
      addWordRelevantTour(newWordValue, originalWord, estimatedTour, ''); // Part of speech is now empty
    }
    handleCancelAdd(); // Close the form after submission
  };

  return (
    <div className="sentence-container">
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
            autoFocus
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

      {/* {showAllWords && ( */}
        <div className="words-from-sentence">
          {sentence.split(" ").map((word, idx) => {
            if (!word.trim()) return null;

            const pureWord = word
              .replace(/[.,!?;:'"«»()[\]{}<>—–-]/g, '')
              .replace(/\s+/g, '')
              .toLowerCase();
            
            if (!pureWord) return null;

            const wordKey = `${sentenceId}-word-${idx}`;
            const isInCurrentTour = currentWords.some(w => w === pureWord);
            const foundInPrevTour = allPrevWords.find(item => item.word === pureWord);
            const validationStatus = isInCurrentTour ? 'current' : foundInPrevTour ? 'prev' : 'invalid';
            
            const tourInfo = validationStatus === 'current'
              ? { number: currentIndex + 1, letter: currentTourData.letter, position: currentTourData.position }
              : foundInPrevTour
              ? { number: foundInPrevTour.tourNumber, letter: foundInPrevTour.tourLetter, position: foundInPrevTour.tourPosition }
              : null;
            
            const getOriginalWord = (cleanWord, wordsList) => {
              const found = wordsList.find(w => {
                const clean = w.toLowerCase().replace(/-/g, '');
                return clean === cleanWord || cleanWord.includes(clean) || clean.includes(cleanWord);
              });
              return found || cleanWord;
            };
            
            const tooltipText = validationStatus === 'current'
              ? `✅ მიმდინარე ტურის სიტყვა (ტური ${tourInfo.number}, ასო: ${tourInfo.letter}): "${getOriginalWord(pureWord, currentTourData.words)}"`
              : validationStatus === 'prev'
              ? `◆ წინა ტურის სიტყვა (ტური ${tourInfo.number}, ასო: ${tourInfo.letter}): "${foundInPrevTour.originalWord}"`
              : '❌ არ არის არც მიმდინარე, არც წინა ტურების სიტყვებში';

            const estimatedTour = dedaenaData.slice().reverse().find(tour => pureWord.includes(tour.letter));
            
            const isAddingThisWord = addingWordKey === wordKey;

            return (
              <div className={`word ${validationStatus}`} key={idx} title={tooltipText}>
                <span className="word-text">{pureWord}</span>
                <span className="status-icon">
                  {validationStatus === 'current' ? '✓' : validationStatus === 'prev' ? '◆' : '✗'}
                </span>
                {tourInfo && (
                  <span className="tour-badge">
                    ტ{tourInfo.number} ({tourInfo.letter})
                  </span>
                )}
                {validationStatus === 'invalid' && estimatedTour && (
                  <>
                    {isAddingThisWord ? (
                      // ✅ INLINE ADD FORM
                      <div className="inline-add-form">
                        <input
                          type="text"
                          className="pos-input"
                          placeholder="სიტყვა"
                          value={newWordValue} // ✅ Bind to newWordValue
                          onChange={(e) => setNewWordValue(e.target.value)} // ✅ Update newWordValue
                          autoFocus
                        />
                        <div className="inline-actions">
                          <button 
                            className="btn-confirm-add"
                            onClick={() => handleConfirmAdd(word, estimatedTour)}
                          >
                            ✓
                          </button>
                          <button 
                            className="btn-cancel-add"
                            onClick={handleCancelAdd}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      // ✅ ORIGINAL ADD BUTTON
                      <div className="word-add-section">
                        <div className="estimated-tour-info">
                          <span className="estimated-tour">
                            🔍 {estimatedTour.letter} (პოზ. {estimatedTour.position})
                          </span>
                        </div>
                        <button
                          className="btn-add-word"
                          onClick={() => handleStartAdd(wordKey, pureWord)} // ✅ Pass pureWord here
                          title={`დაამატე "${pureWord}"`}
                        >
                          ➕
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      {/* )} */}
    </div>
  );
};

export default ModeratorSentence;