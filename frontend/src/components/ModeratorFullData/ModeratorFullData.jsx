import React, { useState, useMemo } from 'react';
import './ModeratorFullData.scss';

const ModeratorFullData = ({ 
  dedaenaData, 
  currentUser, 
  onContentAction, // Using the single action handler from Dashboard
}) => {
  // --- UI & Filter State ---
  const [activeTab, setActiveTab] = useState('words');
  const [searchQuery, setSearchQuery] = useState('');
  const [tourFilter, setTourFilter] = useState('all');

  // --- Form & Editing State ---
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ content: '', tourPosition: '' });
  const [detectedTour, setDetectedTour] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Data Processing ---
  const allItems = useMemo(() => {
    const items = [];
    dedaenaData.forEach(tour => {
      (tour.words || []).forEach((content, index) => items.push({ type: 'words', content, arrayIndex: index, tourPosition: tour.position, tourLetter: tour.letter }));
      (tour.sentences || []).forEach((content, index) => items.push({ type: 'sentences', content, arrayIndex: index, tourPosition: tour.position, tourLetter: tour.letter }));
      (tour.proverbs || []).forEach((content, index) => items.push({ type: 'proverbs', content, arrayIndex: index, tourPosition: tour.position, tourLetter: tour.letter }));
      (tour.reading || []).forEach((content, index) => items.push({ type: 'reading', content, arrayIndex: index, tourPosition: tour.position, tourLetter: tour.letter }));
    });
    return items.map((item) => ({ ...item, id: `${item.tourPosition}-${item.type}-${item.arrayIndex}` }));
  }, [dedaenaData]);

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

  // --- Tour Detection ---
  const detectTour = (text) => {
    if (!text || !text.trim()) { setDetectedTour(null); return; }
    const content = text.trim();
    const estimatedTour = dedaenaData.slice().reverse().find(tour => content.includes(tour.letter));
    if (estimatedTour) {
      setDetectedTour({ position: estimatedTour.position, letter: estimatedTour.letter, confidence: content[0] === estimatedTour.letter ? 'high' : 'medium' });
    } else {
      setDetectedTour(null);
    }
  };

  const handleContentChange = (text) => {
    setFormData({ ...formData, content: text });
    detectTour(text);
  };

  const applyDetectedTour = () => {
    if (detectedTour) setFormData({ ...formData, tourPosition: detectedTour.position.toString() });
  };

  // --- CRUD Handlers using onContentAction ---
  const handleAdd = async () => {
    const finalPosition = formData.tourPosition || detectedTour?.position;
    if (!formData.content.trim() || !finalPosition) { alert("ტექსტი და ტური არ უნდა იყოს ცარიელი."); return; }
    setLoading(true);
    try {
      const payload = {
        position: parseInt(finalPosition),
        content: formData.content.trim(),
        added_by: currentUser.username,
        added_at: new Date().toISOString(),
      };
      await onContentAction('add', activeTab, payload);
      cancelEdit();
    } catch (error) { /* Parent handles error message */ } 
    finally { setLoading(false); }
  };

  const handleEdit = async (item) => {
    if (!formData.content.trim()) { alert('ტექსტი არ უნდა იყოს ცარიელი.'); return; }
    setLoading(true);
    try {
      const payload = {
        position: detectedTour?.position || item.tourPosition,
        arrayIndex: item.arrayIndex,
        content: formData.content.trim(),
        edited_by: currentUser.username,
        edited_at: new Date().toISOString(),
      };
      await onContentAction('update', activeTab, payload);
      cancelEdit();
    } catch (error) { /* Parent handles error message */ } 
    finally { setLoading(false); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`დარწმუნებული ხართ რომ გსურთ წაშლა?\n\n"${item.content}"`)) return;
    setLoading(true);
    try {
      const payload = {
        position: item.tourPosition,
        arrayIndex: item.arrayIndex,
        deleted_by: currentUser.username,
        deleted_at: new Date().toISOString(),
      };
      await onContentAction('delete', activeTab, payload);
    } catch (error) { /* Parent handles error message */ } 
    finally { setLoading(false); }
  };

  // --- UI State Handlers ---
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

  // --- Render ---
  return (
    <div className="moderator-full-data">
      <div className="data-controls">
        <div className="search-box">
          <input type="text" placeholder="🔍 ძებნა..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
          {searchQuery && <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>}
        </div>
        <select value={tourFilter} onChange={(e) => setTourFilter(e.target.value)} className="tour-filter-select">
          <option value="all">ყველა ტური</option>
          {dedaenaData.map(tour => (<option key={tour.position} value={tour.position}>ტური {tour.position} ({tour.letter})</option>))}
        </select>
        <div className="filter-tabs">
          <button className={`tab ${activeTab === 'words' ? 'active' : ''}`} onClick={() => setActiveTab('words')}>📝 სიტყვები ({totalCounts.words})</button>
          <button className={`tab ${activeTab === 'sentences' ? 'active' : ''}`} onClick={() => setActiveTab('sentences')}>📄 წინადადებები ({totalCounts.sentences})</button>
          <button className={`tab ${activeTab === 'proverbs' ? 'active' : ''}`} onClick={() => setActiveTab('proverbs')}>📚 ანდაზები ({totalCounts.proverbs})</button>
          <button className={`tab ${activeTab === 'reading' ? 'active' : ''}`} onClick={() => setActiveTab('reading')}>📖 კითხვა ({totalCounts.reading})</button>
        </div>
        <button className="btn-add" onClick={startAdd} disabled={loading}>➕ დამატება</button>
        <div className="results-count"><span>ნაპოვნია: <strong>{currentData.length}</strong></span></div>
      </div>

      {(isAdding || editingItem) && (
        <div className="edit-form">
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
            <button onClick={isAdding ? handleAdd : () => handleEdit(editingItem)} disabled={loading || (!formData.tourPosition && !detectedTour)} className="btn-save">{loading ? '⏳' : '✅'} შენახვა</button>
            <button onClick={cancelEdit} disabled={loading} className="btn-cancel">❌ გაუქმება</button>
          </div>
        </div>
      )}

      <div className="content-cards">
        <div className={activeTab === 'words' ? 'words-grid' : 'items-list'}>
          {currentData.map((item, idx) => (
            <div key={item.id} className={`${item.type.slice(0, -1)}-card`}>
              <div className="card-header">
                <div className="tour-badge">
                  <span className="tour-letter">{item.tourLetter}</span>
                  <span className="tour-position">ტური #{item.tourPosition}</span>
                </div>
                <div className="header-right">
                  <span className="item-number">#{idx + 1}</span>
                  <div className="card-actions">
                    <button onClick={() => startEdit(item)} className="btn-edit" disabled={loading || !!editingItem}>✏️</button>
                    <button onClick={() => handleDelete(item)} className="btn-delete" disabled={loading || !!editingItem}>🗑️</button>
                  </div>
                </div>
              </div>
              <div className="card-content">
                <p className="item-text">{item.content}</p>
              </div>
            </div>
          ))}
        </div>
        {currentData.length === 0 && !isAdding && !editingItem && (
          <div className="no-results">
            <p>{searchQuery || tourFilter !== 'all' ? '🔍 შედეგები არ მოიძებნა' : '📭 ამ კატეგორიაში კონტენტი არ არის'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorFullData;