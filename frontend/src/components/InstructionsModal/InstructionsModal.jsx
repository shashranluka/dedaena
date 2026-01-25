import React, { useState } from "react";
import "./InstructionsModal.scss";
import instructionsData from "./instructionsContent.json";

const InstructionsModal = ({ isOpen, onClose }) => {
  const [language, setLanguage] = useState("ka"); // 'ka' or 'en'

  if (!isOpen) return null;

  const content = instructionsData[language];

  const renderSection = (section, index) => {
    switch (section.type) {
      case "paragraph":
        return (
          <section key={index}>
            <h4>{section.icon} {section.title}</h4>
            <p>{section.content}</p>
          </section>
        );
      
      case "ordered-list":
        return (
          <section key={index}>
            <h4>{section.icon} {section.title}</h4>
            <ol>
              {section.items.map((item, i) => (
                <li key={i}>
                  <strong>{item.title}</strong> {item.text}
                </li>
              ))}
            </ol>
          </section>
        );
      
      case "unordered-list":
        return (
          <section key={index}>
            <h4>{section.icon} {section.title}</h4>
            <ul>
              {section.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        );
      
      case "paragraphs":
        return (
          <section key={index}>
            <h4>{section.icon} {section.title}</h4>
            {section.items.map((item, i) => (
              <p key={i}>
                <strong>{item.title}</strong> {item.text}
              </p>
            ))}
          </section>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="instructions-modal-overlay" onClick={onClose}>
      <div className="instructions-modal" onClick={e => e.stopPropagation()}>
        <div className="header-controls">
          <div className="language-toggle">
            <button 
              className={language === "ka" ? "active" : ""} 
              onClick={() => setLanguage("ka")}
            >
              ქარ
            </button>
            <button 
              className={language === "en" ? "active" : ""} 
              onClick={() => setLanguage("en")}
            >
              ENG
            </button>
          </div>
          <button
            className="close-instructions-btn"
            onClick={onClose}
            aria-label="დახურვა"
          >
            ×
          </button>
        </div>
        <div className="instructions-header">
          <h3>{content.title}</h3>
        </div>
      <div className="instructions-content">{content.sections.map((section, index) => renderSection(section, index))}
        </div>
      </div>
    </div>
  );
};

export default InstructionsModal;
