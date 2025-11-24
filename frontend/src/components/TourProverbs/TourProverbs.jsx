import React, { useState } from 'react';
import './TourProverbs.scss';

const TourProverbs = ({ 
  currentTourData,
  onAddProverb,
  onUpdateProverb,
  onDeleteProverb
}) => {
  const [expandedProverbs, setExpandedProverbs] = useState(new Set());
  const [editingProverbs, setEditingProverbs] = useState(new Set());
  const [editedTexts, setEditedTexts] = useState({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newProverbText, setNewProverbText] = useState('');

  // ✅ თუ currentTourData არ არის
  if (!currentTourData) {
    return (
      <div className="tour-proverbs">
        <div className="no-data">
          <p>📚 ტური არ არის არჩეული</p>
        </div>
      </div>
    );
  }

  const proverbs = currentTourData.proverbs || [];

  // ✅ Toggle proverb expansion
  const toggleProverb = (index) => {
    setExpandedProverbs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // ✅ Toggle all proverbs
  const toggleAllProverbs = () => {
    if (expandedProverbs.size === proverbs.length) {
      setExpandedProverbs(new Set());
    } else {
      setExpandedProverbs(new Set([...Array(proverbs.length).keys()]));
    }
  };

  // ✅ Start editing proverb
  const startEditProverb = (index, text) => {
    setEditingProverbs(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
    setEditedTexts(prev => ({
      ...prev,
      [index]: text
    }));
  };

  // ✅ Cancel editing proverb
  const cancelEditProverb = (index) => {
    setEditingProverbs(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setEditedTexts(prev => {
      const newTexts = { ...prev };
      delete newTexts[index];
      return newTexts;
    });
  };

  // ✅ Save edited proverb
  const saveEditedProverb = (index) => {
    const newText = editedTexts[index]?.trim();
    
    if (!newText) {
      alert('❌ ანდაზა არ უნდა იყოს ცარიელი!');
      return;
    }

    if (onUpdateProverb) {
      onUpdateProverb(index, newText);
    }

    // Clear editing state
    cancelEditProverb(index);
  };

  // ✅ Delete proverb with confirmation
  const handleDeleteProverb = (index, proverbText) => {
    const preview = proverbText.slice(0, 50) + (proverbText.length > 50 ? '...' : '');
    const confirmed = window.confirm(
      `❓ დარწმუნებული ხართ, რომ გსურთ ანდაზის წაშლა?\n\n"${preview}"`
    );

    if (confirmed && onDeleteProverb) {
      onDeleteProverb(index);
    }
  };

  // ✅ Start adding new proverb
  const startAddingProverb = () => {
    setIsAddingNew(true);
    setNewProverbText('');
  };

  // ✅ Cancel adding new proverb
  const cancelAddingProverb = () => {
    setIsAddingNew(false);
    setNewProverbText('');
  };

  // ✅ Save new proverb
  const saveNewProverb = () => {
    const text = newProverbText.trim();
    
    if (!text) {
      alert('❌ ანდაზა არ უნდა იყოს ცარიელი!');
      return;
    }

    if (onAddProverb) {
      onAddProverb(text);
    }

    // Clear state
    setIsAddingNew(false);
    setNewProverbText('');
  };

  // ✅ Handle textarea key down (Ctrl+Enter to save)
  const handleKeyDown = (e, saveFunc) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveFunc();
    }
  };

  const allExpanded = proverbs.length > 0 && expandedProverbs.size === proverbs.length;

  return (
    <div className="tour-proverbs">
      {/* ✅ HEADER */}
      <div className="proverbs-header">
        <h2>
          📚 ანდაზები ({currentTourData.letter}/{currentTourData.position})
          <span className="count">{proverbs.length}</span>
        </h2>

        <div className="header-actions">
          {proverbs.length > 0 && (
            <button
              className={`btn-toggle-all ${allExpanded ? 'active' : ''}`}
              onClick={toggleAllProverbs}
              title={allExpanded ? 'ყველას ჩაკეცვა' : 'ყველას გაშლა'}
            >
              <span className="icon">{allExpanded ? '🔼' : '🔽'}</span>
              <span className="text">{allExpanded ? 'ჩაკეცვა' : 'გაშლა'}</span>
            </button>
          )}

          {onAddProverb && !isAddingNew && (
            <button
              className="btn-add-proverb"
              onClick={startAddingProverb}
              title="ანდაზის დამატება"
            >
              <span className="icon">➕</span>
              <span className="text">დამატება</span>
            </button>
          )}
        </div>
      </div>

      {/* ✅ ADD NEW PROVERB FORM */}
      {isAddingNew && (
        <div className="add-proverb-form">
          <div className="form-header">
            <h3>➕ ახალი ანდაზის დამატება</h3>
          </div>
          <textarea
            className="proverb-textarea"
            placeholder="ჩაწერეთ ანდაზა..."
            value={newProverbText}
            onChange={(e) => setNewProverbText(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, saveNewProverb)}
            rows={3}
            autoFocus
          />
          <div className="form-actions">
            <button className="btn-save" onClick={saveNewProverb}>
              💾 შენახვა
            </button>
            <button className="btn-cancel" onClick={cancelAddingProverb}>
              ❌ გაუქმება
            </button>
          </div>
          <small className="hint">💡 Ctrl+Enter - სწრაფი შენახვა</small>
        </div>
      )}

      {/* ✅ PROVERBS LIST */}
      {proverbs.length === 0 ? (
        <div className="no-proverbs">
          <p>📭 ამ ტურში ანდაზები არ არის</p>
          {onAddProverb && (
            <button className="btn-add-first" onClick={startAddingProverb}>
              ➕ პირველი ანდაზის დამატება
            </button>
          )}
        </div>
      ) : (
        <div className="proverbs-list">
          {proverbs.map((proverb, index) => {
            const isExpanded = expandedProverbs.has(index);
            const isEditing = editingProverbs.has(index);
            const previewLength = 60;
            const needsExpansion = proverb.length > previewLength;
            const displayText = isExpanded || !needsExpansion
              ? proverb
              : proverb.slice(0, previewLength) + '...';

            return (
              <div
                key={index}
                className={`proverb-item ${isExpanded ? 'expanded' : ''} ${isEditing ? 'editing' : ''}`}
              >
                <div className="proverb-number">{index + 1}</div>
                
                <div className="proverb-content">
                  {isEditing ? (
                    // ✅ EDIT MODE
                    <div className="edit-mode">
                      <textarea
                        className="proverb-textarea"
                        value={editedTexts[index] || proverb}
                        onChange={(e) => setEditedTexts(prev => ({
                          ...prev,
                          [index]: e.target.value
                        }))}
                        onKeyDown={(e) => handleKeyDown(e, () => saveEditedProverb(index))}
                        rows={3}
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button 
                          className="btn-save" 
                          onClick={() => saveEditedProverb(index)}
                        >
                          💾 შენახვა
                        </button>
                        <button 
                          className="btn-cancel" 
                          onClick={() => cancelEditProverb(index)}
                        >
                          ❌ გაუქმება
                        </button>
                      </div>
                      <small className="hint">💡 Ctrl+Enter - სწრაფი შენახვა</small>
                    </div>
                  ) : (
                    // ✅ VIEW MODE
                    <>
                      <p className="proverb-text">{displayText}</p>
                      
                      <div className="proverb-actions">
                        {needsExpansion && (
                          <button
                            className="btn-expand"
                            onClick={() => toggleProverb(index)}
                          >
                            <span>{isExpanded ? '🔼' : '🔽'}</span>
                            {isExpanded ? 'ნაკლები' : 'მეტი'}
                          </button>
                        )}

                        {onUpdateProverb && (
                          <button
                            className="btn-edit"
                            onClick={() => startEditProverb(index, proverb)}
                            title="რედაქტირება"
                          >
                            ✏️ რედაქტირება
                          </button>
                        )}

                        {onDeleteProverb && (
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteProverb(index, proverb)}
                            title="წაშლა"
                          >
                            🗑️ წაშლა
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TourProverbs;