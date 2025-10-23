import React, { useState } from "react";
import "./Gogebashvili.scss";

const LETTERS = ["ი", "ა"];
const WORDS = ["ია", "აი", "იი", "აა"]; // შეგიძლია დაამატო სხვა მარტივი კომბინაციებიც

function Gogebashvili() {
  const [selected, setSelected] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [message, setMessage] = useState("");

  const handleLetterClick = (letter) => {
    setSelected([...selected, letter]);
    setMessage("");
  };

  const handleCheck = () => {
    const word = selected.join("");
    if (WORDS.includes(word) && !foundWords.includes(word)) {
      setFoundWords([...foundWords, word]);
      setMessage("სწორია!");
    } else if (foundWords.includes(word)) {
      setMessage("ეს სიტყვა უკვე მოძებნილია!");
    } else {
      setMessage("არასწორი კომბინაცია!");
    }
    setSelected([]);
  };

  const handleClear = () => {
    setSelected([]);
    setMessage("");
  };

  return (
    <div className="gogebashvili-page">
      <h2>გოგებაშვილის დედაენა — პირველი ტური</h2>
      <p>შექმენი სიტყვები ასოებით <b>ი</b> და <b>ა</b>!</p>
      <div className="letters-row">
        {LETTERS.map((l) => (
          <button
            key={l}
            className="letter-btn"
            onClick={() => handleLetterClick(l)}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="selected-word">
        {selected.length > 0 ? selected.join("") : <span className="placeholder">აირჩიე ასოები</span>}
      </div>
      <div className="actions">
        <button className="check-btn" onClick={handleCheck} disabled={selected.length === 0}>
          შემოწმება
        </button>
        <button className="clear-btn" onClick={handleClear} disabled={selected.length === 0}>
          გასუფთავება
        </button>
      </div>
      {message && <div className="message">{message}</div>}
      <div className="found-words">
        <h4>ნაპოვნი სიტყვები:</h4>
        <ul>
          {foundWords.map((w, idx) => (
            <li key={idx}>{w}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Gogebashvili;