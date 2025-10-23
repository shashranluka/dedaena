import React, { useEffect, useState } from "react";
import './LettersPage.scss';

function LettersPage() {
  const [letters, setLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [addedWords, setAddedWords] = useState([]); // დამატებული სიტყვების სია

  useEffect(() => {
    fetch("http://localhost:8000/letters")
      .then((res) => res.json())
      .then((data) => setLetters(data));
  }, []);
 
  console.log(letters)
  const handleLetterClick = (symbol) => {
    setSelectedLetters([...selectedLetters, symbol]);
  };

  const handleClear = () => {
    setSelectedLetters([]);
  };

  // დამატების ღილაკის ფუნქცია
  const handleAdd = () => {
    if (selectedLetters.length === 0) return;
    setAddedWords([...addedWords, selectedLetters.join("")]);
    setSelectedLetters([]);
  };

  // ერთ-ერთი დამატებული სიტყვის წაშლა
  const handleRemoveWord = (idx) => {
    setAddedWords(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="letters-page">
      <h2>ქართული ასოები</h2>
      <div className="board">
        <div className="board-letters">
          {selectedLetters.length > 0 ? (
            <span className="selected-letters">
              {selectedLetters.join("")}
            </span>
          ) : (
            <span className="placeholder-letters">დასაწერად დააჭირე ბარათებს</span>
          )}
        </div>
        {/* ღილაკები გადატანილია ქვემოთ */}
        <div className="board-actions">
          <button
            className="add-btn"
            onClick={handleAdd}
          >
            დამატება
          </button>
          <button
            className="clear-btn"
            onClick={handleClear}
          >
            გასუფთავება
          </button>
        </div>
      </div>
      <div className="letters-list">
        {letters.map((letter, idx) => (
          <div
            className="letter-card"
            key={idx}
            onClick={() => handleLetterClick(letter.symbol)}
          >
            <div className="letter-symbol">{letter.symbol}</div>
            <div className="letter-name">{letter.name}</div>
          </div>
        ))}
      </div>
      {/* დამატებული სიტყვების განყოფილება */}
      {addedWords.length > 0 && (
        <div className="added-words">
          <h4>დამატებული სიტყვები:</h4>
          <div className="added-words-grid">
            {addedWords.map((word, idx) => (
              <div
                key={idx}
                className="added-word-card"
              >
                {word}
                <button
                  onClick={() => handleRemoveWord(idx)}
                  aria-label="წაშლა"
                  className="remove-word-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LettersPage;
