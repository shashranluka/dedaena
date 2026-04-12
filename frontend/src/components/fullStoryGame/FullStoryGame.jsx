import React from "react";
import "./FullStoryGame.scss";

export default function FullStoryGame({ story, sentenceMap, allFoundSentenceIds, onClose }) {
    return (
        <div className="story-fullscreen-overlay" onClick={onClose}>
            <div className="story-fullscreen-content" onClick={e => e.stopPropagation()}>
                <div className="story-fullscreen-header">
                    <h3 className="story-fullscreen-title">{story.title}</h3>
                    <button className="story-fullscreen-close" onClick={onClose}>✕</button>
                </div>
                {story.source && (
                    <div className="story-fullscreen-source">{story.source}</div>
                )}
                <div className="story-fullscreen-text masked">
                    {story.story
                        ? story.story.split('\n').map((line, i, arr) => (
                            <React.Fragment key={i}>
                                {line.replace(/[ა-ჰ]/g, '█')}
                                {i < arr.length - 1 && <br />}
                            </React.Fragment>
                        ))
                        : 'ტექსტი არ არის ხელმისაწვდომი'
                    }
                </div>
                <div className="story-fullscreen-sentences">
                    {(story.sentences_ids || []).map((sid, idx) => {
                        const info = sentenceMap.get(sid);
                        const isFound = allFoundSentenceIds.has(sid);
                        const text = info?.text || `წინადადება #${sid}`;
                        return (
                            <div key={sid} className={`story-sentence ${isFound ? 'found' : 'hidden'}`}>
                                <span className="story-sentence-number">{idx + 1}.</span>
                                <span className="story-sentence-text">
                                    {isFound ? text : text.replace(/[ა-ჰ]/g, '█')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
