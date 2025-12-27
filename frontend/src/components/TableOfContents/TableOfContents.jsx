import React from "react";
import "./TableOfContents.scss";

const TableOfContents = ({
  dedaenaData,
  position,
  // foundWordsByPosition,
  // foundSentencesByPosition,
  onCardClick,
  onClose
}) => {
  return (
    <div className="alphabet-cards-full">
      <div className="alphabet-header">
        <span>აირჩიე ტური</span>
        <button className="close-alphabet" onClick={onClose}>×</button>
      </div>
      <div className="alphabet-cards">
        {dedaenaData.map((pageInfo, idx) => {
          console.log("Rendering card for position:", idx + 1, pageInfo);
          // თითოეული ტურისთვის აიღე მონაცემები dedaenaData-დან
          const wordsCount = pageInfo.words ? pageInfo.words.length : 0;
          const sentencesCount = pageInfo.sentences ? pageInfo.sentences.length : 0;
          const proverbsCount = pageInfo.proverbs ? pageInfo.proverbs.length : 0;
          const toreadsCount = pageInfo.toreads ? pageInfo.toreads.length : 0;

          // const positionFoundWords = foundWordsByPosition[idx + 1] || [];
          // const positionFoundSentences = foundSentencesByPosition[idx + 1] || [];

          return (
            <div
              key={idx}
              className={`alphabet-card ${idx < position ? 'learned' : 'unlearned'} ${idx + 1 === position ? 'current' : ''}`}
              onClick={() => onCardClick(idx + 1)}
              title={`ტური ${idx + 1} - ${pageInfo.letter} (სიტყვები: ${wordsCount}, წინადადებები: ${sentencesCount})`}
            >
              <span className="card-letter">{pageInfo.letter}</span>
              <span className="card-position">{idx + 1}</span>

              <div className="card-content">
                {/* <div className="content-dot words">
                  <span className="icon">🔤</span>
                  <span className="count">{wordsCount}</span>
                </div> */}
                <div className="content-dot sentences">
                  <span className="icon">📝</span>
                  <span className="">წინადადება</span>
                  <span className="count">{sentencesCount}</span>
                </div>
                <div className="content-dot artefacts">
                  <span className="icon">💡</span>
                  <span className="">არტეფაქტი</span>
                  <span className="count">{proverbsCount}</span>
                </div>
                {/* <div className="content-dot reading">
                  <span className="icon">📖</span>
                  <span className="count">{toreadsCount}</span>
                </div> */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TableOfContents;