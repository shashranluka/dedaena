import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./GameDedaena.scss";
import { useGameData } from "../../hooks/useGameData";
import TopControls from "../../components/topControls/TopControls";

const version_data = { name: "იაკობ გოგებაშვილი", dedaena_table: "gogebashvili" };

function GameDedaena() {
  const [selected, setSelected] = useState([]);
  
  // ტურების მიხედვით ორგანიზებული state-ები
  const [foundWordsByPosition, setFoundWordsByPosition] = useState({}); // {1: ["სიტყვა1"], 2: ["სიტყვა2"], ...}
  const [foundSentencesByPosition, setFoundSentencesByPosition] = useState({}); // {1: ["წინ1"], 2: ["წინ2"], ...}
  
  const [message, setMessage] = useState("");
  const [userSentence, setUserSentence] = useState("");
  const [sentenceMessage, setSentenceMessage] = useState("");
  const [activeView, setActiveView] = useState('create');
  const [position, setPosition] = useState(2);

  const { letters, words, sentences, fullAlphabet, loading, error } = useGameData(version_data, position);

  useEffect(() => {
    if (error) {
      setMessage(`შეცდომა: ${error}`);
    }
  }, [error]);

  // მიმდინარე ტურის ნაპოვნი სიტყვები და წინადადებები
  const currentFoundWords = useMemo(() => {
    return foundWordsByPosition[position] || [];
  }, [foundWordsByPosition, position]);

  const currentFoundSentences = useMemo(() => {
    return foundSentencesByPosition[position] || [];
  }, [foundSentencesByPosition, position]);

  // ყველა ტურიდან ნაპოვნი სიტყვები (წინადადების შესადგენად)
  const allFoundWords = useMemo(() => {
    const allWords = [];
    Object.values(foundWordsByPosition).forEach(positionWords => {
      allWords.push(...positionWords);
    });
    return [...new Set(allWords)]; // დუპლიკატების ამოღება
  }, [foundWordsByPosition]);

  // სტატისტიკა მიმდინარე ტურისთვის
  const currentLetter = useMemo(() => fullAlphabet[position - 1] || '', [fullAlphabet, position]);
  const foundWordsCount = useMemo(() => currentFoundWords.length, [currentFoundWords]);
  const foundSentencesCount = useMemo(() => currentFoundSentences.length, [currentFoundSentences]);
  const remainingWordsCount = useMemo(() => words.length - foundWordsCount, [words.length, foundWordsCount]);
  const remainingSentencesCount = useMemo(() => sentences.length - foundSentencesCount, [sentences.length, foundSentencesCount]);

  // მთლიანი სტატისტიკა (ყველა ტურში)
  const totalFoundWordsCount = useMemo(() => {
    return Object.values(foundWordsByPosition).reduce((total, positionWords) => 
      total + positionWords.length, 0);
  }, [foundWordsByPosition]);

  const totalFoundSentencesCount = useMemo(() => {
    return Object.values(foundSentencesByPosition).reduce((total, positionSentences) => 
      total + positionSentences.length, 0);
  }, [foundSentencesByPosition]);

  const handleLetterClick = useCallback((letter) => {
    setSelected(prev => [...prev, letter]);
    setMessage("");
  }, []);

  const handleCheck = useCallback(() => {
    const word = selected.join("");
    const currentWords = foundWordsByPosition[position] || [];
    
    if (words.includes(word) && !currentWords.includes(word)) {
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

  const checkSentence = () => {
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
  };

  const handleAlphabetCardClick = (clickedPosition) => {
    setPosition(clickedPosition);
    setSelected([]);
    setMessage("");
    setUserSentence("");
    setSentenceMessage("");
    setActiveView('create');
  };

  const handleViewChange = useCallback((newView) => {
    setActiveView(newView);
  }, []);

  if (loading) {
    return <div className="loading">იტვირთება...</div>;
  }

  return (
    <div className="gamededaena-page">
      <h2>{version_data.name}ს დედაენა</h2>

      <div className="alphabet-section">
        <TopControls
          activeView={activeView}
          currentLetter={currentLetter}
          position={position}
          fullAlphabetLength={fullAlphabet.length}
          foundWordsCount={foundWordsCount}
          wordsCount={words.length}
          foundSentencesCount={foundSentencesCount}
          sentencesCount={sentences.length}
          onViewChange={handleViewChange}
        />

        {activeView === 'alphabet' && (
          <div className="alphabet-cards-full">
            <div className="alphabet-header">
              <span>აირჩიე ტური</span>
              <button className="close-alphabet" onClick={() => setActiveView(null)}>×</button>
            </div>
            <div className="alphabet-cards">
              {fullAlphabet.map((letter, idx) => {
                const positionFoundWords = foundWordsByPosition[idx + 1] || [];
                const positionFoundSentences = foundSentencesByPosition[idx + 1] || [];
                
                return (
                  <div
                    key={idx}
                    className={`alphabet-card ${idx < position ? 'learned' : 'unlearned'} ${idx + 1 === position ? 'current' : ''}`}
                    onClick={() => handleAlphabetCardClick(idx + 1)}
                    title={`ტური ${idx + 1} - ${letter} (სიტყვები: ${positionFoundWords.length}, წინადადებები: ${positionFoundSentences.length})`}
                  >
                    <span className="card-letter">{letter}</span>
                    <span className="card-position">{idx + 1}</span>
                    
                    {/* ტურის პროგრესის ინდიკატორი */}
                    <div className="card-progress">
                      <div className="progress-dot words" title={`სიტყვები: ${positionFoundWords.length}`}>
                        <span>{positionFoundWords.length}</span>
                      </div>
                      <div className="progress-dot sentences" title={`წინადადებები: ${positionFoundSentences.length}`}>
                        <span>{positionFoundSentences.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {activeView === 'words' && (
        <div className="current-words-list">
          <div className="words-list-header">
            <span>ტური {position}-ის სიტყვები ({currentFoundWords.length}/{words.length})</span>
            <button className="close-words-list" onClick={() => setActiveView(null)}>×</button>
          </div>
          <div className="words-list-content">
            {words.length > 0 ? (
              <div className="words-grid">
                {words.map((word, idx) => (
                  <div
                    key={idx}
                    className={`word-item ${currentFoundWords.includes(word) ? 'found' : 'not-found'}`}
                  >
                    {word}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-words">ამ ტურისთვის სიტყვები არ არის</div>
            )}
            
            <div className="remaining-info">
              <div className="remaining-count">
                <span className="remaining-label">დარჩენილი:</span>
                <span className="remaining-number">{remainingWordsCount}</span>
              </div>
              <div className="total-count">
                <span className="total-label">სულ:</span>
                <span className="total-number">{words.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'create' && (
        <div className="create-words-div">
          <div className="create-words-header">
            <span>შექმენი სიტყვები ({currentFoundWords.length}/{words.length})</span>
            <button className="close-create-words" onClick={() => setActiveView(null)}>×</button>
          </div>

          <p>შექმენი სიტყვები ასოებით: <b>{letters.join(", ")}</b></p>

          <div className="letters-row">
            {letters.map((l) => (
              <button
                key={l}
                className="letter-btn"
                onClick={() => handleLetterClick(l)}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="selected-word">
            {selected.length > 0 ? selected.join("") : <span className="placeholder">დაწერე სიტყვა</span>}
          </div>

          <div className="actions">
            <button className="check-btn" onClick={handleCheck} disabled={selected.length === 0}>
              შემოწმება
            </button>
            <button className="clear-btn" onClick={handleClear} disabled={selected.length === 0}>
              გასუფთავება
            </button>
          </div>

          <div className="remaining-info">
            <div className="remaining-count">
              <span className="remaining-label">დარჩენილი:</span>
              <span className="remaining-number">{remainingWordsCount}</span>
            </div>
            <div className="total-count">
              <span className="total-label">სულ:</span>
              <span className="total-number">{words.length}</span>
            </div>
          </div>
        </div>
      )}

      {activeView === 'sentence' && (
        <div className="create-sentence-div">
          <div className="create-sentence-header">
            <span>შექმენი წინადადება ({currentFoundSentences.length}/{sentences.length})</span>
            <button className="close-create-sentence" onClick={() => setActiveView(null)}>×</button>
          </div>

          <div className="found-words">
            <h4>ნაპოვნი სიტყვები ({allFoundWords.length} სულ ყველა ტურიდან):</h4>
            <div className="words-grid">
              {allFoundWords.map((w, idx) => (
                <button
                  key={idx}
                  className="word-card"
                  onClick={() => addWordToSentence(w)}
                  title="დაკლიკე წინადადებაში დასამატებლად"
                >
                  {w}
                </button>
              ))}
              <button
                className="punctuation-btn"
                onClick={() => setUserSentence(userSentence + ".")}
              >
                .
              </button>
            </div>
          </div>

          <div className="sentence-section">
            <h4>წინადადების შედგენა:</h4>
            <div className="sentence-builder">
              {userSentence.length > 0 ? (
                <div className="sentence-words">
                  <span className="sentence-word">
                    {userSentence}
                  </span>
                </div>
              ) : (
                <div className="sentence-placeholder">
                  დააკლიკე ნაპოვნ სიტყვებს წინადადების შესადგენად
                </div>
              )}
            </div>

            <div className="sentence-actions">
              <button
                className="check-sentence-btn"
                onClick={checkSentence}
                disabled={userSentence.length === 0}
              >
                წინადადების შემოწმება
              </button>
              <button
                className="clear-sentence-btn"
                onClick={clearSentence}
                disabled={userSentence.length === 0}
              >
                წინადადების გასუფთავება
              </button>
            </div>
          </div>

          {sentenceMessage && <div className="sentence-message">{sentenceMessage}</div>}

          <div className="remaining-info">
            <div className="remaining-count">
              <span className="remaining-label">დარჩენილი:</span>
              <span className="remaining-number">{remainingSentencesCount}</span>
            </div>
            <div className="total-count">
              <span className="total-label">სულ:</span>
              <span className="total-number">{sentences.length}</span>
            </div>
          </div>
        </div>
      )}

      {activeView === 'showSentences' && (
        <div className="show-sentences-list">
          <div className="sentences-list-header">
            <span>ტური {position}-ის წინადადებები ({currentFoundSentences.length}/{sentences.length})</span>
            <button className="close-sentences-list" onClick={() => setActiveView(null)}>×</button>
          </div>
          <div className="sentences-list-content">
            {sentences.length > 0 ? (
              <div className="sentences-grid">
                {sentences.map((sentence, idx) => (
                  <div
                    key={idx}
                    className={`sentence-item ${currentFoundSentences.includes(sentence) ? 'found' : 'not-found'}`}
                  >
                    {sentence}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-sentences">ამ ტურისთვის წინადადებები არ არის</div>
            )}

            <div className="remaining-info">
              <div className="remaining-count">
                <span className="remaining-label">დარჩენილი:</span>
                <span className="remaining-number">{remainingSentencesCount}</span>
              </div>
              <div className="total-count">
                <span className="total-label">სულ:</span>
                <span className="total-number">{sentences.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        className="next-btn"
        onClick={() => setPosition(position + 1)}
        disabled={position >= fullAlphabet.length}
      >
        შემდეგი ტური {position < fullAlphabet.length ? `(${position + 1}/${fullAlphabet.length})` : ''}
      </button>

      {/* მთლიანი სტატისტიკა */}
      <div className="global-stats">
        <h5>მთლიანი პროგრესი:</h5>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">ნაპოვნი სიტყვები:</span>
            <span className="stat-value">{totalFoundWordsCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">ნაპოვნი წინადადებები:</span>
            <span className="stat-value">{totalFoundSentencesCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameDedaena;