import React from "react";
import "./SentenceList.scss";

/**
 * წინადადებების სიის კომპონენტი
 * აჩვენებს ტურის ყველა წინადადებას და მონიშნავს რომელია უკვე ნაპოვნი
 * 
 * @param {Array} sentences - ყველა წინადადება მიმდინარე ტურისთვის
 * @param {Array} foundSentences - უკვე ნაპოვნი წინადადებები
 * @param {number} position - მიმდინარე ტურის ნომერი
 * @param {Function} onClose - დახურვის ფუნქცია
 */
const SentenceList = ({ 
  sentences, 
  foundSentences, 
  position, 
  onClose,
  sentencesnew 
}) => {
  // დარჩენილი წინადადებების რაოდენობის გამოთვლა
  const remainingSentencesCount = sentences.length - foundSentences.length;
  
  // წინადადების სტატუსის შემოწმება (ნაპოვნია თუ არა)
  const isSentenceFound = (sentence) => {
    return foundSentences.includes(sentence);
  };

  // CSS კლასის მიღება წინადადების სტატუსის მიხედვით
  const getSentenceClassName = (sentence) => {
    return `sentence-item ${isSentenceFound(sentence) ? 'found' : 'not-found'}`;
  };

  // დებაგის ლოგი (განვითარების რეჟიმისთვის)
  console.log("SentenceList rendering for position:", position, "with sentences:", sentencesnew);

  return (
    <div className="show-sentences-list">
      {/* ჰედერი - ტურის ინფო და დახურვის ღილაკი */}
      <div className="sentences-list-header">
        <span>
          ტური {position}-ის წინადადებები ({foundSentences.length}/{sentences.length})
        </span>
        <button 
          className="close-sentences-list" 
          onClick={onClose}
          aria-label="დახურვა"
        >
          ×
        </button>
      </div>

      {/* მთავარი კონტენტი */}
      <div className="sentences-list-content">
        {sentences.length > 0 ? (
          // წინადადებების ბადე
          <div className="sentences-grid">
            {sentences.map((item, index) => (
              <div
                key={index}
                className={getSentenceClassName(item.sentence)}
                title={isSentenceFound(item.sentence) ? "ნაპოვნია ✓" : "ჯერ არ არის ნაპოვნი"}
              >
                {item.sentence}
              </div>
            ))}
          </div>
        ) : (
          // შეტყობინება ცარიელი სიის შემთხვევაში
          <div className="no-sentences">
            ამ ტურისთვის წინადადებები არ არის
          </div>
        )}

        {/* სტატისტიკის პანელი */}
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
  );
};

export default SentenceList;