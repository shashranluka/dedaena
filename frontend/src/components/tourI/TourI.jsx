import React, { useMemo, useState } from "react";
import "./TourI.scss";

export default function TourI({
    stories = [],
    dedaenaData = [],
    foundSentenceIdsByPosition = {},
    foundWordsByPosition = {},
    viewedProverbIdsByPosition = {},
    savedProgress = { words: {}, sentenceIds: {}, proverbIds: {} },
    onSaveProgress,
    isAuthenticated = false
}) {
    const [revealFulltext, setRevealFulltext] = useState({});
    const [revealSentences, setRevealSentences] = useState({});
    const [saveStatus, setSaveStatus] = useState(null);
    const [openSection, setOpenSection] = useState(null); // 'words' | 'sentences' | 'proverbs' | null

    // ყველა ნაპოვნი წინადადების ID-ების Set (ყველა ტურიდან)
    const allFoundSentenceIds = useMemo(() => {
        const ids = new Set();
        Object.values(foundSentenceIdsByPosition).forEach(posIds => {
            posIds.forEach(id => ids.add(id));
        });
        return ids;
    }, [foundSentenceIdsByPosition]);

    // sentence ID → { text, tourPosition, tourLetter } mapping
    const sentenceMap = useMemo(() => {
        const map = new Map();
        dedaenaData.forEach(tour => {
            (tour.sentences || []).forEach(s => {
                map.set(s.id, {
                    text: s.sentence,
                    tourPosition: tour.position,
                    tourLetter: tour.letter,
                });
            });
        });
        return map;
    }, [dedaenaData]);

    // მოპოვებული სიტყვები ტურების მიხედვით
    const collectedWords = useMemo(() => {
        const result = [];
        dedaenaData.forEach(tour => {
            const found = foundWordsByPosition[tour.position] || [];
            if (found.length > 0) {
                result.push({ letter: tour.letter, position: tour.position, words: found });
            }
        });
        return result;
    }, [dedaenaData, foundWordsByPosition]);

    // მოპოვებული წინადადებები ტურების მიხედვით
    const collectedSentences = useMemo(() => {
        const result = [];
        dedaenaData.forEach(tour => {
            const foundIds = foundSentenceIdsByPosition[tour.position] || [];
            if (foundIds.length > 0) {
                const sentences = foundIds
                    .map(id => {
                        const info = sentenceMap.get(id);
                        return info ? { id, text: info.text } : null;
                    })
                    .filter(Boolean);
                if (sentences.length > 0) {
                    result.push({ letter: tour.letter, position: tour.position, sentences });
                }
            }
        });
        return result;
    }, [dedaenaData, foundSentenceIdsByPosition, sentenceMap]);

    // ნანახი ანდაზები ტურების მიხედვით
    const collectedProverbs = useMemo(() => {
        const result = [];
        dedaenaData.forEach(tour => {
            const viewedIds = new Set(viewedProverbIdsByPosition[tour.position] || []);
            if (viewedIds.size > 0) {
                const proverbs = (tour.proverbs || [])
                    .filter(p => viewedIds.has(p.id))
                    .map(p => ({ id: p.id, text: p.proverb }));
                if (proverbs.length > 0) {
                    result.push({ letter: tour.letter, position: tour.position, proverbs });
                }
            }
        });
        return result;
    }, [dedaenaData, viewedProverbIdsByPosition]);

    const totalWords = collectedWords.reduce((sum, g) => sum + g.words.length, 0);
    const totalSentences = collectedSentences.reduce((sum, g) => sum + g.sentences.length, 0);
    const totalProverbs = collectedProverbs.reduce((sum, g) => sum + g.proverbs.length, 0);

    // ახლად მოპოვებულების (შეუნახავების) რაოდენობა
    const newWordsCount = useMemo(() => {
        let count = 0;
        collectedWords.forEach(g => {
            const saved = savedProgress.words?.[g.position] ? new Set(savedProgress.words[g.position]) : new Set();
            g.words.forEach(w => { if (!saved.has(w)) count++; });
        });
        return count;
    }, [collectedWords, savedProgress.words]);

    const newSentencesCount = useMemo(() => {
        let count = 0;
        const savedSet = new Set();
        Object.values(savedProgress.sentenceIds || {}).forEach(ids => ids.forEach(id => savedSet.add(id)));
        collectedSentences.forEach(g => {
            g.sentences.forEach(s => { if (!savedSet.has(s.id)) count++; });
        });
        return count;
    }, [collectedSentences, savedProgress.sentenceIds]);

    const newProverbsCount = useMemo(() => {
        let count = 0;
        const savedSet = new Set();
        Object.values(savedProgress.proverbIds || {}).forEach(ids => ids.forEach(id => savedSet.add(id)));
        collectedProverbs.forEach(g => {
            g.proverbs.forEach(p => { if (!savedSet.has(p.id)) count++; });
        });
        return count;
    }, [collectedProverbs, savedProgress.proverbIds]);

    const hasUnsaved = newWordsCount > 0 || newSentencesCount > 0 || newProverbsCount > 0;

    // saved sets for quick lookup
    const savedWordSets = useMemo(() => {
        const map = {};
        Object.entries(savedProgress.words || {}).forEach(([pos, words]) => {
            map[pos] = new Set(words);
        });
        return map;
    }, [savedProgress.words]);

    const savedSentenceIdSet = useMemo(() => {
        const set = new Set();
        Object.values(savedProgress.sentenceIds || {}).forEach(ids => {
            ids.forEach(id => set.add(id));
        });
        return set;
    }, [savedProgress.sentenceIds]);

    const savedProverbIdSet = useMemo(() => {
        const set = new Set();
        Object.values(savedProgress.proverbIds || {}).forEach(ids => {
            ids.forEach(id => set.add(id));
        });
        return set;
    }, [savedProgress.proverbIds]);

    const handleSave = async () => {
        if (!onSaveProgress) return;
        setSaveStatus('saving');
        try {
            await onSaveProgress();
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (err) {
            console.error('Save failed:', err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const toggleSection = (section) => {
        setOpenSection(prev => prev === section ? null : section);
    };

    const renderCollectedSections = () => (
        <div className="collected-sections">
            <div className="">
                <h3 className="collected-overview">მოპოვებული</h3>
            </div>
            {/* სიტყვები */}
            <div className={`collected-section${openSection === 'words' ? ' open' : ''}`}>
                <button className="collected-section-header" onClick={() => toggleSection('words')}>
                    <span>📝 სიტყვები ({totalWords}){newWordsCount > 0 && <span className="new-count"> +{newWordsCount}</span>}</span>
                    <span className="collected-section-arrow">{openSection === 'words' ? '▲' : '▼'}</span>
                </button>
                {openSection === 'words' && (
                    <div className="collected-section-body">
                        {collectedWords.length === 0 ? (
                            <p className="collected-empty">ჯერ სიტყვები არ მოგიპოვებია</p>
                        ) : collectedWords.map(group => (
                            <div key={group.position} className="collected-group">
                                <span className="collected-group-letter">{group.letter}</span>
                                <div className="collected-items">
                                    {group.words.map((w, i) => (
                                        <span key={i} className={`collected-item word-item${(savedWordSets[group.position] || new Set()).has(w) ? ' saved' : ' unsaved'}`}>{w}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* წინადადებები */}
            <div className={`collected-section${openSection === 'sentences' ? ' open' : ''}`}>
                <button className="collected-section-header" onClick={() => toggleSection('sentences')}>
                    <span>📖 წინადადებები ({totalSentences}){newSentencesCount > 0 && <span className="new-count"> +{newSentencesCount}</span>}</span>
                    <span className="collected-section-arrow">{openSection === 'sentences' ? '▲' : '▼'}</span>
                </button>
                {openSection === 'sentences' && (
                    <div className="collected-section-body">
                        {collectedSentences.length === 0 ? (
                            <p className="collected-empty">ჯერ წინადადებები არ მოგიპოვებია</p>
                        ) : collectedSentences.map(group => (
                            <div key={group.position} className="collected-group">
                                <span className="collected-group-letter">{group.letter}</span>
                                <div className="collected-items">
                                    {group.sentences.map((s, i) => (
                                        <span key={i} className={`collected-item sentence-item${savedSentenceIdSet.has(s.id) ? ' saved' : ' unsaved'}`}>{s.text}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ანდაზები */}
            <div className={`collected-section${openSection === 'proverbs' ? ' open' : ''}`}>
                <button className="collected-section-header" onClick={() => toggleSection('proverbs')}>
                    <span>🏺 ანდაზები ({totalProverbs}){newProverbsCount > 0 && <span className="new-count"> +{newProverbsCount}</span>}</span>
                    <span className="collected-section-arrow">{openSection === 'proverbs' ? '▲' : '▼'}</span>
                </button>
                {openSection === 'proverbs' && (
                    <div className="collected-section-body">
                        {collectedProverbs.length === 0 ? (
                            <p className="collected-empty">ჯერ ანდაზები არ გინახავს</p>
                        ) : collectedProverbs.map(group => (
                            <div key={group.position} className="collected-group">
                                <span className="collected-group-letter">{group.letter}</span>
                                <div className="collected-items">
                                    {group.proverbs.map((p, i) => (
                                        <span key={i} className={`collected-item proverb-item${savedProverbIdSet.has(p.id) ? ' saved' : ' unsaved'}`}>{p.text}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // ისტორიების დაჯგუფება ტიპის მიხედვით
    const storiesByType = useMemo(() => {
        const groups = {};
        stories.forEach(story => {
            const type = story.story_type || 'სხვა';
            if (!groups[type]) groups[type] = [];
            groups[type].push(story);
        });
        return groups;
    }, [stories]);

    const storyTypeLabels = {
        'ამბავი': '📚 ამბები',
        'მოთხრობა': '📖 მოთხრობები',
        'იგავი': '🦊 იგავები',
        'იგავ-არაკი': '🦊 იგავ-არაკები',
        'ზღაპარი': '🧚 ზღაპრები',
        'ლექსი': '📜 ლექსები',
        'სხვა': '📄 სხვა',
    };

    return (
        <div className="tour-i-container">

            {renderCollectedSections()}

            {isAuthenticated && (
                <button
                    className={`save-progress-btn${saveStatus ? ` ${saveStatus}` : ''}${hasUnsaved ? '' : ' disabled'}`}
                    onClick={handleSave}
                    disabled={saveStatus === 'saving' || !hasUnsaved}
                >
                    {saveStatus === 'saving' ? '💾 ინახება...' :
                     saveStatus === 'success' ? '✅ შენახულია!' :
                     saveStatus === 'error' ? '❌ შეცდომა' :
                     hasUnsaved ? '💾 შენახვა' : '✅ არაფერია ახალი'}
                </button>
            )}

            {/* ამბები/მოთხრობები და იგავები */}
            <div className="stories-sections">
                <div className={`collected-section${openSection === 'stories' ? ' open' : ''}`}>
                    <button
                        className="collected-section-header"
                        onClick={() => toggleSection('stories')}
                    >
                        <span>📚 ამბები, მოთხრობები და იგავები ({stories.length})</span>
                        <span className="collected-section-arrow">
                            {openSection === 'stories' ? '▲' : '▼'}
                        </span>
                    </button>
                    {openSection === 'stories' && (
                        <div className="collected-section-body">
                            {Object.entries(storiesByType).map(([type, typeStories]) => (
                                <div key={type} className="stories-type-group">
                                    <h4 className="stories-type-label">{storyTypeLabels[type] || `📄 ${type}`}</h4>
                                    {typeStories.map(story => {
                                        const sentenceIds = story.sentences_ids || [];
                                        const foundCount = sentenceIds.filter(id => allFoundSentenceIds.has(id)).length;
                                        const totalCount = sentenceIds.length;
                                        const progress = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0;

                                        // პოზიციები, რომლებშიც ტექსტია განაწილებული
                                        const positionLetters = [];
                                        const seenPositions = new Set();
                                        sentenceIds.forEach(id => {
                                            const info = sentenceMap.get(id);
                                            if (info && !seenPositions.has(info.tourPosition)) {
                                                seenPositions.add(info.tourPosition);
                                                positionLetters.push(info.tourLetter);
                                            }
                                        });

                                        return (
                                            <div key={story.id} className="story-card-mini">
                                                <div className="story-card-mini-header">
                                                    <span className="story-card-mini-title">{story.title}</span>
                                                    {story.source && (
                                                        <span className="story-card-mini-source">{story.source}</span>
                                                    )}
                                                </div>
                                                {positionLetters.length > 0 && (
                                                    <div className="story-card-mini-positions">
                                                        {positionLetters.map((letter, i) => (
                                                            <span key={i} className="story-position-badge">{letter}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="story-card-mini-progress">
                                                    <div className="story-progress-bar">
                                                        <div
                                                            className="story-progress-fill"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="story-progress-text">{foundCount}/{totalCount}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* {stories.map(story => {
                const sentenceIds = story.sentences_ids || [];
                const foundCount = sentenceIds.filter(id => allFoundSentenceIds.has(id)).length;
                const totalCount = sentenceIds.length;
                const progress = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0;
                const isFullyRevealed = foundCount === totalCount && totalCount > 0;

                return (
                    <div key={story.id} className={`story-reader-card${isFullyRevealed ? ' revealed' : ''}`}>
                        <div className="story-reader-header">
                            <h3 className="story-reader-title">{story.title}</h3>
                            <span className="story-reader-type">{story.story_type || 'სხვა'}</span>
                        </div>
                        {story.source && (
                            <div className="story-reader-source">წყარო: {story.source}</div>
                        )}

                        <div className="story-toggle-buttons">
                            <button
                                className={`story-toggle-btn${revealFulltext[story.id] ? ' active' : ''}`}
                                onClick={() => setRevealFulltext(prev => ({ ...prev, [story.id]: !prev[story.id] }))}
                            >
                                {revealFulltext[story.id] ? '📖 ტექსტის დაფარვა' : '📖 ტექსტის გამოჩენა'}
                            </button>
                            <button
                                className={`story-toggle-btn${revealSentences[story.id] ? ' active' : ''}`}
                                onClick={() => setRevealSentences(prev => ({ ...prev, [story.id]: !prev[story.id] }))}
                            >
                                {revealSentences[story.id] ? '📝 წინადადებების დაფარვა' : '📝 წინადადებების გამოჩენა'}
                            </button>
                        </div>

                        <div className="story-reader-fulltext">
                            {story.story
                                ? story.story.split('\n').map((line, i, arr) => (
                                    <React.Fragment key={i}>
                                        <span className={revealFulltext[story.id] ? 'revealed' : 'masked'}>
                                            {revealFulltext[story.id] ? line : line.replace(/[ა-ჰ]/g, '█')}
                                        </span>
                                        {i < arr.length - 1 && <br />}
                                    </React.Fragment>
                                ))
                                : <span className="masked">ტექსტი არ არის ხელმისაწვდომი</span>
                            }
                        </div>

                        <div className="story-reader-sentences">
                            {sentenceIds.map((sid, idx) => {
                                const info = sentenceMap.get(sid);
                                const isFound = allFoundSentenceIds.has(sid);
                                const isRevealed = revealSentences[story.id] || isFound;
                                const text = info?.text || `წინადადება #${sid}`;

                                return (
                                    <div
                                        key={sid}
                                        className={`story-sentence ${isRevealed ? 'found' : 'hidden'}`}
                                    >
                                        <span className="story-sentence-number">{idx + 1}.</span>
                                        <span className="story-sentence-text">
                                            {isRevealed ? text : text.replace(/[ა-ჰ]/g, '█')}
                                        </span>
                                        {info && (
                                            <span className={`story-sentence-tour${isFound ? ' found' : ''}`}>
                                                {info.tourLetter} ({info.tourPosition})
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="story-reader-progress">
                            <div className="story-progress-bar">
                                <div
                                    className="story-progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="story-progress-text">{foundCount}/{totalCount}</span>
                        </div>
                    </div>
                );
            })} */}
        </div>
    );
}