import React from 'react';
import { Link } from 'react-router-dom';
import './CookieConsentBanner.scss';

function CookieConsentBanner({ visible, onAccept, onReject }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="ქუქიების თანხმობა">
      <div className="cookie-banner__content">
        <p className="cookie-banner__text">
          ჩვენ ვიყენებთ ანალიტიკურ ქუქიებს საიტის გამოყენების გასაანალიზებლად. შეგიძლიათ დაეთანხმოთ
          ან უარყოთ ანალიტიკური თვალთვალი. იხილეთ ჩვენი{' '}
          <Link to="/privacy">კონფიდენციალურობის პოლიტიკა</Link>.
        </p>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="cookie-banner__button cookie-banner__button--secondary"
            onClick={onReject}
          >
            არ ვეთანხმები
          </button>
          <button
            type="button"
            className="cookie-banner__button cookie-banner__button--primary"
            onClick={onAccept}
          >
            ვეთანხმები
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsentBanner;
