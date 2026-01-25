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
  { view: 'showSentences', class: 'control-button', card: 'control-card', content: (props) => (
    <>
      <span className="card-icon">📋</span>
      <span className="card-hint">წინადადებები ({props.foundSentencesCount}/{props.sentencesCount})</span>
    </>
  )},
  { view: 'instructions', class: 'control-button', card: 'control-card', content: () => (
    <>
      <span className="card-icon">❓</span>
      <span className="card-hint">ინსტრუქცია</span>
    </>
  )}
];

const TopControls = ({ activeView, onViewChange, ...props }) => {
  const toggleView = useCallback((view) => {
    onViewChange(activeView === view ? null : view);
  }, [activeView, onViewChange]);

  return (
    <div className="top-controls">
      {BUTTONS.map((btn, i) => (
        <div 
          key={btn.view}
          className={`${btn.class} ${i % 2 === 0 ? 'odd-button' : 'even-button'}`} 
          onClick={() => toggleView(btn.view)}
        >
          <div className={`${btn.card} ${activeView === btn.view ? 'active' : ''}`}>
            {btn.content(props)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopControls;