import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCurrentUser, getToken } from "../../services/auth";
import api from "../../services/api";
import "./ModeratorDashboard.scss";
import { Navigate } from "react-router-dom";

// --- Constants ---
const VERSION_DATA = {
  name: "იაკობ გოგებაშვილი",
  dedaena_table: "gogebashvili_1_test"
};

// --- Helper Functions ---
const showErrorMessage = (error) => {
  const message = error.response?.data?.detail || error.message;
  alert(`❌ შეცდომა: ${message}`);
};

// ✅ NEW: სიტყვის ნორმალიზაცია (პუნქტუაციის წაშლა)
const normalizeWord = (word) => {
  return word.replace(/[.,!?;:()"""''«»—\-]/g, '').toLowerCase().trim();
};

const ModeratorDashboard = () => {
  const [user, setUser] = useState(null);
  const [dedaenaData, setDedaenaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- UI & Form State (from ModeratorFullData) ---
  const [activeTab, setActiveTab] = useState('words');
  const [searchQuery, setSearchQuery] = useState('');
  const [tourFilter, setTourFilter] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ content: '', tourPosition: '' });
  const [detectedTour, setDetectedTour] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState([]);
  const [showAllAnalysis, setShowAllAnalysis] = useState(false);
  console.log("ModeratorDashboard render: ", { activeTab, searchQuery, tourFilter, editingItem, isAdding, formData, detectedTour });
  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await api.get(
        `/moderator/dedaena/${VERSION_DATA.dedaena_table}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setDedaenaData(response.data.data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message;
      setError(errorMessage);
      showErrorMessage(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Unified CRUD Action Handler ---
  const handleContentAction = useCallback(async (action, type, data) => {
    setActionLoading(true);
    try {
      const token = getToken();
      const endpointType = type.slice(0, -1);
      await api.patch(
        `/moderator/dedaena/${VERSION_DATA.dedaena_table}/${endpointType}/${action}`,
        { ...data, table_name: VERSION_DATA.dedaena_table },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      await fetchData();
      cancelEdit();
    } catch (err) {
      showErrorMessage(err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [fetchData]);

  // ✅ NEW: ყველა სიტყვის ბაზა (ყველა ტურიდან)
  const allWordsMap = useMemo(() => {
    const wordsMap = new Map(); // key: normalized word, value: { tours: Set, original: string }
    dedaenaData.forEach(tour => {
      (tour.words || []).forEach(word => {
        const normalized = normalizeWord(word);
        if (!wordsMap.has(normalized)) {
          wordsMap.set(normalized, { tours: new Set(), original: word });
        }
        wordsMap.get(normalized).tours.add(tour.position);
      });
    });
    return wordsMap;
  }, [dedaenaData]);

  // ✅ NEW: სიტყვის ტურის გამოცნობა
  const detectWordTour = useCallback((word) => {
    const normalized = normalizeWord(word);

    // თუ ნორმალიზებული სიტყვა ცარიელია, ვუბრუნებთ null
    if (!normalized) {
      return null;
    }

    const firstLetter = normalized[0];

    // ვიძებთ რომელ ტურში არის ეს სიტყვა
    const existingTours = allWordsMap.get(normalized)?.tours || new Set();

    // ვიძებთ რომელ ტურს ეკუთვნის პირველი ასო
    // const estimatedTour = dedaenaData.find(tour => tour.letter === firstLetter);
    const estimatedTour = dedaenaData.slice().reverse().find(tour => word.includes(tour.letter));

    return {
      word: normalized, // ✅ ახლა გამოსახულია ნორმალიზებული სიტყვა
      originalWord: word, // ✅ შენახული ორიგინალი ინფორმაციისთვის
      normalized: normalized,
      existsInTours: Array.from(existingTours),
      estimatedTour: estimatedTour ? { position: estimatedTour.position, letter: estimatedTour.letter } : null
    };
  }, [allWordsMap, dedaenaData]);

  // ✅ NEW: წინადადების სიტყვებად დაყოფა
  const analyzeSentence = useCallback((sentence) => {
    const words = sentence.split(/\s+/).filter(w => w.length > 0);
    return words
      .map(word => detectWordTour(word))
      .filter(wordInfo => wordInfo !== null); // ✅ ვფილტრავთ ცარიელ სიტყვებს
  }, [detectWordTour]);

  // --- Data Processing (from ModeratorFullData) ---
  const allItems = useMemo(() => {
    const items = [];
    dedaenaData.forEach(tour => {
      (tour.words || []).forEach((content, index) => items.push({ type: 'words', content, arrayIndex: index, tourPosition: tour.position, tourLetter: tour.letter }));
      (tour.sentences || []).forEach((content, index) => items.push({
        type: 'sentences',
        content,
        arrayIndex: index,
        tourPosition: tour.position,
        tourLetter: tour.letter,
        wordAnalysis: analyzeSentence(content)
      }));
      (tour.proverbs || []).forEach((content, index) => items.push({
        type: 'proverbs',
        content,
        arrayIndex: index,
        tourPosition: tour.position,
        tourLetter: tour.letter,
        wordAnalysis: analyzeSentence(content) // ✅ დამატებულია
      }));
      (tour.reading || []).forEach((content, index) => items.push({
        type: 'reading',
        content,
        arrayIndex: index,
        tourPosition: tour.position,
        tourLetter: tour.letter,
        wordAnalysis: analyzeSentence(content) // ✅ დამატებულია
      }));
    });
    return items.map((item) => ({ ...item, id: `${item.tourPosition}-${item.type}-${item.arrayIndex}` }));
  }, [dedaenaData, analyzeSentence]);

  const currentData = useMemo(() => {
    return allItems.filter(item => {
      const matchesTab = item.type === activeTab;
      const matchesTour = tourFilter === 'all' || item.tourPosition === parseInt(tourFilter, 10);
      const matchesSearch = !searchQuery || item.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesTour && matchesSearch;
    });
  }, [allItems, activeTab, tourFilter, searchQuery]);

  const totalCounts = useMemo(() => ({
    words: allItems.filter(i => i.type === 'words').length,
    sentences: allItems.filter(i => i.type === 'sentences').length,
    proverbs: allItems.filter(i => i.type === 'proverbs').length,
    reading: allItems.filter(i => i.type === 'reading').length,
  }), [allItems]);

  // ✅ NEW: სიტყვის ტურში დამატება
  const handleAddWordToTour = async (wordInfo) => {
    if (!wordInfo.estimatedTour) {
      alert("ვერ მოიძებნა შესაბამისი ტური ამ სიტყვისთვის");
      return;
    }

    const confirmed = window.confirm(
      `დაემატოს სიტყვა "${wordInfo.word}" ტურ ${wordInfo.estimatedTour.position} (${wordInfo.estimatedTour.letter})?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      const payload = {
        position: wordInfo.estimatedTour.position,
        content: wordInfo.word, // ✅ ახლა უკვე ნორმალიზებული სიტყვა იგზავნება
        added_by: user.username,
        added_at: new Date().toISOString(),
      };
      await handleContentAction('add', 'words', payload);
      alert(`✅ სიტყვა "${wordInfo.word}" დაემატა ტურ ${wordInfo.estimatedTour.position}-ს`);
    } catch (error) {
      // Error already handled by handleContentAction
    }
  };

  // --- Form Handlers (from ModeratorFullData) ---
  const detectTour = (text) => {
    if (!text || !text.trim()) { setDetectedTour(null); return; }
    const content = text.trim();
    const estimatedTour = dedaenaData.slice().reverse().find(tour => content.includes(tour.letter));
    console.log(estimatedTour, dedaenaData);
    setDetectedTour(estimatedTour ? { position: estimatedTour.position, letter: estimatedTour.letter, confidence: content[0] === estimatedTour.letter ? 'high' : 'medium' } : null);
  };

  const handleContentChange = (text) => {
    setFormData({ ...formData, content: text });
    detectTour(text);
  };

  const applyDetectedTour = () => {
    if (detectedTour) setFormData({ ...formData, tourPosition: detectedTour.position.toString() });
  };

  const handleAdd = () => {
    const finalPosition = formData.tourPosition || detectedTour?.position;
    if (!formData.content.trim() || !finalPosition) { alert("ტექსტი და ტური არ უნდა იყოს ცარიელი."); return; }
    const payload = {
      position: parseInt(finalPosition),
      content: formData.content.trim(),
      added_by: user.username,
      added_at: new Date().toISOString(),
    };
    handleContentAction('add', activeTab, payload);
  };

  const handleEdit = (item) => {
    if (!formData.content.trim()) { alert('ტექსტი არ უნდა იყოს ცარიელი.'); return; }
    const payload = {
      position: detectedTour?.position || item.tourPosition,
      arrayIndex: item.arrayIndex,
      content: formData.content.trim(),
      edited_by: user.username,
      edited_at: new Date().toISOString(),
    };
    handleContentAction('update', activeTab, payload);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`დარწმუნებული ხართ რომ გსურთ წაშლა?\n\n"${item.content}"`)) return;
    const payload = {
      position: item.tourPosition,
      arrayIndex: item.arrayIndex,
      deleted_by: user.username,
      deleted_at: new Date().toISOString(),
    };
    handleContentAction('delete', activeTab, payload);
  };

  const startEdit = (item) => {
    setIsAdding(false);
    setEditingItem(item);
    setFormData({ content: item.content, tourPosition: item.tourPosition.toString() });
    detectTour(item.content);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setIsAdding(false);
    setFormData({ content: '', tourPosition: '' });
    setDetectedTour(null);
  };

  const startAdd = () => {
    cancelEdit();
    setIsAdding(true);
  };

  // --- Effects ---
  useEffect(() => {
    setUser(getCurrentUser());
    fetchData();
  }, [fetchData]);
  console.log("User state:", user);
  // ✅ წვდომის კონტროლი კომპონენტის დასაწყისშივე
  if (loading) {
    return (
      <div className="status-screen">
        <div className="spinner" />
        <p>მონაცემები იტვირთება...</p>
      </div>
    );
  }

  if (!user || !user.is_moder) {
    console.warn("⛔ მიუწვდომელია: მომხმარებელს არ აქვს მოდერატორის უფლებები.");
    return <Navigate to="/" replace />;
  }

  // --- Render Logic ---
  if (loading && dedaenaData.length === 0) {
    return <div className="status-screen"><div className="spinner" /><p>მონაცემთა ბაზა იტვირთება...</p></div>;
  }

  if (error) {
    return <div className="status-screen error"><h2>მონაცემების ჩატვირთვისას მოხდა შეცდომა</h2><p>{error}</p><button onClick={fetchData}>თავიდან ცდა</button></div>;
  }

  const toggleSelectWord = (id) => {
    setSelectedWordIds((prev) =>
      prev.includes(id) ? prev.filter((wid) => wid !== id) : [...prev, id]
    );
  };

  const clearSelectedWords = () => {
    setSelectedWordIds([]);
  };

  return (
    <div className="moderator-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📊 მოდერატორის პანელი</h1>
          <p>მოგესალმებით, {user?.username}!</p>
        </div>
      </header>

      <div className="moderator-full-data">
        <div className="data-controls">
          {/* ძებნის ველი */}
          <div className="search-box" style={{ marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="🔍 ძებნა..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{ width: '100%', maxWidth: '400px' }}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          {/* filter-tabs */}
          <div className="filter-tabs">
            {['words', 'sentences', 'proverbs', 'reading'].map(tab => {
              // თუ არჩეულია კონკრეტული ტური, მხოლოდ ამ ტურის რაოდენობა გამოჩნდეს
              let count = 0;
              if (tourFilter !== 'all') {
                count = allItems.filter(
                  i => i.type === tab && i.tourPosition === parseInt(tourFilter, 10)
                ).length;
              } else {
                count = allItems.filter(i => i.type === tab).length;
              }
              return (
                <button
                  key={tab}
                  className={`tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'words' && <>📝 სიტყვები ({count})</>}
                  {tab === 'sentences' && <>📄 წინადადებები ({count})</>}
                  {tab === 'proverbs' && <>📚 ანდაზები ({count})</>}
                  {tab === 'reading' && <>📖 კითხვა ({count})</>}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <button className="btn-add" onClick={startAdd} disabled={actionLoading}>➕ დამატება</button>
            {/* მონიშნულების გასუფთავება ღილაკი */}
            <button
              className="btn-clear-selected"
              onClick={clearSelectedWords}
              disabled={selectedWordIds.length === 0}
              title="მონიშნულების წაშლა"
            >
              🗑️ მონიშნულების გასუფთავება
            </button>
            <button
              className="btn-clear-tour"
              onClick={() => setTourFilter('all')}
              disabled={tourFilter === 'all'}
              title="არჩეული ტურის გაუქმება"
            >
              ✖️ ტურის გაუქმება
            </button>
          </div>
          <div className="results-count"><span>ნაპოვნია: <strong>{currentData.length}</strong></span></div>

          {/* ✅ 33-ვე ასოს ღილაკები data-controls-ის ბოლოში */}


          {/* <button className="btn-add" onClick={startAdd} disabled={actionLoading}>➕ დამატება</button>
          <div className="results-count"><span>ნაპოვნია: <strong>{currentData.length}</strong></span></div> */}
        </div>
        <div className="pos-sticky">

          <div className="tour-letter-buttons">
            {Array.from({ length: 33 }).map((_, idx) => {
              const tour = dedaenaData[idx];
              if (!tour) return null;
              let btnClass = "tour-letter-btn";
              const selectedIdx = dedaenaData.findIndex(t => String(t.position) === tourFilter);
              if (selectedIdx === idx) {
                btnClass += " active";
              } else if (selectedIdx > -1 && idx < selectedIdx) {
                btnClass += " before-selected";
              } else if (selectedIdx > -1 && idx > selectedIdx) {
                btnClass += " after-selected";
              }
              // ✅ დამატებულია ინფორმაცია ტურის კონტენტზე ღილაკის ზემოთ
              return (
                <div key={tour.position} className="tour-letter-btn-wrapper">
                  <div className="tour-info">
                    <span className={`tour-count words-count${tour.words?.length > 0 ? ' active' : ''}`}>{tour.words?.length || 0}</span>
                    <span className={`tour-count sentences-count${tour.sentences?.length > 0 ? ' active' : ''}`}>{tour.sentences?.length || 0}</span>
                    <span className={`tour-count proverbs-count${tour.proverbs?.length > 0 ? ' active' : ''}`}>{tour.proverbs?.length || 0}</span>
                    <span className={`tour-count reading-count${tour.reading?.length > 0 ? ' active' : ''}`}>{tour.reading?.length || 0}</span>
                  </div>
                  <button
                    className={btnClass}
                    onClick={() => setTourFilter(String(tour.position))}
                    title={`ტური ${tour.position} (${tour.letter})`}
                  >
                    {tour.letter}
                  </button>
                  <span className="tour-position-label">
                    {tour.position}
                  </span>
                </div>
              );
            })}
          </div>
          {/* <div className="tour-letter-buttons">
            {Array.from({ length: 33 }).map((_, idx) => {
              const tour = dedaenaData[idx];
              if (!tour) return null;
              let btnClass = "tour-letter-btn";
              const selectedIdx = dedaenaData.findIndex(t => String(t.position) === tourFilter);
              if (selectedIdx === idx) {
                btnClass += " active";
              } else if (selectedIdx > -1 && idx < selectedIdx) {
                btnClass += " before-selected";
              } else if (selectedIdx > -1 && idx > selectedIdx) {
                btnClass += " after-selected";
              }
              return (
                <div key={tour.position} className="tour-letter-btn-wrapper">
                  <button
                    className={btnClass}
                    onClick={() => setTourFilter(String(tour.position))}
                    title={`ტური ${tour.position} (${tour.letter})`}
                  >
                    {tour.letter}
                  </button>
                  <span className="tour-position-label">
                    {tour.position}
                  </span>
                </div>
              );
            })}
          </div> */}
        </div>

        <div className="content-cards">
          {/* ✅ ანალიზის საერთო ღილაკი */}
          {activeTab !== 'words' && currentData.length > 0 && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button
                className="btn-toggle-analysis"
                onClick={() => setShowAllAnalysis((prev) => !prev)}
                style={{
                  background: '#e3f2fd',
                  color: '#1976d2',
                  border: '1px solid #90caf9',
                  borderRadius: '4px',
                  padding: '6px 18px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {showAllAnalysis ? '📝 ყველა ანალიზის დამალვა' : '📝 ყველა სიტყვების ანალიზი'}
              </button>
            </div>
          )}

          {/* წინადადებები, ანდაზები, კითხვა (items-list) */}
          {activeTab !== 'words' && (
            <div className="items-list">
              {currentData.map((item, idx) => {
                const isSelected = selectedWordIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`${item.type.slice(0, -1)}-card${isSelected ? ' selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      // მონიშვნა/მოხსნა
                      setSelectedWordIds((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((wid) => wid !== item.id)
                          : [...prev, item.id]
                      );
                    }}
                  >
                    <div className="card-header">
                      <div className="tour-badge">
                        <span className="tour-letter">{item.tourLetter}</span>
                        <span className="tour-position">ტური #{item.tourPosition}</span>
                      </div>
                      <div className="header-right">
                        <span className="item-number">#{idx + 1}</span>
                        <div className="card-actions">
                          <button onClick={(e) => { e.stopPropagation(); startEdit(item); }} className="btn-edit" disabled={actionLoading || !!editingItem}>✏️</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="btn-delete" disabled={actionLoading || !!editingItem}>🗑️</button>
                        </div>
                      </div>
                    </div>
                    <div className="card-content">
                      <p className="item-text">{item.content}</p>
                      {item.wordAnalysis && showAllAnalysis && (
                        <div className="word-analysis">
                          <h4 className="analysis-title">📝 სიტყვების ანალიზი:</h4>
                          <div className="word-cards">
                            {item.wordAnalysis.map((wordInfo, wordIdx) => (
                              <div key={wordIdx} className={`word-mini-card ${wordInfo.existsInTours.length === 0 ? 'missing' : 'exists'}`}>
                                <span className="word-text">{wordInfo.word}</span>
                                {wordInfo.existsInTours.length > 0 ? (
                                  <span className="word-tours">
                                    ✅ ტურ{wordInfo.existsInTours.length > 1 ? 'ებ' : ''}ში: {wordInfo.existsInTours.join(', ')}
                                  </span>
                                ) : (
                                  <div className="word-missing-info">
                                    {wordInfo.estimatedTour ? (
                                      <>
                                        <span className="estimated-tour">
                                          📍 შესაბამისი: ტური {wordInfo.estimatedTour.position} ({wordInfo.estimatedTour.letter})
                                        </span>
                                        <button
                                          className="btn-add-word"
                                          onClick={(e) => { e.stopPropagation(); handleAddWordToTour(wordInfo); }}
                                          disabled={actionLoading}
                                        >
                                          ➕ დამატება
                                        </button>
                                      </>
                                    ) : (
                                      <span className="no-tour">❌ ტური ვერ მოიძებნა</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {currentData.length === 0 && !isAdding && !editingItem && (
                <div className="no-results">
                  <p>{searchQuery || tourFilter !== 'all' ? '🔍 შედეგები არ მოიძებნა' : '📭 ამ კატეგორიაში კონტენტი არ არის'}</p>
                </div>
              )}
            </div>
          )}

          {/* სიტყვების ბარათები (words-grid) */}
          {activeTab === 'words' && (
            <div className="words-grid">
              {currentData.map((item, idx) => {
                const isSelectedTour = tourFilter !== 'all' && item.tourPosition === parseInt(tourFilter, 10);
                return (
                  <div
                    key={item.id}
                    className={`word-card${selectedWordIds?.includes?.(item.id) ? ' selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleSelectWord(item.id)}
                  >
                    <div className="card-header">
                      <div className="tour-badge">
                        <span className="tour-letter">{item.tourLetter}</span>
                        <span className={`tour-position${isSelectedTour ? ' highlight' : ''}`}>
                          ტური #{item.tourPosition}
                        </span>
                      </div>
                      <div className="header-right">
                        <span className="item-number">#{idx + 1}</span>
                        <div className="card-actions">
                          <button onClick={() => startEdit(item)} className="btn-edit" disabled={actionLoading || !!editingItem}>✏️</button>
                          <button onClick={() => handleDelete(item)} className="btn-delete" disabled={actionLoading || !!editingItem}>🗑️</button>
                        </div>
                      </div>
                    </div>
                    <div className="card-content">
                      <p className="item-text">{item.content}</p>
                    </div>
                  </div>
                );
              })}
              {currentData.length === 0 && !isAdding && !editingItem && (
                <div className="no-results">
                  <p>{searchQuery || tourFilter !== 'all' ? '🔍 შედეგები არ მოიძებნა' : '📭 ამ კატეგორიაში კონტენტი არ არის'}</p>
                </div>
              )}
            </div>
          )}
        </div>
        {/* // ...existing code... */}

        {/* ...content-cards და სხვა კოდი... */}

        {/* მონიშნულების ბაზიდან წაშლის ღილაკი გვერდის ბოლოზე */}
        {selectedWordIds.length > 0 && (
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <button
              className="btn-delete-selected"
              style={{ background: '#d32f2f', color: '#fff', padding: '10px 24px', borderRadius: '6px', fontSize: '16px', cursor: 'pointer', border: 'none' }}
              onClick={() => {
                if (window.confirm('ნამდვილად გსურთ მონიშნული ელემენტების ბაზიდან წაშლა?')) {
                  selectedWordIds.forEach(id => {
                    const item = currentData.find(i => i.id === id);
                    if (item) handleDelete(item);
                  });
                  setSelectedWordIds([]);
                }
              }}
              disabled={actionLoading}
            >
              🗑️ მონიშნულების ბაზიდან წაშლა
            </button>
          </div>
        )}

        {/* // ...existing code... */}
      </div>

      {/* Modal for Add/Edit */}
      {(isAdding || editingItem) && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="edit-form-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{isAdding ? '➕ ახლის დამატება' : `✏️ რედაქტირება`}</h3>
            <div className="form-row">
              <textarea value={formData.content} onChange={(e) => handleContentChange(e.target.value)} placeholder="შეიყვანეთ ტექსტი..." className="form-textarea" rows={4} autoFocus />
            </div>
            {detectedTour && (
              <div className={`detected-tour ${detectedTour.confidence}`}>
                <div className="detected-info">
                  <span className="detected-icon">🎯</span>
                  <span className="detected-text">აღმოჩენილი ტური: <strong>{detectedTour.letter}</strong> (#{detectedTour.position})</span>
                </div>
                {!formData.tourPosition && <button className="btn-apply-tour" onClick={applyDetectedTour} type="button">✅ გამოყენება</button>}
              </div>
            )}
            <div className="form-row">
              <label className="form-label">ტური {formData.tourPosition && '(არჩეული)'}</label>
              <select value={formData.tourPosition} onChange={(e) => setFormData({ ...formData, tourPosition: e.target.value })} className="form-select">
                <option value="">{detectedTour ? 'ან აირჩიეთ სხვა ტური' : 'აირჩიეთ ტური'}</option>
                {dedaenaData.map(tour => (<option key={tour.position} value={tour.position} className={detectedTour?.position === tour.position ? 'suggested' : ''}>{tour.letter} - ტური #{tour.position}{detectedTour?.position === tour.position ? ' (შემოთავაზებული)' : ''}</option>))}
              </select>
            </div>
            <div className="form-actions">
              <button onClick={isAdding ? handleAdd : () => handleEdit(editingItem)} disabled={actionLoading || (!formData.tourPosition && !detectedTour)} className="btn-save">{actionLoading ? '⏳' : '✅'} შენახვა</button>
              <button onClick={cancelEdit} disabled={actionLoading} className="btn-cancel">❌ გაუქმება</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeratorDashboard;