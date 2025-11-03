import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./GameDedaena.scss";
import { useGameData } from "../../hooks/useGameData";
import TopControls from "../../components/topControls/TopControls";
import TableOfContents from "../../components/TableOfContents/TableOfContents";
import WordsList from "../../components/WordsList/WordsList";
import WordCreator from "../../components/WordCreator/WordCreator";
import SentenceList from "../../components/SentenceList/SentenceList";
import SentenceCreator from "../../components/SentenceCreator/SentenceCreator";
import StatsPanel from "../../components/StatsPanel/StatsPanel";
import { getPositionProverbs } from "../../utils/getData";

const version_data = { name: "იაკობ გოგებაშვილი", dedaena_table: "gogebashvili_1" };

function GameDedaena() {
  const [selected, setSelected] = useState([]);
  const [foundWordsByPosition, setFoundWordsByPosition] = useState({});
  const [foundSentencesByPosition, setFoundSentencesByPosition] = useState({});
  const [message, setMessage] = useState("");
  const [userSentence, setUserSentence] = useState("");
  const [sentenceMessage, setSentenceMessage] = useState("");
  const [activeView, setActiveView] = useState('create');
  const [position, setPosition] = useState(2);

  const { letters, words, sentences, staticData, loading, error } = useGameData(version_data, position);

  useEffect(() => {
    if (error) {
      setMessage(`შეცდომა: ${error}`);
    }
  }, [error]);

  // Computed values
  const currentFoundWords = useMemo(() => foundWordsByPosition[position] || [], [foundWordsByPosition, position]);
  const currentFoundSentences = useMemo(() => foundSentencesByPosition[position] || [], [foundSentencesByPosition, position]);
  const allFoundWords = useMemo(() => {
    const allWords = [];
    Object.values(foundWordsByPosition).forEach(positionWords => {
      allWords.push(...positionWords);
    });
    return [...new Set(allWords)];
  }, [foundWordsByPosition]);

  const currentLetter = useMemo(() => {
    if (!staticData || staticData.length === 0) return '';
    return staticData[position - 1]?.letter || '';
  }, [staticData, position]);

  const totalFoundWordsCount = useMemo(() => {
    return Object.values(foundWordsByPosition).reduce((total, positionWords) =>
      total + positionWords.length, 0);
  }, [foundWordsByPosition]);

  const totalFoundSentencesCount = useMemo(() => {
    return Object.values(foundSentencesByPosition).reduce((total, positionSentences) =>
      total + positionSentences.length, 0);
  }, [foundSentencesByPosition]);

  // Check if a position is completed (all words and sentences found)
  const isPositionCompleted = useCallback((pos) => {
    if (!staticData || !staticData[pos - 1]) return false;
    
    const positionData = staticData[pos - 1];
    const foundWords = foundWordsByPosition[pos] || [];
    const foundSentences = foundSentencesByPosition[pos] || [];
    
    const wordCount = positionData.word_count || 0;
    const sentenceCount = positionData.sentence_count || 0;
    
    return foundWords.length >= wordCount && foundSentences.length >= sentenceCount;
  }, [staticData, foundWordsByPosition, foundSentencesByPosition]);

  // Check if current position is completed
  const isCurrentPositionCompleted = useMemo(() => {
    return isPositionCompleted(position);
  }, [position, isPositionCompleted]);

  // Event handlers
  const handleLetterClick = useCallback((letter) => {
    setSelected(prev => [...prev, letter]);
    setMessage("");
  }, []);

  const handleCheck = useCallback(() => {
    const word = selected.join("");
    const currentWords = foundWordsByPosition[position] || [];
    const pureWords = words.map(w => w.trim().replace(/[-–—]/g, ''));
    console.log('Checking word:', word, 'at position:', currentWords);
    if (pureWords.includes(word) && !currentWords.includes(word)) {
      setFoundWordsByPosition(prev => ({
        ...prev,
        [position]: [...currentWords, word]
      }));
      setMessage("სწორია!");
    } else if (currentWords.includes(word)) {
      setMessage("ეს სიტყვა უკვე მოძებნილია!");
    } else {
      setMessage("არასწორი კომბინაცია!");
    }
    setSelected([]);
  }, [selected, words, foundWordsByPosition, position]);

  const handleClear = useCallback(() => {
    setSelected([]);
    setMessage("");
  }, []);

  const addWordToSentence = useCallback((word) => {
    setUserSentence(prev => prev + (prev ? " " : "") + word);
    setSentenceMessage("");
  }, []);

  const clearSentence = useCallback(() => {
    setUserSentence("");
    setSentenceMessage("");
  }, []);

  const checkSentence = useCallback(() => {
    if (userSentence.length === 0) {
      setSentenceMessage("შეადგინე წინადადება!");
      return;
    }

    const normalizedUserSentence = userSentence.trim().toLowerCase();
    const currentSentences = foundSentencesByPosition[position] || [];

    const isCorrect = sentences.some(sentence =>
      sentence.trim().toLowerCase() === normalizedUserSentence
    );

    if (isCorrect && !currentSentences.includes(userSentence)) {
      setFoundSentencesByPosition(prev => ({
        ...prev,
        [position]: [...currentSentences, userSentence]
      }));
      setSentenceMessage("სწორი წინადადება!");
    } else if (currentSentences.some(s => s.toLowerCase() === normalizedUserSentence)) {
      setSentenceMessage("ეს წინადადება უკვე შედგენილია!");
    } else {
      setSentenceMessage("არასწორი წინადადება! სცადეთ თავიდან.");
    }

    setUserSentence("");
  }, [userSentence, sentences, foundSentencesByPosition, position]);

  const handleAlphabetCardClick = useCallback((clickedPosition) => {
    setPosition(clickedPosition);
    setSelected([]);
    setMessage("");
    setUserSentence("");
    setSentenceMessage("");
    setActiveView('create');
  }, []);

  const handleViewChange = useCallback((newView) => {
    setActiveView(newView);
  }, []);

  const handleNextTurn = useCallback(() => {
    setPosition(position + 1);
  }, [position]);

  if (loading) {
    return <div className="loading">იტვირთება...</div>;
  }

  return (
    <div className="gamededaena-page">
      <h2>{version_data.name}ს დედაენა</h2>

      <TopControls
        activeView={activeView}
        currentLetter={currentLetter}
        position={position}
        staticDataLength={staticData.length}
        foundWordsCount={currentFoundWords.length}
        wordsCount={words.length}
        foundSentencesCount={currentFoundSentences.length}
        sentencesCount={sentences.length}
        onViewChange={handleViewChange}
      />

      {activeView === 'alphabet' && (
        <TableOfContents
          staticData={staticData}
          position={position}
          foundWordsByPosition={foundWordsByPosition}
          foundSentencesByPosition={foundSentencesByPosition}
          onCardClick={handleAlphabetCardClick}
          onClose={() => setActiveView(null)}
        />
      )}

      {activeView === 'words' && (
        <WordsList
          words={words}
          foundWords={currentFoundWords}
          position={position}
          onClose={() => setActiveView(null)}
        />
      )}

      {activeView === 'create' && (
        <WordCreator
          letters={letters}
          selected={selected}
          foundWords={currentFoundWords}
          totalWords={words.length}
          message={message}
          onLetterClick={handleLetterClick}
          onCheck={handleCheck}
          onClear={handleClear}
          onClose={() => setActiveView(null)}
        />
      )}

      {activeView === 'sentence' && (
        <SentenceCreator
          allFoundWords={allFoundWords}
          userSentence={userSentence}
          foundSentences={currentFoundSentences}
          totalSentences={sentences.length}
          sentenceMessage={sentenceMessage}
          onWordAdd={addWordToSentence}
          onPunctuationAdd={(punct) => setUserSentence(userSentence + punct)}
          onCheck={checkSentence}
          onClear={clearSentence}
          onClose={() => setActiveView(null)}
        />
      )}

      {activeView === 'showSentences' && (
        <SentenceList
          sentences={sentences}
          foundSentences={currentFoundSentences}
          position={position}
          onClose={() => setActiveView(null)}
        />
      )}

      {/* Artifacts Section - Only show when position is completed */}
      {isCurrentPositionCompleted && staticData[position - 1] && (
        <div className="chest">
          <div className="chest-header">
            <span className="chest-icon">🏆</span>
            <span className="chest-title">ზარდახშა გახსნილია!</span>
            <span className="chest-icon">🏆</span>
          </div>
          
          <div className="artifacts-container">
            {staticData[position - 1].has_proverbs && (
              <button 
                className="artifact-btn proverb-btn"
                onClick={() => getPositionProverbs(position)}
                title="ანდაზების ნახვა"
              >
                <span className="artifact-icon">📜</span>
                <span className="artifact-text">ანდაზები</span>
              </button>
            )}
            
            {staticData[position - 1].has_reading && (
              <button 
                className="artifact-btn reading-btn"
                onClick={() => getPositionReading(position)}
                title="საკითხავი მასალის ნახვა"
              >
                <span className="artifact-icon">📖</span>
                <span className="artifact-text">საკითხავი</span>
              </button>
            )}
            
            {!staticData[position - 1].has_proverbs && !staticData[position - 1].has_reading && (
              <div className="no-artifacts">
                ამ ტურში არტეფაქტები არ არის
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress indicator when position is not completed */}
      {!isCurrentPositionCompleted && (
        <div className="progress-indicator">
          <div className="progress-text">
            გასაღების მოსაპოვებლად შეადგინე ყველა სიტყვა და წინადადება
          </div>
          <div className="progress-bars">
            <div className="progress-bar">
              <span className="progress-label">სიტყვები:</span>
              <div className="progress-track">
                <div 
                  className="progress-fill words"
                  style={{ width: `${words.length > 0 ? (currentFoundWords.length / words.length) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="progress-count">{currentFoundWords.length}/{words.length}</span>
            </div>
            
            <div className="progress-bar">
              <span className="progress-label">წინადადებები:</span>
              <div className="progress-track">
                <div 
                  className="progress-fill sentences"
                  style={{ width: `${sentences.length > 0 ? (currentFoundSentences.length / sentences.length) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="progress-count">{currentFoundSentences.length}/{sentences.length}</span>
            </div>
          </div>
        </div>
      )}

      <StatsPanel
        totalFoundWords={totalFoundWordsCount}
        totalFoundSentences={totalFoundSentencesCount}
        currentPosition={position}
        totalPositions={staticData.length}
        onNextTurn={handleNextTurn}
        nextTurnDisabled={position >= staticData.length}
      />
    </div>
  );
}

export default GameDedaena;