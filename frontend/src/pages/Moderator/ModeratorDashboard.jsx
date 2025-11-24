import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCurrentUser, getToken } from "../../services/auth";
import api from "../../services/api";
import TourWords from "../../components/TourWords/TourWords";
import TourSentences from "../../components/TourSentences/TourSentences";
import WordModal from "../../components/WordModal/WordModal";
import TourProverbs from "../../components/TourProverbs/TourProverbs";
import ModeratorFullData from "../../components/ModeratorFullData/ModeratorFullData";
import "./ModeratorDashboard.scss";

// ✅ 1. Constants extraction
const VERSION_DATA = {
  name: "იაკობ გოგებაშვილი",
  dedaena_table: "gogebashvili_1_test"
};

const CONTENT_TYPES = {
  WORD: 'word',
  SENTENCE: 'sentence',
  PROVERB: 'proverb',
  READING: 'reading'
};

// ✅ 2. Helper functions
const normalizeWord = (word) => word.toLowerCase().replace(/-/g, '');

const showSuccessMessage = (type, action = 'დაემატა') => {
  alert(`✅ ${type} წარმატებით ${action}!`);
};

const showErrorMessage = (error) => {
  const message = error.response?.data?.detail || error.message;
  alert(`❌ შეცდომა: ${message}`);
};

const ModeratorDashboard = () => {
  // ✅ 3. Group related state
  const [user, setUser] = useState(null);
  const [dedaenaData, setDedaenaData] = useState(null);
  const [currentTourData, setCurrentTourData] = useState(null);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullData, setShowFullData] = useState(false);
  
  // Edit states
  const [editingSentences, setEditingSentences] = useState(new Set());
  const [editedTexts, setEditedTexts] = useState({});
  
  // Modal states
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [wordModalTourInfo, setWordModalTourInfo] = useState(null);
  const [wordModalInitialData, setWordModalInitialData] = useState(null);
  const [addingWord, setAddingWord] = useState(false);

  // ✅ 4. Memoized computed values
  const currentIndex = useMemo(() => {
    if (!dedaenaData || !currentTourData) return -1;
    return dedaenaData.findIndex(tour => tour.id === currentTourData.id);
  }, [dedaenaData, currentTourData]);

  const allPrevWords = useMemo(() => {
    if (!dedaenaData || currentIndex === -1) return [];
    
    const words = [];
    for (let i = 0; i < currentIndex; i++) {
      const tour = dedaenaData[i];
      tour.words.forEach(word => {
        const normalized = normalizeWord(word);
        words.push({
          word: normalized,
          originalWord: word,
          tourIndex: i,
          tourNumber: i + 1,
          tourLetter: tour.letter,
          tourPosition: tour.position
        });
      });
    }
    return words;
  }, [dedaenaData, currentIndex]);

  const currentWords = useMemo(() => {
    if (!currentTourData) return [];
    return currentTourData.words.map(normalizeWord);
  }, [currentTourData]);

  // ✅ 5. Data fetching - ONLY for initial load
  const fetchDedaenaData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(
        `/moderator/dedaena/${VERSION_DATA.dedaena_table}`,
        { headers: { 'Authorization': `Bearer ${getToken()}` } }
      );

      setDedaenaData(response.data.data);

      // Set first tour as default if none selected
      if (!currentTourData && response.data.data.length > 0) {
        setCurrentTourData(response.data.data[0]);
        setCurrentLetterIndex(0);
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setError(error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Empty dependencies - only initial load

  // ✅ 6. Optimistic update helper - UPDATED
  const updateTourData = useCallback((position, updateFn) => {
    setDedaenaData(prevData => 
      prevData.map(tour => 
        tour.position === position ? updateFn(tour) : tour
      )
    );

    if (currentTourData?.position === position) {
      setCurrentTourData(prev => updateFn(prev));
    }
  }, [currentTourData]);

  // ✅ 7. Generic CRUD handlers - REMOVE fetchDedaenaData() calls
  const handleContentAdd = useCallback(async (type, data) => {
    try {
      const token = getToken();
      const payload = {
        position: data.position,
        content: data.content,
        table_name: VERSION_DATA.dedaena_table,
        added_by: user?.username || 'unknown',
        added_at: new Date().toISOString()
      };

      const fieldMap = {
        [CONTENT_TYPES.WORD]: 'word',
        [CONTENT_TYPES.SENTENCE]: 'sentence',
        [CONTENT_TYPES.PROVERB]: 'proverb',
        [CONTENT_TYPES.READING]: 'reading_text'
      };

      payload[fieldMap[type]] = data.content;

      const response = await api.post(
        `/moderator/${type}/add`,
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // ✅ Optimistic update instead of fetchDedaenaData()
      updateTourData(data.position, tour => {
        const updatedTour = { ...tour };
        
        if (type === CONTENT_TYPES.WORD) {
          updatedTour.words = [...(tour.words || []), data.content];
        } else if (type === CONTENT_TYPES.SENTENCE) {
          updatedTour.sentences = [...(tour.sentences || []), data.content];
        } else if (type === CONTENT_TYPES.PROVERB) {
          updatedTour.proverbs = [...(tour.proverbs || []), data.content];
        } else if (type === CONTENT_TYPES.READING) {
          updatedTour.reading = [...(tour.reading || []), data.content];
        }
        
        return updatedTour;
      });

      showSuccessMessage(type);

    } catch (error) {
      console.error('❌ Add error:', error);
      showErrorMessage(error);
      throw error;
    }
  }, [user, updateTourData]);

  const handleContentUpdate = useCallback(async (type, data) => {
    try {
      const token = getToken();
      const payload = {
        position: data.position,
        table_name: VERSION_DATA.dedaena_table,
        edited_by: user?.username || 'unknown',
        edited_at: new Date().toISOString()
      };

      const fieldMap = {
        [CONTENT_TYPES.WORD]: { index: 'word_index', content: 'new_word' },
        [CONTENT_TYPES.SENTENCE]: { index: 'sentence_index', content: 'new_sentence' },
        [CONTENT_TYPES.PROVERB]: { index: 'proverb_index', content: 'new_proverb' },
        [CONTENT_TYPES.READING]: { index: 'reading_index', content: 'new_reading' }
      };

      const fields = fieldMap[type];
      payload[fields.index] = data.index;
      payload[fields.content] = data.content;

      await api.patch(
        `/moderator/${type}/update`,
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // ✅ Optimistic update instead of fetchDedaenaData()
      updateTourData(data.position, tour => {
        const updatedTour = { ...tour };
        
        if (type === CONTENT_TYPES.WORD && updatedTour.words) {
          updatedTour.words = [...updatedTour.words];
          updatedTour.words[data.index] = data.content;
        } else if (type === CONTENT_TYPES.SENTENCE && updatedTour.sentences) {
          updatedTour.sentences = [...updatedTour.sentences];
          updatedTour.sentences[data.index] = data.content;
        } else if (type === CONTENT_TYPES.PROVERB && updatedTour.proverbs) {
          updatedTour.proverbs = [...updatedTour.proverbs];
          updatedTour.proverbs[data.index] = data.content;
        } else if (type === CONTENT_TYPES.READING && updatedTour.reading) {
          updatedTour.reading = [...updatedTour.reading];
          updatedTour.reading[data.index] = data.content;
        }
        
        return updatedTour;
      });

      showSuccessMessage(type, 'განახლდა');

    } catch (error) {
      console.error('❌ Update error:', error);
      showErrorMessage(error);
      throw error;
    }
  }, [user, updateTourData]);

  const handleContentDelete = useCallback(async (type, data) => {
    try {
      const token = getToken();
      const payload = {
        position: data.position,
        table_name: VERSION_DATA.dedaena_table,
        deleted_by: user?.username || 'unknown',
        deleted_at: new Date().toISOString()
      };

      const indexFieldMap = {
        [CONTENT_TYPES.WORD]: 'word_index',
        [CONTENT_TYPES.SENTENCE]: 'sentence_index',
        [CONTENT_TYPES.PROVERB]: 'proverb_index',
        [CONTENT_TYPES.READING]: 'reading_index'
      };

      payload[indexFieldMap[type]] = data.index;

      await api.delete(
        `/moderator/${type}/delete`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          data: payload
        }
      );

      // ✅ Optimistic update instead of fetchDedaenaData()
      updateTourData(data.position, tour => {
        const updatedTour = { ...tour };
        
        if (type === CONTENT_TYPES.WORD && updatedTour.words) {
          updatedTour.words = [...updatedTour.words];
          updatedTour.words.splice(data.index, 1);
        } else if (type === CONTENT_TYPES.SENTENCE && updatedTour.sentences) {
          updatedTour.sentences = [...updatedTour.sentences];
          updatedTour.sentences.splice(data.index, 1);
        } else if (type === CONTENT_TYPES.PROVERB && updatedTour.proverbs) {
          updatedTour.proverbs = [...updatedTour.proverbs];
          updatedTour.proverbs.splice(data.index, 1);
        } else if (type === CONTENT_TYPES.READING && updatedTour.reading) {
          updatedTour.reading = [...updatedTour.reading];
          updatedTour.reading.splice(data.index, 1);
        }
        
        return updatedTour;
      });

      showSuccessMessage(type, 'წაიშალა');

    } catch (error) {
      console.error('❌ Delete error:', error);
      showErrorMessage(error);
      throw error;
    }
  }, [user, updateTourData]);

  // ✅ 8. Word-specific handlers - ALREADY HAVE updateTourData (keep as is)
  const handleUpdateWord = useCallback(async (wordIndex, newWord) => {
    if (!currentTourData) return;

    try {
      const token = getToken();
      await api.patch(
        `/moderator/word/update`,
        {
          position: currentTourData.position,
          word_index: wordIndex,
          new_word: newWord,
          table_name: VERSION_DATA.dedaena_table,
          edited_by: user?.username || 'unknown',
          edited_at: new Date().toISOString()
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const normalized = normalizeWord(newWord.trim());
      updateTourData(currentTourData.position, tour => {
        const newWords = [...tour.words];
        newWords[wordIndex] = normalized;
        return { ...tour, words: newWords };
      });

      showSuccessMessage('სიტყვა', 'განახლდა');

    } catch (error) {
      showErrorMessage(error);
    }
  }, [currentTourData, user, updateTourData]);

  const handleDeleteWord = useCallback(async (wordIndex) => {
    if (!currentTourData) return;

    try {
      const token = getToken();
      await api.delete(
        `/moderator/word/delete`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          data: {
            position: currentTourData.position,
            word_index: wordIndex,
            table_name: VERSION_DATA.dedaena_table,
            deleted_by: user?.username || 'unknown',
            deleted_at: new Date().toISOString()
          }
        }
      );

      updateTourData(currentTourData.position, tour => {
        const newWords = [...tour.words];
        newWords.splice(wordIndex, 1);
        return { ...tour, words: newWords };
      });

      showSuccessMessage('სიტყვა', 'წაიშალა');

    } catch (error) {
      showErrorMessage(error);
    }
  }, [currentTourData, user, updateTourData]);

  const addWordRelevantTour = useCallback(async (pureWord, originalWord, estimatedTour, partOfSpeech) => {
    if (!estimatedTour) return;

    try {
      const token = getToken();
      const normalized = normalizeWord(pureWord.trim());

      // ✅ შევამოწმოთ, სიტყვა უკვე ხომ არ არსებობს ტურში
      const targetTour = dedaenaData.find(tour => tour.position === estimatedTour.position);
      if (targetTour && targetTour.words.some(w => normalizeWord(w) === normalized)) {
        alert(`ℹ️ სიტყვა "${normalized}" უკვე არსებობს "${estimatedTour.letter}" ტურში.`);
        return;
      }

      // ✅ ვიძახებთ endpoint-ს, რომელიც ამატებს სიტყვას მხოლოდ კონკრეტულ ტურში
      await api.post(
        `/moderator/tour/add-word`,
        {
          word_data: {
            normalized_word: normalized,
            original_word: originalWord.trim(),
            part_of_speech: partOfSpeech,
          },
          position: estimatedTour.position,
          table_name: VERSION_DATA.dedaena_table,
          added_by: user?.username || 'unknown',
          added_at: new Date().toISOString()
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // ✅ ოპტიმისტური განახლება
      updateTourData(estimatedTour.position, tour => {
        // ვქმნით ახალ მასივს, რომ React-მა ცვლილება აღიქვას
        const newWords = [...(tour.words || []), normalized];
        return { ...tour, words: newWords };
      });

      alert(
        `✅ სიტყვა "${normalized}" წარმატებით დაემატა "${estimatedTour.letter}" ტურს!`
      );

    } catch (error) {
      showErrorMessage(error);
    }
  }, [user, updateTourData, dedaenaData]);

  const handleSaveWord = useCallback(async (formData) => {
    try {
      setAddingWord(true);
      const token = getToken();

      const response = await api.post(
        `/moderator/word/add`,
        {
          normalized_word: formData.normalized.trim(),
          original_word: formData.original.trim(),
          part_of_speech: formData.partOfSpeech,
          position: wordModalTourInfo.position,
          table_name: VERSION_DATA.dedaena_table,
          added_by: user?.username || 'unknown',
          added_at: new Date().toISOString()
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const normalized = normalizeWord(formData.normalized.trim());

      updateTourData(wordModalTourInfo.position, tour => {
        if (tour.words.some(w => normalizeWord(w) === normalized)) {
          return tour;
        }
        return { ...tour, words: [...tour.words, normalized] };
      });

      alert(
        `✅ სიტყვა დაემატა:\n` +
        `📝 დამარცვლილი: ${response.data.normalized_word}\n` +
        `📖 საწყისი: ${response.data.original_word}\n` +
        `🎯 ${wordModalTourInfo.letter} ტური`
      );

      closeWordModal();

    } catch (error) {
      showErrorMessage(error);
    } finally {
      setAddingWord(false);
    }
  }, [wordModalTourInfo, user, updateTourData]);

  // ✅ 9. Proverb handlers - ALREADY HAVE updateTourData (keep as is)
  const handleAddProverb = useCallback(async (proverbText) => {
    if (!currentTourData) return;

    try {
      const token = getToken();
      await api.post(
        `/moderator/proverb/add`,
        {
          position: currentTourData.position,
          proverb: proverbText,
          table_name: VERSION_DATA.dedaena_table,
          added_by: user?.username || 'unknown',
          added_at: new Date().toISOString()
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      updateTourData(currentTourData.position, tour => ({
        ...tour,
        proverbs: [...(tour.proverbs || []), proverbText]
      }));

      showSuccessMessage('ანდაზა');

    } catch (error) {
      showErrorMessage(error);
    }
  }, [currentTourData, user, updateTourData]);

  const handleUpdateProverb = useCallback(async (proverbIndex, newText) => {
    if (!currentTourData) return;

    try {
      const token = getToken();
      await api.patch(
        `/moderator/proverb/update`,
        {
          position: currentTourData.position,
          proverb_index: proverbIndex,
          new_proverb: newText,
          table_name: VERSION_DATA.dedaena_table,
          edited_by: user?.username || 'unknown',
          edited_at: new Date().toISOString()
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      updateTourData(currentTourData.position, tour => {
        const newProverbs = [...(tour.proverbs || [])];
        newProverbs[proverbIndex] = newText;
        return { ...tour, proverbs: newProverbs };
      });

      showSuccessMessage('ანდაზა', 'განახლდა');

    } catch (error) {
      showErrorMessage(error);
    }
  }, [currentTourData, user, updateTourData]);

  const handleDeleteProverb = useCallback(async (proverbIndex) => {
    if (!currentTourData) return;

    try {
      const token = getToken();
      await api.delete(
        `/moderator/proverb/delete`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          data: {
            position: currentTourData.position,
            proverb_index: proverbIndex,
            table_name: VERSION_DATA.dedaena_table,
            deleted_by: user?.username || 'unknown',
            deleted_at: new Date().toISOString()
          }
        }
      );

      updateTourData(currentTourData.position, tour => {
        const newProverbs = [...(tour.proverbs || [])];
        newProverbs.splice(proverbIndex, 1);
        return { ...tour, proverbs: newProverbs };
      });

      showSuccessMessage('ანდაზა', 'წაიშალა');

    } catch (error) {
      showErrorMessage(error);
    }
  }, [currentTourData, user, updateTourData]);

  // ✅ 10. Sentence handlers - ALREADY HAVE updateTourData (keep as is)
  const handleSaveSentence = useCallback(async (sentenceId) => {
    try {
      const token = getToken();
      const sentenceIndex = sentenceId.startsWith("sentence-")
        ? parseInt(sentenceId.split("-")[1])
        : parseInt(sentenceId);

      await api.patch(
        `/moderator/sentence/${sentenceId}`,
        {
          content: editedTexts[sentenceId],
          info: {
            position: currentTourData.position,
            letter: currentTourData.letter,
            table_name: VERSION_DATA.dedaena_table,
            edited_by: user?.username || 'unknown',
            edited_at: new Date().toISOString()
          }
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      updateTourData(currentTourData.position, tour => {
        const newSentences = [...tour.sentences];
        newSentences[sentenceIndex] = editedTexts[sentenceId];
        return { ...tour, sentences: newSentences };
      });

      setEditingSentences(prev => {
        const newSet = new Set(prev);
        newSet.delete(sentenceId);
        return newSet;
      });

      setEditedTexts(prev => {
        const { [sentenceId]: _, ...rest } = prev;
        return rest;
      });

      showSuccessMessage('წინადადება', 'შეინახა');

    } catch (error) {
      showErrorMessage(error);
    }
  }, [editedTexts, currentTourData, user, updateTourData]);

  const toggleEditMode = useCallback((sentenceId, sentenceText) => {
    setEditingSentences(prev => {
      console.log(prev,"ewwww");
      const newSet = new Set(prev);
      if (newSet.has(sentenceId)) {
        newSet.delete(sentenceId);
      } else {
        newSet.add(sentenceId);
        setEditedTexts(prevTexts => ({
          ...prevTexts,
          [sentenceId]: sentenceText
        }));
      }
      return newSet;
    });
  }, []);

  const updateEditedText = useCallback((sentenceId, text) => {
    setEditedTexts(prev => ({ ...prev, [sentenceId]: text }));
  }, []);

  const handleCancelEdit = useCallback((sentenceId) => {
    setEditingSentences(prev => {
      const newSet = new Set(prev);
      newSet.delete(sentenceId);
      return newSet;
    });
    setEditedTexts(prev => {
      const { [sentenceId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // ✅ 11. Modal handlers
  const openWordModal = useCallback((wordKey, pureWord, originalWord, estimatedTour) => {
    setWordModalTourInfo(estimatedTour);
    setWordModalInitialData({
      normalized: pureWord,
      original: originalWord,
      partOfSpeech: ''
    });
    setIsWordModalOpen(true);
  }, []);

  const openAddWordModal = useCallback((tourData) => {
    setWordModalTourInfo({
      position: tourData.position,
      letter: tourData.letter
    });
    setWordModalInitialData(null);
    setIsWordModalOpen(true);
  }, []);

  const closeWordModal = useCallback(() => {
    setIsWordModalOpen(false);
    setWordModalTourInfo(null);
    setWordModalInitialData(null);
  }, []);

  // ✅ 12. Tour navigation
  const tourClickHandler = useCallback((item, index) => {
    setCurrentTourData(item);
    setCurrentLetterIndex(index);
  }, []);

  // ✅ 13. Effects
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    fetchDedaenaData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 14. Loading & Error states
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>იტვირთება...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>შეცდომა</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          თავიდან ცდა
        </button>
      </div>
    );
  }

  // ✅ 15. Main render
  return (
    <div className="moderator-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>📊 Moderator Dashboard</h1>
            <p>მოგესალმებით, {user?.username}!</p>
          </div>
          
          <div className="header-actions">
            <button 
              className={`btn-toggle-full-data ${showFullData ? 'active' : ''}`}
              onClick={() => setShowFullData(prev => !prev)}
              title={showFullData ? 'სრული ბაზის დამალვა' : 'სრული ბაზის ჩვენება'}
            >
              <span className="icon">{showFullData ? '🔼' : '🔽'}</span>
              <span className="text">
                {showFullData ? 'სრული ბაზის დამალვა' : 'სრული ბაზის ჩვენება'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {dedaenaData && (
        <>
          {/* {showFullData && (
            <div className="general-data">
              <ModeratorFullData 
                dedaenaData={dedaenaData}
                allPrevWords={allPrevWords}
                currentWords={currentWords}
                currentUser={user}
                tableName={VERSION_DATA.dedaena_table}
                onContentAdd={handleContentAdd}
                onContentUpdate={handleContentUpdate}
                onContentDelete={handleContentDelete}
                addWordRelevantTour={addWordRelevantTour}
              />
            </div>
          )} */}

          <div className="tour-container">
            <div className="tour-buttons-container flex-wrap">
              {dedaenaData.map((item, index) => (
                <div
                  className={`tour-button ${currentLetterIndex === index ? 'selected' : ''}`}
                  key={item.id}
                  onClick={() => tourClickHandler(item, index)}
                >
                  {item.letter}
                </div>
              ))}
            </div>
          </div>

          <div className="tour-data-display">
            <TourWords
              currentTourData={currentTourData}
              onUpdateWord={handleUpdateWord}
              onDeleteWord={handleDeleteWord}
              onAddWord={openAddWordModal}
            />

            <TourSentences
              currentTourData={currentTourData}
              dedaenaData={dedaenaData}
              allPrevWords={allPrevWords}
              currentWords={currentWords}
              currentIndex={currentIndex}
              editingSentences={editingSentences}
              editedTexts={editedTexts}
              onToggleEdit={toggleEditMode}
              onUpdateText={updateEditedText}
              onSave={handleSaveSentence}
              onCancel={handleCancelEdit}
              onOpenWordModal={openWordModal}
              handleSaveWord={handleSaveWord}
              addWordRelevantTour={addWordRelevantTour}
            />

            <TourProverbs
              currentTourData={currentTourData}
              onAddProverb={handleAddProverb}
              onUpdateProverb={handleUpdateProverb}
              onDeleteProverb={handleDeleteProverb}
            />
          </div>
        </>
      )}

      {/* <WordModal
        isOpen={isWordModalOpen}
        onClose={closeWordModal}
        onSave={handleSaveWord}
        tourInfo={wordModalTourInfo}
        initialData={wordModalInitialData}
        isSubmitting={addingWord}
      /> */}
    </div>
  );
};

export default ModeratorDashboard;