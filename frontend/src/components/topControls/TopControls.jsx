import React, { useCallback } from 'react';
import './TopControls.scss';

const BUTTONS = [
  { view: 'alphabet', class: 'control-button', card: 'control-card', content: (props) => (
    <>
      <span className="card-icon">{props.currentLetter}</span>
      <span className="card-hint">{props.position}</span>
    </>
  )},
  // { view: 'create', class: 'control-button', card: 'control-card', content: () => (
  //   <>
  //     <span className="card-icon">✏️</span>
  //     <span className="card-hint">შექმენი სიტყვა</span>
  //   </>
  // )},
  // { view: 'words', class: 'control-button', card: 'control-card', content: (props) => (
  //   <>
  //     <span className="card-icon">📝</span>
  //     <span className="card-hint">სიტყვები ({props.foundWordsCount}/{props.wordsCount})</span>
  //   </>
  // )},
  // { view: 'sentence', class: 'control-button', card: 'control-card', content: () => (
  //   <>
  //     <span className="card-icon">💬</span>
  //     <span className="card-hint">შექმენი წინადადება</span>
  //   </>
  // )},
  // { view: 'showSentences', class: 'control-button', card: 'control-card', content: (props) => (
  //   <>
  //     <span className="card-icon">📋</span>
  //     <span className="card-hint">წინადადებები</span>
  //   </>
  // )},
  { view: 'instructions', class: 'control-button', card: 'control-card', content: () => (
    <>
      <span className="card-icon">❓</span>
      <span className="card-hint">ინსტრუქცია</span>
    </>
  )}
];

const TopControls = ({ activeView, onViewChange, isSoundEnabled, onToggleSound, position, staticDataLength, onPrevQuest, onNextQuest, ...props }) => {
  const toggleView = useCallback((view) => {
    onViewChange(activeView === view ? null : view);
  }, [activeView, onViewChange]);

  return (
    <div className="top-controls">
      {/* ხმის ჩართვა/გამორთვა */}

      {/* <button
        type="button"
        className="control-card next-quest-btn prev-quest-btn"
        onClick={onPrevQuest}
        title="წინა ქვესტი"
        aria-label="წინა ქვესტი"
      >
        ⬅️
      </button> */}

      {BUTTONS.map((btn, i) => (
        <div 
          key={btn.view}
          onClick={() => toggleView(btn.view)}
        >
          <div className={`${btn.card} ${activeView === btn.view ? 'active' : ''} ${i % 3 === 0 ? 'first-button' : 'other-button'}`}>
            {btn.content(props)}
          </div>
        </div>
      ))}
      <button 
        className="control-card sound-toggle-btn" 
        onClick={onToggleSound}
        title={isSoundEnabled ? "ხმის გამორთვა" : "ხმის ჩართვა"}
        aria-label={isSoundEnabled ? "ხმის გამორთვა" : "ხმის ჩართვა"}
      >
        {isSoundEnabled ? "🔊" : "🔇"}
      </button>

      {/* შემდეგი ქვესტი */}
      {/* {position < staticDataLength && ( */}
        <button 
          type="button"
          className="control-card next-quest-btn" 
          onClick={onNextQuest}
          title="შემდეგი ქვესტი"
          aria-label="შემდეგი ქვესტი"
        >
          ➡️
        </button>
      {/* )} */}
    </div>
  );
};

export default TopControls;