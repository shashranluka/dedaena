import React, { useState, useMemo } from 'react';
import './ModeratorFullData.scss';
import ModeratorSentence from '../ModeratorSentence/ModeratorSentence';

const ModeratorFullData = ({ 
  dedaenaData, 
  allPrevWords,
  currentWords,
  currentUser, 
  tableName,
  onContentAdd,
  onContentUpdate,
  onContentDelete,
  addWordRelevantTour
}) => {
  const [activeTab, setActiveTab] = useState('words');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    tourPosition: ''
  });
  const [detectedTour, setDetectedTour] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Get all items with tour info
  const allWords = useMemo(() => {
    const items = [];
    dedaenaData.forEach(tour => {
      tour.words?.forEach((word, index) => {
        items.push({
          content: word,
          tourLetter: tour.letter,
          tourPosition: tour.position,
          index: index,
          arrayIndex: index,
          type: 'word'
        });
      });
    });
    return items;
  }, [dedaenaData]);

  const allSentences = useMemo(() => {
    const items = [];
    dedaenaData.forEach(tour => {
      tour.sentences?.forEach((sentence, index) => {
        items.push({
          content: sentence,
          tourLetter: tour.letter,
          tourPosition: tour.position,
          index: index,
          arrayIndex: index,
          type: 'sentence'
        });
      });
    });
    return items;
  }, [dedaenaData]);

  const allProverbs = useMemo(() => {
    const items = [];
    dedaenaData.forEach(tour => {
      tour.proverbs?.forEach((proverb, index) => {
        items.push({
          content: proverb,
          tourLetter: tour.letter,
          tourPosition: tour.position,
          index: index,
          arrayIndex: index,
          type: 'proverb'
        });
      });
    });
    return items;
  }, [dedaenaData]);

  const allReading = useMemo(() => {
    const items = [];
    dedaenaData.forEach(tour => {
      tour.reading?.forEach((text, index) => {
        items.push({
          content: text,
          tourLetter: tour.letter,
          tourPosition: tour.position,
          index: index,
          arrayIndex: index,
          type: 'reading'
        });
      });
    });
    return items;
  }, [dedaenaData]);

  // ✅ Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'words':
        return allWords;
      case 'sentences':
        return allSentences;
      case 'proverbs':
        return allProverbs;
      case 'reading':
        return allReading;
      default:
        return [];
    }
  };

  // ✅ Filter by search query
  const filteredData = useMemo(() => {
    const data = getCurrentData();
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(item =>
      item.content.toLowerCase().includes(query) ||
      item.tourLetter.toLowerCase().includes(query)
    );
  }, [searchQuery, activeTab, allWords, allSentences, allProverbs, allReading]);

  // ✅ Get endpoint type
  const getEndpointType = () => {
    switch (activeTab) {
      case 'words':
        return 'word';
      case 'sentences':
        return 'sentence';
      case 'proverbs':
        return 'proverb';
      case 'reading':
        return 'reading';
      default:
        return '';
    }
  };

  // ✅ Detect tour based on content using reverse search
  const detectTour = (text) => {
    if (!text || !text.trim()) {
      setDetectedTour(null);
      return;
    }

    const content = text.trim();
    
    // Find tour by checking if content includes tour letter (reverse order)
    const estimatedTour = dedaenaData.slice().reverse().find(tour => 
      content.includes(tour.letter)
    );

    if (estimatedTour) {
      // Calculate confidence based on position in text
      const firstChar = content[0];
      const confidence = firstChar === estimatedTour.letter ? 'high' : 'medium';
      
      setDetectedTour({
        position: estimatedTour.position,
        letter: estimatedTour.letter,
        confidence: confidence
      });
    } else {
      setDetectedTour(null);
    }
  };

  // ✅ Handle content change with auto-detection
  const handleContentChange = (text) => {
    setFormData({ ...formData, content: text });
    detectTour(text);
  };

  // ✅ Apply detected tour
  const applyDetectedTour = () => {
    if (detectedTour) {
      setFormData({ 
        ...formData, 
        tourPosition: detectedTour.position.toString() 
      });
    }
  };

  // ✅ Handle Add - simplified
  const handleAdd = async () => {
    if (!formData.content.trim()) {
      alert('გთხოვთ შეიყვანოთ ტექსტი');
      return;
    }

    const selectedPosition = formData.tourPosition || detectedTour?.position;

    if (!selectedPosition) {
      alert('გთხოვთ აირჩიოთ ტური');
      return;
    }

    setLoading(true);
    try {
      const endpointType = getEndpointType();
      
      await onContentAdd(endpointType, {
        content: formData.content.trim(),
        position: parseInt(selectedPosition)
      });

      // Success - reset form
      setIsAdding(false);
      setFormData({ content: '', tourPosition: '' });
      setDetectedTour(null);
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Edit - simplified with auto-detection
  const handleEdit = async (item) => {
    if (!formData.content.trim()) {
      alert('გთხოვთ შეავსოთ ტექსტი');
      return;
    }

    setLoading(true);
    try {
      const endpointType = getEndpointType();
      
      // Use detected tour if available and different from original
      const finalPosition = detectedTour && detectedTour.position !== item.tourPosition
        ? detectedTour.position
        : item.tourPosition;
      
      await onContentUpdate(endpointType, {
        content: formData.content.trim(),
        position: finalPosition,
        index: item.arrayIndex
      });

      // Success - reset form
      setEditingItem(null);
      setFormData({ content: '', tourPosition: '' });
      setDetectedTour(null);
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Delete - simplified
  const handleDelete = async (item) => {
    if (!window.confirm(`დარწმუნებული ხართ რომ გსურთ წაშლა?\n\n"${item.content}"`)) {
      return;
    }

    setLoading(true);
    try {
      const endpointType = getEndpointType();
      
      await onContentDelete(endpointType, {
        position: item.tourPosition,
        index: item.arrayIndex
      });

      // Success - handled by parent
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  // ✅ Start editing with detection
  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      content: item.content,
      tourPosition: item.tourPosition
    });
    // Detect tour for current content
    detectTour(item.content);
  };

  // ✅ Cancel edit
  const cancelEdit = () => {
    setEditingItem(null);
    setIsAdding(false);
    setFormData({ content: '', tourPosition: '' });
    setDetectedTour(null);
  };

  if (!dedaenaData || dedaenaData.length === 0) {
    return (
      <div className="moderator-full-data">
        <div className="no-data">
          <p>📊 მონაცემები არ არის ხელმისაწვდომი</p>
        </div>
      </div>
    );
  }

  const currentData = filteredData;

  return (
    <div className="moderator-full-data">
      {/* ✅ HEADER */}
      <div className="data-header">
        <h2>📚 სრული მონაცემთა ბაზა</h2>
        <p className="subtitle">იაკობ გოგებაშვილის დედაენა</p>
      </div>

      {/* ✅ CONTROLS */}
      <div className="data-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 ძებნა..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-tabs">
          <button
            className={`tab ${activeTab === 'words' ? 'active' : ''}`}
            onClick={() => setActiveTab('words')}
          >
            📝 სიტყვები ({allWords.length})
          </button>
          <button
            className={`tab ${activeTab === 'sentences' ? 'active' : ''}`}
            onClick={() => setActiveTab('sentences')}
          >
            📄 წინადადებები ({allSentences.length})
          </button>
          <button
            className={`tab ${activeTab === 'proverbs' ? 'active' : ''}`}
            onClick={() => setActiveTab('proverbs')}
          >
            📚 ანდაზები ({allProverbs.length})
          </button>
          <button
            className={`tab ${activeTab === 'reading' ? 'active' : ''}`}
            onClick={() => setActiveTab('reading')}
          >
            📖 კითხვა ({allReading.length})
          </button>
        </div>

        <button
          className="btn-add"
          onClick={() => {
            setIsAdding(true);
            setFormData({ content: '', tourPosition: '' });
          }}
          disabled={loading}
        >
          ➕ დამატება
        </button>

        <div className="results-count">
          <span>ნაპოვნია: <strong>{currentData.length}</strong></span>
        </div>
      </div>

      {/* ✅ ADD FORM - UPDATED */}
      {isAdding && (
        <div className="edit-form">
          <h3>➕ ახალი {activeTab === 'words' ? 'სიტყვა' : activeTab === 'sentences' ? 'წინადადება' : activeTab === 'proverbs' ? 'ანდაზა' : 'კითხვა'}</h3>
          
          <div className="form-row">
            <textarea
              value={formData.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="შეიყვანეთ ტექსტი..."
              className="form-textarea"
              rows={activeTab === 'words' ? 2 : 4}
              autoFocus
            />
          </div>

          {/* ✅ AUTO-DETECTED TOUR */}
          {detectedTour && (
            <div className={`detected-tour ${detectedTour.confidence}`}>
              <div className="detected-info">
                <span className="detected-icon">🎯</span>
                <span className="detected-text">
                  აღმოჩენილი ტური: <strong>{detectedTour.letter}</strong> (#{detectedTour.position})
                </span>
                <span className="confidence-badge">
                  {detectedTour.confidence === 'high' ? '✅ მაღალი სიზუსტე' : '⚠️ საშუალო სიზუსტე'}
                </span>
              </div>
              {!formData.tourPosition && (
                <button 
                  className="btn-apply-tour" 
                  onClick={applyDetectedTour}
                  type="button"
                >
                  ✅ გამოყენება
                </button>
              )}
            </div>
          )}

          {/* ✅ MANUAL TOUR SELECTION */}
          <div className="form-row">
            <label className="form-label">
              ტური {formData.tourPosition && '(არჩეული)'}
            </label>
            <select
              value={formData.tourPosition}
              onChange={(e) => setFormData({ ...formData, tourPosition: e.target.value })}
              className="form-select"
            >
              <option value="">
                {detectedTour ? 'ან აირჩიეთ სხვა ტური' : 'აირჩიეთ ტური'}
              </option>
              {dedaenaData.map(tour => (
                <option 
                  key={tour.position} 
                  value={tour.position}
                  className={detectedTour?.position === tour.position ? 'suggested' : ''}
                >
                  {tour.letter} - ტური #{tour.position}
                  {detectedTour?.position === tour.position ? ' (შემოთავაზებული)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button 
              onClick={handleAdd} 
              disabled={loading || (!formData.tourPosition && !detectedTour)} 
              className="btn-save"
            >
              {loading ? '⏳' : '✅'} შენახვა
            </button>
            <button onClick={cancelEdit} disabled={loading} className="btn-cancel">
              ❌ გაუქმება
            </button>
          </div>
        </div>
      )}

      {/* ✅ CONTENT CARDS */}
      <div className="content-cards">
        {/* WORDS */}
        {activeTab === 'words' && (
          <div className="words-grid">
            {currentData.map((item, idx) => (
              <div key={idx} className="word-card">
                {editingItem?.tourPosition === item.tourPosition && 
                 editingItem?.arrayIndex === item.arrayIndex ? (
                  <div className="edit-mode">
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="edit-input"
                      rows={2}
                    />
                    
                    {/* ✅ SHOW DETECTED TOUR IN EDIT MODE */}
                    {detectedTour && detectedTour.position !== item.tourPosition && (
                      <div className="detected-tour-inline">
                        <span className="detected-icon">🎯</span>
                        <span className="detected-text">
                          შეიცვალა ტური: <strong>{detectedTour.letter}</strong> (#{detectedTour.position})
                        </span>
                      </div>
                    )}
                    
                    <div className="edit-actions">
                      <button onClick={() => handleEdit(item)} disabled={loading} className="btn-save-small">
                        ✅
                      </button>
                      <button onClick={cancelEdit} disabled={loading} className="btn-cancel-small">
                        ❌
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="card-header">
                      <div className="tour-badge">
                        <span className="tour-letter">{item.tourLetter}</span>
                        <span className="tour-position">#{item.tourPosition}</span>
                      </div>
                      <span className="item-number">#{item.index + 1}</span>
                    </div>
                    <div className="card-content">
                      <p className="word-text">{item.content}</p>
                    </div>
                    <div className="card-actions">
                      <button onClick={() => startEdit(item)} className="btn-edit" disabled={loading}>
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(item)} className="btn-delete" disabled={loading}>
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SENTENCES */}
        {activeTab === 'sentences' && (
          <div className="sentences-list">
            {currentData.map((item, idx) => (
              <div key={idx} className="sentence-card">
                {editingItem?.tourPosition === item.tourPosition && 
                 editingItem?.arrayIndex === item.arrayIndex ? (
                  <div className="edit-mode">
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="edit-input"
                      rows={4}
                    />
                    
                    {/* ✅ SHOW DETECTED TOUR IN EDIT MODE */}
                    {detectedTour && detectedTour.position !== item.tourPosition && (
                      <div className="detected-tour-inline">
                        <span className="detected-icon">🎯</span>
                        <span className="detected-text">
                          შეიცვალა ტური: <strong>{detectedTour.letter}</strong> (#{detectedTour.position})
                        </span>
                      </div>
                    )}
                    
                    <div className="edit-actions">
                      <button onClick={() => handleEdit(item)} disabled={loading} className="btn-save-small">
                        ✅ შენახვა
                      </button>
                      <button onClick={cancelEdit} disabled={loading} className="btn-cancel-small">
                        ❌ გაუქმება
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="card-header">
                      <div className="tour-badge">
                        <span className="tour-letter">{item.tourLetter}</span>
                        <span className="tour-position">ტური #{item.tourPosition}</span>
                      </div>
                      <div className="header-right">
                        <span className="item-number">#{item.index + 1}</span>
                        <div className="card-actions">
                          <button onClick={() => startEdit(item)} className="btn-edit" disabled={loading}>
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(item)} className="btn-delete" disabled={loading}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="card-content">
                      <p className="sentence-text">{item.content}</p>
                    </div>
                  </>
                )}
              </div>
              // <ModeratorSentence 
              //   key={idx}
              //   allPrevWords={allPrevWords}
              //   currentWords={currentWords}
              //   addWordRelevantTour={addWordRelevantTour}
              // />
            ))}
          </div>
        )}

        {/* PROVERBS */}
        {activeTab === 'proverbs' && (
          <div className="proverbs-list">
            {currentData.map((item, idx) => (
              <div key={idx} className="proverb-card">
                {editingItem?.tourPosition === item.tourPosition && 
                 editingItem?.arrayIndex === item.arrayIndex ? (
                  <div className="edit-mode">
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="edit-input"
                      rows={4}
                    />
                    
                    {/* ✅ SHOW DETECTED TOUR IN EDIT MODE */}
                    {detectedTour && detectedTour.position !== item.tourPosition && (
                      <div className="detected-tour-inline">
                        <span className="detected-icon">🎯</span>
                        <span className="detected-text">
                          შეიცვალა ტური: <strong>{detectedTour.letter}</strong> (#{detectedTour.position})
                        </span>
                      </div>
                    )}
                    
                    <div className="edit-actions">
                      <button onClick={() => handleEdit(item)} disabled={loading} className="btn-save-small">
                        ✅ შენახვა
                      </button>
                      <button onClick={cancelEdit} disabled={loading} className="btn-cancel-small">
                        ❌ გაუქმება
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="card-header">
                      <div className="tour-badge">
                        <span className="tour-letter">{item.tourLetter}</span>
                        <span className="tour-position">ტური #{item.tourPosition}</span>
                      </div>
                      <div className="header-right">
                        <span className="item-number">#{item.index + 1}</span>
                        <div className="card-actions">
                          <button onClick={() => startEdit(item)} className="btn-edit" disabled={loading}>
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(item)} className="btn-delete" disabled={loading}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="card-content">
                      <div className="proverb-icon">💬</div>
                      <p className="proverb-text">{item.content}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* READING */}
        {activeTab === 'reading' && (
          <div className="reading-list">
            {currentData.map((item, idx) => (
              <div key={idx} className="reading-card">
                {editingItem?.tourPosition === item.tourPosition && 
                 editingItem?.arrayIndex === item.arrayIndex ? (
                  <div className="edit-mode">
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="edit-input"
                      rows={6}
                    />
                    
                    {/* ✅ SHOW DETECTED TOUR IN EDIT MODE */}
                    {detectedTour && detectedTour.position !== item.tourPosition && (
                      <div className="detected-tour-inline">
                        <span className="detected-icon">🎯</span>
                        <span className="detected-text">
                          შეიცვალა ტური: <strong>{detectedTour.letter}</strong> (#{detectedTour.position})
                        </span>
                      </div>
                    )}
                    
                    <div className="edit-actions">
                      <button onClick={() => handleEdit(item)} disabled={loading} className="btn-save-small">
                        ✅ შენახვა
                      </button>
                      <button onClick={cancelEdit} disabled={loading} className="btn-cancel-small">
                        ❌ გაუქმება
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="card-header">
                      <div className="tour-badge">
                        <span className="tour-letter">{item.tourLetter}</span>
                        <span className="tour-position">ტური #{item.tourPosition}</span>
                      </div>
                      <div className="header-right">
                        <span className="item-number">#{item.index + 1}</span>
                        <div className="card-actions">
                          <button onClick={() => startEdit(item)} className="btn-edit" disabled={loading}>
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(item)} className="btn-delete" disabled={loading}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="card-content">
                      <p className="reading-text">{item.content}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* NO RESULTS */}
        {currentData.length === 0 && (
          <div className="no-results">
            {searchQuery ? (
              <p>🔍 "{searchQuery}" - შედეგები არ მოიძებნა</p>
            ) : (
              <p>📭 კონტენტი არ არის</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorFullData;