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
  // cursor-ის პოზიცია წინადადებაში
  const [cursorPosition, setCursorPosition] = useState(0);

  // დარჩენილი წინადადებების რაოდენობის გამოთვლა
  const remainingSentencesCount = totalSentences - foundSentences.length;
  const isInputEmpty = userSentence.length === 0;

  // cursor-ის პოზიციის სინქრონიზაცია userSentence-თან
  useEffect(() => {
    // თუ წინადადება გასუფთავდა, cursor-იც დაბრუნდეს საწყის პოზიციაზე
    if (userSentence.length === 0) {
      setCursorPosition(0);
    } else if (cursorPosition > userSentence.length) {
      // თუ cursor არის წინადადების სიგრძეზე მეტ პოზიციაზე, დააბრუნე ბოლოში
      setCursorPosition(userSentence.length);
    }
  }, [userSentence.length]);

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
        handleCharacterAdd(key);
        playLetterSound(key);
        return;
      }

      // სასვენი ნიშნები და სპეციალური ღილაკები
      switch (key) {
        case ' ':
          event.preventDefault();
          handleCharacterAdd(' ');
          break;
        case '.':
        case ',':
        case '!':
        case '?':
          event.preventDefault();
          handleCharacterAdd(key);
          break;
        case 'Backspace':
          if (!isInputEmpty && cursorPosition > 0) {
            event.preventDefault();
            handleBackspace();
          }
          break;
        case 'Delete':
          if (!isInputEmpty && cursorPosition < userSentence.length) {
            event.preventDefault();
            handleDelete();
          }
          break;
        case 'ArrowLeft':
          if (cursorPosition > 0) {
            event.preventDefault();
            setCursorPosition(cursorPosition - 1);
          }
          break;
        case 'ArrowRight':
          if (cursorPosition < userSentence.length) {
            event.preventDefault();
            setCursorPosition(cursorPosition + 1);
          }
          break;
        case 'Home':
          event.preventDefault();
          setCursorPosition(0);
          break;
        case 'End':
          event.preventDefault();
          setCursorPosition(userSentence.length);
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
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [letters, isInputEmpty, isSoundEnabled, userSentence, cursorPosition]);

  // სიმბოლოს დამატება cursor-ის პოზიციაზე
  const handleCharacterAdd = (char) => {
    const before = userSentence.slice(0, cursorPosition);
    const after = userSentence.slice(cursorPosition);
    const newSentence = before + char + after;
    
    // განვაახლოთ parent-ის state მთელი წინადადებით
    onClear(); // ჯერ გავასუფთავოთ
    for (let i = 0; i < newSentence.length; i++) {
      onWordAdd(newSentence[i]);
    }
    
    setCursorPosition(cursorPosition + 1);
  };

  // Backspace - წაშლა cursor-ის წინ
  const handleBackspace = () => {
    if (cursorPosition === 0) return;
    
    const before = userSentence.slice(0, cursorPosition - 1);
    const after = userSentence.slice(cursorPosition);
    const newSentence = before + after;
    
    onClear();
    for (let i = 0; i < newSentence.length; i++) {
      onWordAdd(newSentence[i]);
    }
    
    setCursorPosition(cursorPosition - 1);
  };

  // Delete - წაშლა cursor-ის შემდეგ
  const handleDelete = () => {
    if (cursorPosition >= userSentence.length) return;
    
    const before = userSentence.slice(0, cursorPosition);
    const after = userSentence.slice(cursorPosition + 1);
    const newSentence = before + after;
    
    onClear();
    for (let i = 0; i < newSentence.length; i++) {
      onWordAdd(newSentence[i]);
    }
    // cursor პოზიცია რჩება იგივე
  };

  // დაფის გასუფთავება ხმით
  const handleClearWithSound = () => {
    if (isSoundEnabled) {
      const audio = new Audio('/sounds/testclear.mp3');
      audio.play().catch(err => console.log('Audio play failed:', err));
    }
    onClear();
    setCursorPosition(0);
  };

  // ღილაკების disabled სტატუსი

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
                {userSentence.slice(0, cursorPosition)}
                <span className="cursor-blink">|</span>
                {userSentence.slice(cursorPosition)}
              </span>
            </div>
          ) : (
            <div className="sentence-placeholder">
              წინადადების შესადგენად დააკლიკე ასოებისა და სასვენი ნიშნების ბარათებს.
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
                  handleCharacterAdd(letter);
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
            onClick={() => handleCharacterAdd(" ")}
            title="ადგილის გამოტოვება"
            aria-label="დაამატე ჰარი"
          >
            <span className="space-text">ჰარი</span>
          </button>
          <button
            className="sign-btn"
            onClick={() => handleCharacterAdd(".")}
            title="წერტილი"
            aria-label="დაამატე წერტილი"
          >
            .
          </button>
          <button
            className="sign-btn"
            onClick={() => handleCharacterAdd(",")}
            title="მძიმე"
            aria-label="დაამატე მძიმე"
          >
            ,
          </button>
          <button
            className="sign-btn"
            onClick={() => handleCharacterAdd("!")}
            title="ძახილის ნიშანი"
            aria-label="დაამატე ძახილის ნიშანი"
          >
            !
          </button>
          <button
            className="sign-btn"
            onClick={() => handleCharacterAdd("?")}
            title="კითხვის ნიშანი"
            aria-label="დაამატე კითხვის ნიშანი"
          >
            ?
          </button>
          <button
            className="sign-btn delete-btn"
            onClick={handleBackspace}
            title="Backspace - წაშლა cursor-ის წინ"
            aria-label="წაშალე სიმბოლო cursor-ის წინ"
            disabled={isInputEmpty || cursorPosition === 0}
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