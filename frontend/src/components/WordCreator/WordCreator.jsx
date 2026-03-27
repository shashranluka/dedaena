import React, { useEffect, useMemo, useState } from "react";
import "./WordCreator.scss";


const WordCreator = ({ 
  letters, 
  selected, 
  foundWords, 
  totalWords, 
  message,
  isSoundEnabled,
  onLetterClick, 
  onCheck, 
  onClear, 
  onClose,
  showPicture,
  pictureUrl,
  onPictureClose,
  showVowelChallenge,
  vowelChallengeWord,
  onVowelChallengeComplete
}) => {
  console.log("Rendering WordCreator with letters:", letters, "selected:", selected, "foundWords:", foundWords, "totalWords:", totalWords);
  const remainingWordsCount = totalWords - foundWords.length;
  const messageType = message?.includes("სწორია")
    ? "success"
    : message?.includes("უკვე")
      ? "warning"
      : "error";
  const isInputEmpty = selected.length === 0;
  const [clickedVowelIndexes, setClickedVowelIndexes] = useState([]);

  const VOWELS = useMemo(() => new Set(["ა", "ე", "ი", "ო", "უ"]), []);
  const challengeLetters = useMemo(() => (vowelChallengeWord || "").split(""), [vowelChallengeWord]);
  const requiredVowelIndexes = useMemo(
    () => challengeLetters.map((letter, index) => (VOWELS.has(letter) ? index : null)).filter((value) => value !== null),
    [challengeLetters, VOWELS]
  );
  const isVowelChallengeComplete = requiredVowelIndexes.length > 0
    && requiredVowelIndexes.every((index) => clickedVowelIndexes.includes(index));

  useEffect(() => {
    if (showVowelChallenge) {
      setClickedVowelIndexes([]);
    }
  }, [showVowelChallenge, vowelChallengeWord]);

  // Sound effect for letter click (like SentenceCreator)
  const playLetterSound = (letter) => {
    const audio = new Audio(`/audio/letters/${letter}.mp3`);
    audio.play().catch(err => console.log('Audio play failed:', err));
  };

  const playActionSound = (soundType) => {
    if (!isSoundEnabled) return;

    const soundFiles = {
      clear: '/sounds/testclear.mp3'
    };

    const audio = new Audio(soundFiles[soundType]);
    audio.play().catch(err => console.log('Audio play failed:', err));
  };

  const handleRemoveLast = () => {
    if (selected.length === 0) return;

    // playActionSound('clear');
    const updated = selected.slice(0, -1);
    onClear();
    updated.forEach((letter) => onLetterClick(letter));
  };

  const handleClearWithSound = () => {
    if (selected.length === 0) return;
    playActionSound('clear');
    onClear();
  };

  const handleVowelCardClick = (letter, index) => {
    if (isSoundEnabled) {
      const soundPath = VOWELS.has(letter) ? '/sounds/testsuccess.mp3' : '/sounds/testerror.mp3';
      const audio = new Audio(soundPath);
      audio.play().catch(err => console.log('Audio play failed:', err));
    }

    if (!VOWELS.has(letter)) {
      return;
    }

    setClickedVowelIndexes((prev) => {
      if (prev.includes(index)) {
        return prev;
      }
      return [...prev, index];
    });
  };

  return (
    <div className="create-words-div">
      {/* სურათის მოდალი თუ showPicture === true და pictureUrl არის */}
      {showVowelChallenge && vowelChallengeWord && (
        <div className="vowel-challenge-overlay">
          <div className="vowel-challenge-modal">
            <h3>იპოვე ხმოვნები</h3>
            <p>დააჭირე სიტყვის ხმოვნებს:</p>

            <div className="vowel-challenge-word" role="group" aria-label="სიტყვის ასოები">
              {challengeLetters.map((letter, index) => {
                const isVowel = VOWELS.has(letter);
                const isSelected = clickedVowelIndexes.includes(index);
                return (
                  <button
                    key={`${letter}-${index}`}
                    type="button"
                    className={`vowel-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleVowelCardClick(letter, index)}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="continue-to-picture-btn"
              onClick={onVowelChallengeComplete}
              disabled={!isVowelChallengeComplete}
            >
              სურათის ნახვა
            </button>
          </div>
        </div>
      )}

      {showPicture && pictureUrl && (
        <div className="word-picture-modal-overlay">
          <div className="word-picture-modal">
            <img className="word-picture-img" src={pictureUrl} alt="სიტყვის სურათი" />
            <button className="close-picture-btn" onClick={onPictureClose}>დახურვა</button>
          </div>
        </div>
      )}
      {/* <div className="create-words-header">
        <span>შექმენი სიტყვები ({foundWords.length}/{totalWords})</span>
        <button className="close-create-words" onClick={onClose}>×</button>
      </div>

      <p>შექმენი სიტყვები ასოებით: <b>{letters.join(", ")}</b></p> */}

      <div className="word-section">
        <div className="word-builder">
          <div className="selected-word">
            {selected.length > 0 ? selected.join("") : <span className="placeholder">დაწერე სიტყვა</span>}
          </div>

          {message && <div className={`word-message word-message-fadeout ${messageType}`}>{message}</div>}
        </div>

        <div className="actions">
          <button
            className="delete-btn"
            onClick={handleRemoveLast}
            title="Backspace - წაშლა ბოლო სიმბოლოს"
            aria-label="წაშალე ბოლო სიმბოლო"
            disabled={isInputEmpty}
          >
            ⬅️
          </button>
          <button
            className="clear-btn"
            onClick={handleClearWithSound}
            aria-label="გაასუფთავე დაფა"
            disabled={isInputEmpty}
          >
            🗑️
          </button>
          <button
            className="check-btn"
            onClick={onCheck}
            aria-label="შეამოწმე სიტყვა"
            disabled={isInputEmpty}
          >
            ✓
          </button>
        </div>

        <div className="letters-row">
          {letters.map((l, index) => (
            <button
              key={`${l}-${index}`}
              className="letter-btn"
              onClick={() => {
                onLetterClick(l);
                playLetterSound(l);
              }}
            >
              {l}
            </button>
          ))}
        </div>
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