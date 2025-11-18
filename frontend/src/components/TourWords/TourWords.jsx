import React, { useState } from "react";
import "./TourWords.scss";

const TourWords = ({ currentTourData, onUpdateWord, onDeleteWord, onAddWord }) => {
  const [showWords, setShowWords] = useState(false);
  const [editingWordIndex, setEditingWordIndex] = useState(null);
  const [editedWord, setEditedWord] = useState('');

  if (!currentTourData) return null;

  const toggleWords = () => {
    setShowWords(prev => !prev);
  };

  // ✅ Start editing a word
  const startEditing = (index, word) => {
    setEditingWordIndex(index);
    setEditedWord(word);
  };

  // ✅ Cancel editing
  const cancelEditing = () => {
    setEditingWordIndex(null);
    setEditedWord('');
  };

  // ✅ Save edited word
  const saveWord = (index) => {
    if (editedWord.trim() && onUpdateWord) {
      onUpdateWord(index, editedWord.trim());
    }
    cancelEditing();
  };

  // ✅ Delete word
  const deleteWord = (index) => {
    if (window.confirm(`ნამდვილად გსურთ სიტყვის "${currentTourData.words[index]}" წაშლა?`)) {
      if (onDeleteWord) {
        onDeleteWord(index);
      }
    }
  };

  // ✅ Open Add Word Modal
  const handleAddNewWord = () => {
    if (onAddWord) {
      onAddWord(currentTourData);
    }
  };

  return (
    <div className="tour-words">
      {/* ✅ Toggle Button */}
      <div className="words-toggle-container">
        <button
          className={`btn-toggle-words ${showWords ? 'active' : ''}`}
          onClick={toggleWords}
        >
          {showWords ? (
            <>
              <span className="icon">🔼</span>
              <span className="text">სიტყვების დამალვა</span>
              <span className="badge">{currentTourData.words.length}</span>
            </>
          ) : (
            <>
              <span className="icon">🔽</span>
              <span className="text">სიტყვების ჩვენება</span>
              <span className="badge">{currentTourData.words.length}</span>
            </>
          )}
        </button>
      </div>

      {/* ✅ Words Display */}
      {showWords && (
        <div className="words-display">
          <div className="words-header">
            <div className="words-header-left">
              <h3>
                <span className="tour-letter">{currentTourData.letter}</span>
                ტურის სიტყვები
              </h3>
              <div className="words-meta">
                <span className="meta-item">
                  📍 პოზიცია: <strong>{currentTourData.position}</strong>
                </span>
                <span className="meta-item">
                  📊 სიტყვები: <strong>{currentTourData.words.length}</strong>
                </span>
              </div>
            </div>
            
            {/* ✅ Add Word Button */}
            <div className="words-header-right">
              <button
                className="btn-add-new-word"
                onClick={handleAddNewWord}
                title="ახალი სიტყვის დამატება"
              >
                <span className="icon">➕</span>
                <span className="text">სიტყვის დამატება</span>
              </button>
            </div>
          </div>

          <div className="words-grid">
            {currentTourData.words.map((word, index) => (
              <div className="word-card" key={index}>
                {editingWordIndex === index ? (
                  // ✅ EDIT MODE
                  <div className="word-edit-mode">
                    <input
                      type="text"
                      className="word-edit-input"
                      value={editedWord}
                      onChange={(e) => setEditedWord(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveWord(index);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      autoFocus
                    />
                    <div className="word-edit-actions">
                      <button
                        className="btn-save-word"
                        onClick={() => saveWord(index)}
                        title="შენახვა"
                      >
                        ✓
                      </button>
                      <button
                        className="btn-cancel-word"
                        onClick={cancelEditing}
                        title="გაუქმება"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  // ✅ VIEW MODE
                  <>
                    <span className="word-number">{index + 1}</span>
                    <span className="word-text">{word}</span>
                    <div className="word-actions">
                      <button
                        className="btn-edit-word"
                        onClick={() => startEditing(index, word)}
                        title="რედაქტირება"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete-word"
                        onClick={() => deleteWord(index)}
                        title="წაშლა"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TourWords;