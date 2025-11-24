import React, { useState } from "react";
import "./TourSentences.scss";
import ModeratorSentence from "../ModeratorSentence/ModeratorSentence"; // ✅ 1. Import the new component

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
  onOpenWordModal,
  handleSaveWord,
  addWordRelevantTour,
}) => {
  const [showAllWords, setShowAllWords] = useState(false);

  if (!currentTourData) return null;

  const toggleAllWords = () => {
    setShowAllWords(prev => !prev);
  };

  return (
    <div className="tour-sentences">
      <div className="global-toggle-container">
        <h2>წინადადებები ({currentTourData.letter}/{currentTourData.position})</h2>
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
        
        // ✅ 2. Use the new ModeratorSentence component
        return (
          <ModeratorSentence
            key={sentenceId}
            sentence={sentence}
            sentenceId={sentenceId}
            isEditing={editingSentences.has(sentenceId)}
            editedTexts={editedTexts}
            showAllWords={showAllWords}
            currentWords={currentWords}
            allPrevWords={allPrevWords}
            currentIndex={currentIndex}
            currentTourData={currentTourData}
            dedaenaData={dedaenaData}
            onToggleEdit={onToggleEdit}
            onUpdateText={onUpdateText}
            onSave={onSave}
            onCancel={onCancel}
            onOpenWordModal={onOpenWordModal}
            handleSaveWord={handleSaveWord}
            addWordRelevantTour={addWordRelevantTour}
          />
        );
      })}
    </div>
  );
};

export default TourSentences;