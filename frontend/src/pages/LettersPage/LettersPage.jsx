import React, { useEffect, useState } from "react";
import './LettersPage.scss';

function LettersPage() {
  const [letters, setLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/letters")
      .then((res) => res.json())
      .then((data) => setLetters(data));
  }, []);

  const handleLetterClick = (symbol) => {
    setSelectedLetters([...selectedLetters, symbol]);
  };

  const handleClear = () => {
    setSelectedLetters([]);
  };

  return (
    <div className="letters-page">
      <h2>ქართული ასოები</h2>
      <div className="board">
        <div className="board-letters">
          {selectedLetters.length > 0 ? (
            <span style={{ fontSize: "32px", fontWeight: "bold" }}>
              {selectedLetters.join("")}
            </span>
          ) : (
            <span style={{ color: "#aaa" }}>აქ გამოჩნდება ასოები</span>
          )}
        </div>
        <button className="clear-btn" onClick={handleClear} style={{ marginLeft: "16px", padding: "6px 16px", fontSize: "16px" }}>გასუფთავება</button>
      </div>
      <div className="letters-list">
        {letters.map((letter, idx) => (
          <div className="letter-card" key={idx} onClick={() => handleLetterClick(letter.symbol)} style={{ cursor: "pointer" }}>
            <div className="letter-symbol">{letter.symbol}</div>
            <div className="letter-name">{letter.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LettersPage;
