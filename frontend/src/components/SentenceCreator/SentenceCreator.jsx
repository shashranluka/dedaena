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

  // ხმის ჩართვა-გამორთვის state (localStorage-დან)
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('dedaena_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // ხმის პარამეტრის შენახვა localStorage-ში
  useEffect(() => {
    localStorage.setItem('dedaena_sound_enabled', JSON.stringify(isSoundEnabled));
  }, [isSoundEnabled]);

  // ასოს ხმის დაკვრის ფუნქცია
  const playLetterSound = (letter) => {
    if (!isSoundEnabled) return;
    const audio = new Audio(`/audio/letters/${letter}.mp3`);
    audio.play().catch(err => console.log('Audio play failed:', err));
  };

  // სხვადასხვა მოქმედებებისთვის ხმების დაკვრა
  const playActionSound = (action) => {
    if (!isSoundEnabled) return;
    
    let soundFile = '';
    switch(action) {
      case 'success':
        soundFile = '/sounds/testsuccess.mp3'; // წარმატებული შემოწმება
        break;
      case 'error':
        soundFile = '/sounds/testerror.mp3'; // არასწორი წინადადება
        break;
      case 'clear':
        soundFile = '/sounds/testclear.mp3'; // დაფის გასუფთავება
        break;
      case 'warning':
        soundFile = '/sounds/testwarning.mp3'; // გაფრთხილება
        break;
      default:
        return;
    }
    
    const audio = new Audio(soundFile);
    audio.play().catch(err => console.log('Audio play failed:', err));
  };

  // ხმის ჩართვა-გამორთვა
  const toggleSound = () => {
    setIsSoundEnabled(prev => !prev);
  };

  // წინადადების შემოწმება ხმით
  const handleCheckWithSound = () => {
    onCheck();
    // sentenceMessageType-ის მიხედვით შესაბამისი ხმის დაკვრა
    // დავუშვათ რომ onCheck-ის შემდეგ განახლდება sentenceMessageType
    setTimeout(() => {
      if (sentenceMessageType === 'success') {
        playActionSound('success');
      } else if (sentenceMessageType === 'error') {
        playActionSound('error');
      } else if (sentenceMessageType === 'warning') {
        playActionSound('warning');
      }
    }, 100);
  };

  // დაფის გასუფთავება ხმით
  const handleClearWithSound = () => {
    playActionSound('clear');
    onClear();
  };

  // ღილაკების disabled სტატუსი
  const isInputEmpty = userSentence.length === 0;

  return (
    <div className="create-sentence-div">
      {/* ჰედერი - სათაური და კონტროლები */}
      <div className="create-sentence-header">
        <span>
          შექმენი წინადადება ({foundSentences.length}/{totalSentences})
        </span>
        <div className="header-controls">
          <button 
            className="sound-toggle-btn" 
            onClick={toggleSound}
            title={isSoundEnabled ? "ხმის გამორთვა" : "ხმის ჩართვა"}
            aria-label={isSoundEnabled ? "ხმის გამორთვა" : "ხმის ჩართვა"}
          >
            {isSoundEnabled ? "🔊" : "🔇"}
          </button>
          <button 
            className="next-quest" 
            onClick={() => setPosition(position + 1)}
            title="შემდეგი ქვესტი"
          >
            შემდეგი ქვესტი
          </button>
        </div>
      </div>


      {/* მთავარი სექცია */}
      <div className="sentence-section">
        {/* წინადადების კონსტრუქტორი */}
        <div className="sentence-builder">
          {userSentence.length > 0 ? (
            <div className="sentence-words">
              <span className="sentence-word">
                {userSentence}
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
            title="ჰარი"
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
            onClick={handleCheckWithSound}
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