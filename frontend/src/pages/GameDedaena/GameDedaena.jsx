import React, { useState, useCallback, useMemo, useEffect } from "react";
import "./GameDedaena.scss";
import { useGameData } from "../../hooks/useGameData";
import TopControls from "../../components/topControls/TopControls";
import TableOfContents from "../../components/TableOfContents/TableOfContents";
import WordsList from "../../components/WordsList/WordsList";
import WordCreator from "../../components/WordCreator/WordCreator";
import SentenceList from "../../components/SentenceList/SentenceList";
import SentenceCreator from "../../components/SentenceCreator/SentenceCreator";
import StatsPanel from "../../components/StatsPanel/StatsPanel";
import InstructionsModal from "../../components/InstructionsModal/InstructionsModal";


const version_data = { name: "იაკობ გოგებაშვილი", dedaena_table: "gogebashvili_1_with_ids" };

function GameDedaena() {
  const [selected, setSelected] = useState([]);
  const [foundWordsByPosition, setFoundWordsByPosition] = useState({});
  const [foundSentencesByPosition, setFoundSentencesByPosition] = useState({});
  const [message, setMessage] = useState("");
  const [userSentence, setUserSentence] = useState("");
  const [sentenceMessage, setSentenceMessage] = useState("");
  const [sentenceMessageKey, setSentenceMessageKey] = useState(0);
  const [sentenceMessageType, setSentenceMessageType] = useState("success"); // ✅ ახალი state
  const [activeView, setActiveView] = useState('sentence');
  const [position, setPosition] = useState(2);
  const [werili, setWerili] = useState();
  const [showGift, setShowGift] = useState(false);
  const [proverbIndex, setProverbIndex] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);

  // ხმის ჩართვა-გამორთვის state (localStorage-დან)
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('dedaena_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // ხმის პარამეტრის შენახვა localStorage-ში
  useEffect(() => {
    localStorage.setItem('dedaena_sound_enabled', JSON.stringify(isSoundEnabled));
  }, [isSoundEnabled]);

  // ხმის ჩართვა-გამორთვა
  const toggleSound = () => {
    setIsSoundEnabled(prev => !prev);
  };

  const { letters, words, sentences, dedaenaData, loading, error } = useGameData(version_data, position);


  const currentFoundWords = useMemo(() => foundWordsByPosition[position] || [], [foundWordsByPosition, position]);
  const currentFoundSentences = useMemo(() => foundSentencesByPosition[position] || [], [foundSentencesByPosition, position]);
  const [lettersStatsFromSentences, setLettersStatsFromSentences] = useState({});
  console.log('lettersStatsFromSentences:', lettersStatsFromSentences);
  useEffect(() => {
    const lettersStats = dedaenaData.reduce((acc, t, index) => {
      if (index < position) {
        acc[t.letter] = 0;
      }
      return acc;
    }, {});
    setLettersStatsFromSentences(lettersStats);
  }, [dedaenaData, position]);
  const allFoundWords = useMemo(() => {
    const allWords = [];
    Object.values(foundWordsByPosition).forEach(positionWords => {
      allWords.push(...positionWords);
    });
    return [...new Set(allWords)];
  }, [foundWordsByPosition]);

  const currentLetter = useMemo(() => {
    if (!dedaenaData || dedaenaData.length === 0) return '';
    return dedaenaData[position - 1]?.letter || '';
  }, [dedaenaData, position]);

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
    if (!dedaenaData || !dedaenaData[pos - 1]) return false;

    const positionData = dedaenaData[pos - 1];
    const foundWords = foundWordsByPosition[pos] || [];
    const foundSentences = foundSentencesByPosition[pos] || [];

    const wordCount = positionData.word_count || 0;
    const sentenceCount = positionData.sentence_count || 0;

    return foundWords.length >= wordCount && foundSentences.length >= sentenceCount;
  }, [dedaenaData, foundWordsByPosition, foundSentencesByPosition]);

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
    if (pureWords.includes(word) && !currentWords.includes(word)) {
      setFoundWordsByPosition(prev => ({
        ...prev,
        [position]: [...currentWords, word]
      }));
      setMessage("სწორია!");
    } else if (currentWords.includes(word)) {
      setMessage("ეს სიტყვა უკვე მოძებნილია!");
    } else {
      setMessage("სხვა სცადე!");
      // setMessage("არასწორი კომბინაცია!");
    }
    setSelected([]);
  }, [selected, words, foundWordsByPosition, position]);

  const handleClear = useCallback(() => {
    setSelected([]);
    setMessage("");
  }, []);

  const handleRemoveLast = () => {
    setUserSentence(prev => prev.slice(0, -1));
  };

  // const addWordToSentence = useCallback((word) => {
  //   setUserSentence(prev => prev + (prev ? " " : "") + word);
  //   setSentenceMessage("");
  // }, []);

  const clearSentence = useCallback(() => {
    setUserSentence("");
    setSentenceMessage("");
  }, []);

  const checkSentence = useCallback(() => {
    // ხმის დაკვრის ფუნქცია
    const playSound = (soundType) => {
      if (!isSoundEnabled) return;
      const soundFiles = {
        success: '/sounds/testsuccess.mp3',
        repeated: '/sounds/testrepeated.mp3',
        error: '/sounds/testerror.mp3',
        warning: '/sounds/testwarning.mp3'
      };
      const audio = new Audio(soundFiles[soundType]);
      audio.play().catch(err => console.log('Audio play failed:', err));
    };

    if (userSentence.length === 0) {
      setSentenceMessage("შეადგინე წინადადება!");
      setSentenceMessageType("warning");
      setSentenceMessageKey(Date.now());
      playSound('warning');
      return;
    }

    const normalizedUserSentence = userSentence.trim().toLowerCase();
    const currentSentences = foundSentencesByPosition[position] || [];

    const isCorrect = dedaenaData[position - 1]?.sentences.some(item =>
      item.sentence.trim().toLowerCase() === normalizedUserSentence
    );

    if (isCorrect && !currentSentences.includes(userSentence)) {
      setFoundSentencesByPosition(prev => ({
        ...prev,
        [position]: [...currentSentences, userSentence]
      }));
      setSentenceMessage("სწორი წინადადება!");
      setSentenceMessageType("success");
      setSentenceMessageKey(Date.now());
      playSound('success');
    } else if (currentSentences.some(s => s.toLowerCase() === normalizedUserSentence)) {
      setSentenceMessage("ეს წინადადება უკვე შედგენილია!");
      setSentenceMessageType("repeated");
      setSentenceMessageKey(Date.now());
      playSound('repeated');
    } else {
      setSentenceMessage("სხვა სცადე!");
      setSentenceMessageType("error");
      setSentenceMessageKey(Date.now());
      playSound('error');
    }
    if (isCorrect) {
      setLettersStatsFromSentences(prev => {
        const lastSentence = userSentence;
        const lettersInSentence = (lastSentence || "").replace(/[^ა-ჰ]/g, "").split("");
        const letterCounts = {};
        lettersInSentence.forEach(ch => {
          letterCounts[ch] = (letterCounts[ch] || 0) + 1;
        });
        const updated = { ...prev };
        Object.entries(letterCounts).forEach(([ch, count]) => {
          updated[ch] = (updated[ch] || 0) + count;
        });
        return updated;
      });
      setUserSentence("");
    }
  }, [userSentence, sentences, foundSentencesByPosition, position, dedaenaData, isSoundEnabled]);

  const handleAlphabetCardClick = useCallback((clickedPosition) => {
    setPosition(clickedPosition);
    setSelected([]);
    setMessage("");
    setUserSentence("");
    setSentenceMessage("");
    setActiveView('sentence');
  }, []);

  const handleViewChange = useCallback((newView) => {
    setActiveView(newView);
  }, []);

  const handleNextTurn = useCallback(() => {
    setPosition(position + 1);
  }, [position]);

  // if (loading) {
  //   return <div className="loading">იტვირთება...</div>;
  // }
  // ყველა ასო 0-ზე მეტია?
  const allLettersStatsCompleted = useMemo(() => {
    const values = Object.values(lettersStatsFromSentences);
    return values.length > 0 && values.every(v => v > 0);
  }, [lettersStatsFromSentences]);

  // არჩეული ტურის ანდაზებიდან პირველი
  const firstProverb = dedaenaData[position - 1]?.proverbs?.[0]?.proverb || "";

  // არჩეული ტურის ანდაზებიდან proverbIndex-ით
  const proverbs = dedaenaData[position - 1]?.proverbs || [];
  const currentProverb = proverbs[proverbIndex]?.proverb || "";

  return (
    <div className="gamededaena-page">
      {/* <h2>{version_data.name}ს დედაენა</h2> */}

      <TopControls
        activeView={activeView}
        currentLetter={currentLetter}
        position={position}
        staticDataLength={dedaenaData.length}
        foundWordsCount={currentFoundWords.length}
        wordsCount={words.length}
        foundSentencesCount={currentFoundSentences.length}
        sentencesCount={dedaenaData[position - 1]?.sentences.length || 0}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={toggleSound}
        onNextQuest={() => setPosition(position + 1)}
        onViewChange={(view) => {
          if (view === 'instructions') {
            setShowInstructions(true);
          } else {
            handleViewChange(view);
          }
        }}
      />


      {/* ტურების ნავიგაცია - ასოები და პროგრესი */}
      {dedaenaData && dedaenaData.length > 0 && (
        <div className="tour-letter-buttons">
          {dedaenaData.map((tour, index) => {
            // ღილაკის სტატუსის განსაზღვრა
            const isActive = position === tour.position;
            const isCompleted = position > tour.position;
            const isUpcoming = position < tour.position;
            
            // CSS კლასების მიმაგრება
            const buttonClasses = [
              'tour-letter-btn',
              isActive && 'active',
              isCompleted && 'before-selected',
              isUpcoming && 'after-selected'
            ].filter(Boolean).join(' ');

            // სტატისტიკის ჩვენება მონიშნულისა და დასრულებული ტურებისთვის
            const showStats = index <= position - 1;
            const letterStats = lettersStatsFromSentences[tour.letter] || 0;
            const isStatsComplete = letterStats > 0;

            return (
              <div 
                key={tour.position} 
                className="tour-letter-btn-wrapper"
                role="listitem"
              >
                {/* პოზიციის ნომერი (ტურის რიგითი ნომერი) */}
                <span 
                  className="tour-position-label" 
                  aria-label={`ტური ${tour.position}`}
                >
                  {tour.position}
                </span>

                {/* ასოს ღილაკი - დაკლიკებით გადადის შესაბამის ტურზე */}
                <button
                  className={buttonClasses}
                  onClick={() => setPosition(tour.position)}
                  title={`ქვესტი ${tour.position} - ასო "${tour.letter}"`}
                  aria-label={`გადადი ტურზე ${tour.position}, ასო ${tour.letter}`}
                  aria-current={isActive ? 'true' : 'false'}
                >
                  {tour.letter}
                </button>

                {/* სტატისტიკის ინდიკატორი - ასოს გამოყენების რაოდენობა */}
                {showStats && (
                  <span 
                    className={`letter-stat ${isStatsComplete ? 'completed' : 'not-completed'}`}
                    title={`ასო "${tour.letter}" გამოყენებულია ${letterStats}-ჯერ წინადადებებში`}
                    aria-label={`${letterStats} გამოყენება`}
                  >
                    {letterStats}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeView === 'alphabet' && (
        <TableOfContents
          dedaenaData={dedaenaData}
          position={position}
          // foundWordsByPosition={foundWordsByPosition}
          // foundSentencesByPosition={foundSentencesByPosition}
          onCardClick={handleAlphabetCardClick}
          onClose={() => setActiveView(null)}
        />
      )}

      {activeView === 'words' && (
        <WordsList
          words={words}
          // wordsnew={dedaenaData[position-1]?.words || []}
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

      {/* {activeView === 'sentence' && ( */}
      <SentenceCreator
        allFoundWords={allFoundWords}
        userSentence={userSentence}
        foundSentences={currentFoundSentences}
        totalSentences={dedaenaData[position - 1]?.sentences.length}
        sentenceMessage={sentenceMessage}
        sentenceMessageKey={sentenceMessageKey}
        sentenceMessageType={sentenceMessageType}
        isSoundEnabled={isSoundEnabled}
        onWordAdd={(value) => {
          if (typeof value === "string" && value.length === 1) {
            setUserSentence(prev => prev + value);
          } else {
            setUserSentence(prev => prev.length > 0 ? prev + " " + value : value);
          }
        }}
        onPunctuationAdd={(punct) => setUserSentence(userSentence + punct)}
        onCheck={checkSentence}
        onRemoveLast={handleRemoveLast}
        onClear={clearSentence}
        onClose={() => setActiveView(null)}
        letters={letters}
        position={position}
        setPosition={setPosition}
      />
      {/* )} */}

      {activeView === 'showSentences' && (
        <SentenceList
          // sentences={sentences}
          sentences={dedaenaData[position - 1]?.sentences}
          foundSentences={currentFoundSentences}
          position={position}
          onClose={() => setActiveView(null)}
        />
      )}

      <div className="open-button-div">
        {allLettersStatsCompleted && currentProverb.length > 0 && (
          <button
            className="open-gift-btn"
            onClick={() => {
              setLettersStatsFromSentences(prev => {
                const updated = {};
                Object.entries(prev).forEach(([ch, count]) => {
                  updated[ch] = Math.max(0, count - 1);
                });
                return updated;
              });
              setShowGift(true)
            }
            }
          >
            🚪 არტეფაქტის გახსნა
          </button>
        )}
      </div>

      {showGift && (
        <div className="gift-modal-overlay" >
          <div className="gift-modal" onClick={e => e.stopPropagation()}>
            <h3> ანდაზა</h3>
            <div className="gift-content">
              {currentProverb ? (
                <p style={{ fontSize: "20px", fontWeight: "bold", margin: "24px 0" }}>{currentProverb}</p>
              ) : (
                <p>ამ ტურში ანდაზა არ მოიძებნა.</p>
              )}
            </div>
            <button
              className="close-gift-btn"
              onClick={() => {
                setShowGift(false);
                setProverbIndex((prev) => (prev + 1) % proverbs.length);
              }}
            >
              დახურვა
            </button>
          </div>
        </div>
      )}

      <InstructionsModal 
        isOpen={showInstructions} 
        onClose={() => setShowInstructions(false)} 
      />

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

      {/* <StatsPanel
        totalFoundWords={totalFoundWordsCount}
        totalFoundSentences={totalFoundSentencesCount}
        currentPosition={position}
        totalPositions={dedaenaData.length}
        onNextTurn={handleNextTurn}
        nextTurnDisabled={position >= dedaenaData.length}
      /> */}
    </div>
  );
}

export default GameDedaena;