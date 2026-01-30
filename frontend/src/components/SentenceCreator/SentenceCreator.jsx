import React, { useState, useEffect } from "react";
import "./SentenceCreator.scss";

/**
 * წინადადებების შემქმნელი კომპონენტი
 * საშუალებას აძლევს მომხმარებელს შექმნას წინადადებები ასოებისა და სასვენი ნიშნების გამოყენებით
 * 
 * @param {Array} allFoundWords - ყველა ნაპოვნი სიტყვა
 * @param {string} userSentence - მომხმარებლის მიერ შედგენილი წინადადება
 * @param {Array} foundSentences - უკვე ნაპოვნი წინადადებები
 * @param {number} totalSentences - სულ წინადადებების რაოდენობა
 * @param {string} sentenceMessage - შეტყობინება წინადადების შემოწმების შემდეგ
 * @param {number} sentenceMessageKey - უნიკალური key შეტყობინების რე-რენდერისთვის
 * @param {string} sentenceMessageType - შეტყობინების ტიპი (success/error/warning)
 * @param {boolean} isSoundEnabled - ხმის ჩართვის სტატუსი
 * @param {Function} onWordAdd - ფუნქცია სიმბოლოს დასამატებლად
 * @param {Function} onPunctuationAdd - ფუნქცია სასვენი ნიშნის დასამატებლად
 * @param {Function} onCheck - ფუნქცია წინადადების შესამოწმებლად
 * @param {Function} onClear - ფუნქცია წინადადების გასასუფთავებლად
 * @param {Function} onClose - ფუნქცია კომპონენტის დასახურად
 * @param {Function} onRemoveLast - ფუნქცია ბოლო სიმბოლოს წასაშლელად
 * @param {Array} letters - ასოების სია
 * @param {number} position - მიმდინარე ტურის ნომერი
 * @param {Function} setPosition - ფუნქცია ტურის შესაცვლელად
 */
const SentenceCreator = ({
  allFoundWords,
  userSentence,
  foundSentences,
  totalSentences,
  sentenceMessage,
  sentenceMessageKey,
  sentenceMessageType,
  isSoundEnabled,
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
  // დარჩენილი წინადადებების რაოდენობის გამოთვლა
  const remainingSentencesCount = totalSentences - foundSentences.length;

  // ასოს ხმის დაკვრის ფუნქცია
  const playLetterSound = (letter) => {
    if (!isSoundEnabled) return;
    const audio = new Audio(`/audio/letters/${letter}.mp3`);
    audio.play().catch(err => console.log('Audio play failed:', err));
  };

  // კლავიატურიდან აკრეფის ფუნქციონალი
  useEffect(() => {
    const handleKeyPress = (event) => {
      // თავიდან აცილება ძირითადი ინპუტებისთვის
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = event.key;

      // ასოების დამუშავება
      if (letters && letters.includes(key)) {
        event.preventDefault();
        onWordAdd(key);
        playLetterSound(key);
        return;
      }

      // სასვენი ნიშნები და სპეციალური ღილაკები
      switch (key) {
        case ' ':
          event.preventDefault();
          onWordAdd(' ');
          break;
        case '.':
        case ',':
        case '!':
        case '?':
          event.preventDefault();
          onWordAdd(key);
          break;
        case 'Backspace':
          if (!isInputEmpty) {
            event.preventDefault();
            onRemoveLast();
          }
          break;
        case 'Enter':
          if (!isInputEmpty) {
            event.preventDefault();
            onCheck();
          }
          break;
        case 'Escape':
          if (!isInputEmpty) {
            event.preventDefault();
            handleClearWithSound();
          }
          break;
        default:
          break;
      }
    };
    console.log("Attaching keydown listener");
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [letters,  isSoundEnabled, onWordAdd, onRemoveLast, onCheck, userSentence]);



  // დაფის გასუფთავება ხმით
  const handleClearWithSound = () => {
    if (isSoundEnabled) {
      const audio = new Audio('/sounds/testclear.mp3');
      audio.play().catch(err => console.log('Audio play failed:', err));
    }
    onClear();
  };

  // ღილაკების disabled სტატუსი
  const isInputEmpty = userSentence.length === 0;

  return (
    <div className="create-sentence-div">
      {/* ჰედერი - სათაური */}
      {/* <div className="create-sentence-header">
        <span>
          შექმენი წინადადება ({foundSentences.length}/{totalSentences})
        </span>
      </div> */}


      {/* მთავარი სექცია */}
      <div className="sentence-section">
        {/* წინადადების კონსტრუქტორი */}
        <div className="sentence-builder">
          {userSentence.length > 0 ? (
            <div className="sentence-words">
              <span className="sentence-word">
                {userSentence}
                <span className="cursor-blink">|</span>
              </span>
            </div>
          ) : (
            <div className="sentence-placeholder">
              წინადადების შესადგენად დააკლიკე ასოებისა და სასვენ ნიშნების ბარათებს.
            </div>
          )}
          {/* შეტყობინებების overlay */}
          {sentenceMessage && (
            <div 
              key={sentenceMessageKey}
              className={`sentence-message-overlay sentence-message-fadeout ${sentenceMessageType || 'success'}`}
            >
              {sentenceMessage}
            </div>
          )}
        </div>

        {/* ასოების ზოლი */}
        {letters && letters.length > 0 && (
          <div className="letters-row">
            {letters.map((letter, index) => (
              <button
                key={`${letter}-${index}`}
                className="letter-btn"
                onClick={() => {
                  onWordAdd(letter);
                  playLetterSound(letter);
                }}
                title={`დაამატე ასო "${letter}" წინადადებაში`}
                aria-label={`დაამატე ასო ${letter}`}
              >
                {letter}
              </button>
            ))}
          </div>
        )}
        
        {/* სასვენი ნიშნები და კონტროლები */}
        <div className="signs">
          <button
            className="sign-btn space-btn"
            onClick={() => onWordAdd(" ")}
            title="ადგილის გამოტოვება"
            aria-label="დაამატე ჰარი"
          >
            <span className="space-text">ჰარი</span>
          </button>
          <button
            className="sign-btn"
            onClick={() => onWordAdd(".")}
            title="წერტილი"
            aria-label="დაამატე წერტილი"
          >
            .
          </button>
          <button
            className="sign-btn"
            onClick={() => onWordAdd(",")}
            title="მძიმე"
            aria-label="დაამატე მძიმე"
          >
            ,
          </button>
          <button
            className="sign-btn"
            onClick={() => onWordAdd("!")}
            title="ძახილის ნიშანი"
            aria-label="დაამატე ძახილის ნიშანი"
          >
            !
          </button>
          <button
            className="sign-btn"
            onClick={() => onWordAdd("?")}
            title="კითხვის ნიშანი"
            aria-label="დაამატე კითხვის ნიშანი"
          >
            ?
          </button>
          <button
            className="sign-btn delete-btn"
            onClick={onRemoveLast}
            title="ბოლო სიმბოლოს წაშლა"
            aria-label="წაშალე ბოლო სიმბოლო"
            disabled={isInputEmpty}
          >
            ⬅️
          </button>
        </div>

        {/* მოქმედების ღილაკები */}
        <div className="sentence-actions">
          <button
            className="check-sentence-btn"
            onClick={onCheck}
            disabled={isInputEmpty}
            aria-label="შეამოწმე წინადადება"
          >
            ✓ წინადადების შემოწმება
          </button>
          <button
            className="clear-sentence-btn"
            onClick={handleClearWithSound}
            disabled={isInputEmpty}
            aria-label="გაასუფთავე დაფა"
          >
            🗑️ დაფის გასუფთავება
          </button>
        </div>
      </div>
    </div>
  );
};

export default SentenceCreator;