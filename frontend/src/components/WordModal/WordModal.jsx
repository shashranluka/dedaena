import React, { useState, useEffect } from "react";
import "./WordModal.scss";

const PARTS_OF_SPEECH = [
  { value: "noun", label: "არსებითი სახელი" },
  { value: "verb", label: "ზმნა" },
  { value: "adjective", label: "ზედსართავი სახელი" },
  { value: "adverb", label: "ზმნიზედა" },
  { value: "pronoun", label: "ნაცვალსახელი" },
  { value: "numeral", label: "რიცხვითი სახელი" },
  { value: "particle", label: "ნაწილაკი" },
  { value: "conjunction", label: "კავშირი" },
  { value: "interjection", label: "შორისდებული" },
  { value: "other", label: "სხვა" }
];

const WordModal = ({
  isOpen,
  onClose,
  onSave,
  tourInfo,
  isSubmitting,
  initialData = null // ✅ ახალი prop - initial values
}) => {
  // ✅ Internal form state
  const [formData, setFormData] = useState({
    normalized: '',
    original: '',
    partOfSpeech: ''
  });

  // ✅ Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        normalized: initialData?.normalized || '',
        original: initialData?.original || '',
        partOfSpeech: initialData?.partOfSpeech || ''
      });
    } else {
      // Reset when closed
      setFormData({
        normalized: '',
        original: '',
        partOfSpeech: ''
      });
    }
  }, [isOpen, initialData]);

  // ✅ Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, onClose]);

  // ✅ Handle form field change
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ Handle save with validation
  const handleSave = () => {
    // Validation
    if (!formData.normalized.trim()) {
      alert('❌ გთხოვთ შეიყვანოთ დამარცვლილი სიტყვა!');
      return;
    }

    if (!formData.original.trim()) {
      alert('❌ გთხოვთ შეიყვანოთ საწყისი სიტყვა!');
      return;
    }

    if (!formData.partOfSpeech) {
      alert('❌ გთხოვთ აირჩიოთ მეტყველების ნაწილი!');
      return;
    }

    // ✅ Pass form data to parent
    if (onSave) {
      onSave(formData);
    }
  };

  // ✅ Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ✅ BACKDROP */}
      <div className="modal-backdrop" onClick={onClose}></div>

      {/* ✅ MODAL CONTAINER */}
      <div className="modal-container">
        <div className="modal-content">
          {/* ✅ HEADER */}
          <div className="modal-header">
            <h3>სიტყვის დამატება</h3>
            <button 
              className="btn-close" 
              onClick={onClose} 
              title="დახურვა"
              disabled={isSubmitting}
            >
              ✕
            </button>
          </div>

          {/* ✅ BODY */}
          <div className="modal-body">
            {/* ✅ Normalized Word */}
            <div className="form-field">
              <label>დამარცვლილი სიტყვა:</label>
              <input
                type="text"
                className="word-input"
                placeholder="მაგ: ბაბუა"
                value={formData.normalized}
                onChange={(e) => handleFieldChange('normalized', e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* ✅ Original Word */}
            <div className="form-field">
              <label>საწყისი სიტყვა:</label>
              <input
                type="text"
                className="word-input"
                placeholder="მაგ: ბაბუა."
                value={formData.original}
                onChange={(e) => handleFieldChange('original', e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
              />
            </div>

            {/* ✅ Part of Speech */}
            <div className="form-field">
              <label>მეტყველების ნაწილი:</label>
              <select
                className="word-select"
                value={formData.partOfSpeech}
                onChange={(e) => handleFieldChange('partOfSpeech', e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">აირჩიეთ...</option>
                {PARTS_OF_SPEECH.map(pos => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Tour Info */}
            {tourInfo && (
              <div className="modal-info">
                <small>
                  📚 დაემატება ზოგად ბაზაში<br />
                  🎯 დაემატება <strong>{tourInfo.letter}</strong> ტურში (პოზიცია: {tourInfo.position})
                </small>
              </div>
            )}
          </div>

          {/* ✅ FOOTER */}
          <div className="modal-footer">
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? '⏳ ემატება...' : '💾 შენახვა'}
            </button>
            <button
              className="btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              ❌ გაუქმება
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WordModal;