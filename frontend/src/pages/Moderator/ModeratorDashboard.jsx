import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCurrentUser, getToken } from "../../services/auth";
import api from "../../services/api";
import TourWords from "../../components/TourWords/TourWords";
import TourSentences from "../../components/TourSentences/TourSentences";
import WordModal from "../../components/WordModal/WordModal";
import "./ModeratorDashboard.scss";

const version_data = {
  name: "იაკობ გოგებაშვილი",
  dedaena_table: "gogebashvili_1"
};

const ModeratorDashboard = () => {
  const [user, setUser] = useState(null);
  const [dedaenaData, setDedaenaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTourData, setCurrentTourData] = useState(null);
  const [currentLetterIndex, setCurrentLetterIndex] = useState();
  
  const [editingSentences, setEditingSentences] = useState(new Set());
  const [editedTexts, setEditedTexts] = useState({});

  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [wordModalTourInfo, setWordModalTourInfo] = useState(null);
  const [wordModalInitialData, setWordModalInitialData] = useState(null);
  const [addingWord, setAddingWord] = useState(false);

  console.log("ModeratorDashboard Rendered", dedaenaData);

  const allPrevWords = useMemo(() => {
    if (!dedaenaData || !currentTourData) return [];
    console.log("🔄 Calculating allPrevWords...");
    const currentIndex = dedaenaData.findIndex(tour => tour.id === currentTourData.id);
    const prevWords = [];
    for (let i = 0; i < currentIndex; i++) {
      const tourWords = dedaenaData[i].words.map(w => 
        w.toLowerCase().replace(/-/g, '')
      );
      tourWords.forEach(tourWord => {
        prevWords.push({
          word: tourWord,
          originalWord: dedaenaData[i].words.find(w => 
            w.toLowerCase().replace(/-/g, '') === tourWord
          ),
          tourIndex: i,
          tourNumber: i + 1,
          tourLetter: dedaenaData[i].letter,
          tourPosition: dedaenaData[i].position
        });
      });
    }
    console.log(`✅ allPrevWords calculated: ${prevWords.length} words`);
    return prevWords;
  }, [dedaenaData, currentTourData]);

  const currentWords = useMemo(() => {
    if (!currentTourData) return [];
    return currentTourData.words.map(w => w.toLowerCase().replace(/-/g, ''));
  }, [currentTourData]);

  const currentIndex = useMemo(() => {
    if (!dedaenaData || !currentTourData) return -1;
    return dedaenaData.findIndex(tour => tour.id === currentTourData.id);
  }, [dedaenaData, currentTourData]);

  const fetchDedaenaData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching moderator dedaena data...");
      
      const response = await api.get(`/moderator/dedaena/${version_data.dedaena_table}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        }
      });

      setDedaenaData(response.data.data);
      
      if (currentTourData) {
        const updatedTour = response.data.data.find(
          tour => tour.position === currentTourData.position
        );
        if (updatedTour) {
          setCurrentTourData(updatedTour);
        }
      }

      console.log("✅ Data refreshed successfully!");
    } catch (error) {
      console.error("❌ Error:", error);
      setError(error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  }, [currentTourData]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    fetchDedaenaData();
  }, []);

  const tourClickHandler = (item, index) => {
    console.log("🎯 Tour clicked:", item.letter);
    setCurrentTourData(item);
    setCurrentLetterIndex(index);
  };

  // ===== WORD MODAL HANDLERS =====

  const openWordModal = (wordKey, pureWord, originalWord, estimatedTour) => {
    setWordModalTourInfo(estimatedTour);
    setWordModalInitialData({
      normalized: pureWord,
      original: originalWord,
      partOfSpeech: ''
    });
    setIsWordModalOpen(true);
  };

  const openAddWordModal = (tourData) => {
    setWordModalTourInfo({
      position: tourData.position,
      letter: tourData.letter
    });
    setWordModalInitialData(null);
    setIsWordModalOpen(true);
  };

  const closeWordModal = () => {
    setIsWordModalOpen(false);
    setWordModalTourInfo(null);
    setWordModalInitialData(null);
  };

  // ✅ Save word - Optimistic Update (no page refresh)
  const handleSaveWord = async (formData) => {
    try {
      const token = getToken();
      setAddingWord(true);

      console.log("➕ Adding word:", formData);

      const response = await api.post(
        `/moderator/word/add`,
        {
          normalized_word: formData.normalized.trim(),
          original_word: formData.original.trim(),
          part_of_speech: formData.partOfSpeech,
          position: wordModalTourInfo.position,
          table_name: version_data.dedaena_table,
          added_by: user?.username || 'unknown',
          added_at: new Date().toISOString()
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      console.log("✅ Response:", response.data);

      // ✅ Optimistic Update - განაახლე state პირდაპირ
      const normalizedWord = formData.normalized.trim().toLowerCase();

      // ✅ 1. განაახლე dedaenaData
      setDedaenaData(prevData => {
        return prevData.map(tour => {
          if (tour.position === wordModalTourInfo.position) {
            // ✅ შეამოწმე დუბლიკატი
            const wordExists = tour.words.some(w => 
              w.toLowerCase() === normalizedWord
            );

            if (!wordExists) {
              return {
                ...tour,
                words: [...tour.words, normalizedWord]
              };
            }
          }
          return tour;
        });
      });

      // ✅ 2. განაახლე currentTourData
      if (currentTourData && currentTourData.position === wordModalTourInfo.position) {
        const wordExists = currentTourData.words.some(w => 
          w.toLowerCase() === normalizedWord
        );

        if (!wordExists) {
          setCurrentTourData(prev => ({
            ...prev,
            words: [...prev.words, normalizedWord]
          }));
        }
      }

      alert(
        `✅ სიტყვა დაემატა:\n` +
        `📝 დამარცვლილი: ${response.data.normalized_word}\n` +
        `📖 საწყისი: ${response.data.original_word}\n` +
        `🎯 ${wordModalTourInfo.letter} ტური`
      );

      closeWordModal();

    } catch (error) {
      console.error('❌ Error:', error);
      alert(`❌ შეცდომა: ${error.response?.data?.detail || error.message}`);
    } finally {
      setAddingWord(false);
    }
  };

  // ===== SENTENCE HANDLERS =====

  const toggleEditMode = (sentenceId, sentenceText) => {
    setEditingSentences(prev => {
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
  };

  const updateEditedText = (sentenceId, text) => {
    setEditedTexts(prev => ({ ...prev, [sentenceId]: text }));
  };

  const handleSaveSentence = async (sentenceId) => {
    try {
      const token = getToken();
      
      // ✅ Extract sentence index
      const sentenceIndex = sentenceId.startsWith("sentence-") 
        ? parseInt(sentenceId.split("-")[1]) 
        : parseInt(sentenceId);

      const response = await api.patch(
        `/moderator/sentence/${sentenceId}`, 
        {
          content: editedTexts[sentenceId],
          info: {
            position: currentTourData.position,
            letter: currentTourData.letter,
            table_name: version_data.dedaena_table,
            edited_by: user?.username || 'unknown',
            edited_at: new Date().toISOString()
          }
        }, 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // ✅ Optimistic Update - განაახლე state პირდაპირ
      
      // ✅ 1. განაახლე dedaenaData
      setDedaenaData(prevData => {
        return prevData.map(tour => {
          if (tour.position === currentTourData.position) {
            const newSentences = [...tour.sentences];
            newSentences[sentenceIndex] = editedTexts[sentenceId];
            return {
              ...tour,
              sentences: newSentences
            };
          }
          return tour;
        });
      });

      // ✅ 2. განაახლე currentTourData
      if (currentTourData) {
        const newSentences = [...currentTourData.sentences];
        newSentences[sentenceIndex] = editedTexts[sentenceId];
        setCurrentTourData(prev => ({
          ...prev,
          sentences: newSentences
        }));
      }

      // ✅ 3. Clear editing state
      setEditingSentences(prev => {
        const newSet = new Set(prev);
        newSet.delete(sentenceId);
        return newSet;
      });

      setEditedTexts(prev => {
        const newTexts = { ...prev };
        delete newTexts[sentenceId];
        return newTexts;
      });

      alert('✅ წინადადება წარმატებით შეინახა!');
      
    } catch (error) {
      alert(`❌ შეცდომა: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleCancelEdit = (sentenceId) => {
    setEditingSentences(prev => {
      const newSet = new Set(prev);
      newSet.delete(sentenceId);
      return newSet;
    });
    setEditedTexts(prev => {
      const newTexts = { ...prev };
      delete newTexts[sentenceId];
      return newTexts;
    });
  };

  // ===== WORD UPDATE/DELETE HANDLERS =====

  const handleUpdateWord = useCallback(async (wordIndex, newWord) => {
    if (!currentTourData) return;
    
    try {
      const token = getToken();
      
      const response = await api.patch(
        `/moderator/word/update`,
        {
          position: currentTourData.position,
          word_index: wordIndex,
          new_word: newWord,
          table_name: version_data.dedaena_table,
          edited_by: user?.username || 'unknown',
          edited_at: new Date().toISOString()
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // ✅ Optimistic Update
      const normalizedNewWord = newWord.trim().toLowerCase();

      // ✅ 1. განაახლე dedaenaData
      setDedaenaData(prevData => {
        return prevData.map(tour => {
          if (tour.position === currentTourData.position) {
            const newWords = [...tour.words];
            newWords[wordIndex] = normalizedNewWord;
            return {
              ...tour,
              words: newWords
            };
          }
          return tour;
        });
      });

      // ✅ 2. განაახლე currentTourData
      setCurrentTourData(prev => {
        const newWords = [...prev.words];
        newWords[wordIndex] = normalizedNewWord;
        return {
          ...prev,
          words: newWords
        };
      });

      alert('✅ სიტყვა წარმატებით განახლდა!');
      
    } catch (error) {
      alert(`❌ შეცდომა: ${error.response?.data?.detail || error.message}`);
    }
  }, [currentTourData, user]);

  const handleDeleteWord = useCallback(async (wordIndex) => {
    if (!currentTourData) return;
    
    try {
      const token = getToken();
      
      const response = await api.delete(
        `/moderator/word/delete`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          data: {
            position: currentTourData.position,
            word_index: wordIndex,
            table_name: version_data.dedaena_table,
            deleted_by: user?.username || 'unknown',
            deleted_at: new Date().toISOString()
          }
        }
      );

      // ✅ Optimistic Update

      // ✅ 1. განაახლე dedaenaData
      setDedaenaData(prevData => {
        return prevData.map(tour => {
          if (tour.position === currentTourData.position) {
            const newWords = [...tour.words];
            newWords.splice(wordIndex, 1);
            return {
              ...tour,
              words: newWords
            };
          }
          return tour;
        });
      });

      // ✅ 2. განაახლე currentTourData
      setCurrentTourData(prev => {
        const newWords = [...prev.words];
        newWords.splice(wordIndex, 1);
        return {
          ...prev,
          words: newWords
        };
      });

      alert('✅ სიტყვა წარმატებით წაიშალა!');
      
    } catch (error) {
      alert(`❌ შეცდომა: ${error.response?.data?.detail || error.message}`);
    }
  }, [currentTourData, user]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>იტვირთება...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>შეცდომა</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>თავიდან ცდა</button>
      </div>
    );
  }

  return (
    <div className="moderator-dashboard">
      <header className="dashboard-header">
        <h1>Moderator Dashboard</h1>
        <p>მოგესალმებით, {user?.username}!</p>
      </header>

      {dedaenaData && (
        <div>
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
            />
          </div>
        </div>
      )}

      <WordModal
        isOpen={isWordModalOpen}
        onClose={closeWordModal}
        onSave={handleSaveWord}
        tourInfo={wordModalTourInfo}
        initialData={wordModalInitialData}
        isSubmitting={addingWord}
      />
    </div>
  );
};

export default ModeratorDashboard;