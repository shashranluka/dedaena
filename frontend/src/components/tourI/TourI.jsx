import React, { useMemo, useState } from "react";
import "./TourI.scss";

export default function TourI({ stories = [], dedaenaData = [], foundSentenceIdsByPosition = {} }) {
    const [revealFulltext, setRevealFulltext] = useState({});
    const [revealSentences, setRevealSentences] = useState({});
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

    if (!stories || stories.length === 0) {
        return (
            <div className="tour-i-container">
                <h2 className="tour-i-title">📖 ისტორიები</h2>
                <p className="tour-i-empty">ჯერ ისტორიები არ არის დამატებული.</p>
            </div>
        );
    }

    return (
        <div className="tour-i-container">
            <h2 className="tour-i-title">📖 ისტორიები</h2>
            {stories.map(story => {
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
            })}
        </div>
    );
}