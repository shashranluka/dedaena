import ReactGA from 'react-ga4';

// Google Analytics Measurement ID
// მიიღე Google Analytics-დან: https://analytics.google.com/
// Admin > Property Settings > Measurement ID (იწყება G- პრეფიქსით)
const MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

const CONSENT_STORAGE_KEY = 'analytics_consent';
const CONSENT_GRANTED = 'granted';
const CONSENT_DENIED = 'denied';

let isInitialized = false;
let consentDefaultsApplied = false;

const isBrowser = () => typeof window !== 'undefined';

const hasValidMeasurementId = () => (
  MEASUREMENT_ID
  && MEASUREMENT_ID !== 'G-XXXXXXXXXX'
  && MEASUREMENT_ID.startsWith('G-')
);

const ensureGtag = () => {
  if (!isBrowser()) {
    return null;
  }

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  return window.gtag;
};

const getStoredConsentValue = () => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === CONSENT_GRANTED || value === CONSENT_DENIED) {
      return value;
    }
  } catch (error) {
    // Swallow storage errors (e.g. private mode restrictions).
  }

  return null;
};

const updateConsentMode = (granted) => {
  const gtag = ensureGtag();
  if (!gtag) {
    return;
  }

  gtag('consent', 'update', {
    analytics_storage: granted ? CONSENT_GRANTED : CONSENT_DENIED,
    ad_storage: CONSENT_DENIED,
    ad_user_data: CONSENT_DENIED,
    ad_personalization: CONSENT_DENIED,
  });
};

const canTrack = () => isInitialized && hasAnalyticsConsent();

const sanitizePath = (path = '') => String(path).split('?')[0].split('#')[0];

const sanitizeLabel = (label = '') => {
  const trimmedLabel = String(label).trim().slice(0, 100);
  return trimmedLabel.includes('@') ? '' : trimmedLabel;
};

export const getAnalyticsConsentState = () => getStoredConsentValue();

export const hasConsentDecision = () => getStoredConsentValue() !== null;

export const hasAnalyticsConsent = () => getStoredConsentValue() === CONSENT_GRANTED;

export const initializeConsentMode = () => {
  if (consentDefaultsApplied) {
    return;
  }

  const gtag = ensureGtag();
  if (!gtag) {
    return;
  }

  gtag('consent', 'default', {
    analytics_storage: CONSENT_DENIED,
    ad_storage: CONSENT_DENIED,
    ad_user_data: CONSENT_DENIED,
    ad_personalization: CONSENT_DENIED,
    wait_for_update: 500,
  });

  consentDefaultsApplied = true;
};

export const setAnalyticsConsent = (granted) => {
  if (!isBrowser()) {
    return;
  }

  const value = granted ? CONSENT_GRANTED : CONSENT_DENIED;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch (error) {
    // Ignore localStorage write failures to keep the app functional.
  }

  updateConsentMode(granted);
  if (granted) {
    initGA();
  }
};

/**
 * ინიციალიზაცია უწევს Google Analytics-ს
 * ამოწმებს Measurement ID-ს და ახდენს GA-ს კონფიგურაციას
 */
export const initGA = () => {
  if (!hasAnalyticsConsent() || isInitialized || !hasValidMeasurementId()) {
    return;
  }

  ReactGA.initialize(MEASUREMENT_ID, {
    gaOptions: {
      siteSpeedSampleRate: 100,
    },
    gtagOptions: {
      anonymize_ip: true,
      send_page_view: false,
    },
  });

  isInitialized = true;
  updateConsentMode(true);
};

/**
 * აგზავნის გვერდის ნახვის მონაცემებს Google Analytics-ში
 * @param {string} path - გვერდის მისამართი
 */
export const trackPageView = (path) => {
  if (canTrack()) {
    ReactGA.send({
      hitType: 'pageview',
      page: sanitizePath(path),
      title: document.title,
    });
  }
};

/**
 * აგზავნის მორგებულ ივენთებს Google Analytics-ში
 * @param {string} category - ივენთის კატეგორია
 * @param {string} action - ივენთის მოქმედება
 * @param {string} label - ივენთის ლეიბლი (ოფციონალური)
 * @param {number} value - ივენთის რიცხვითი მნიშვნელობა (ოფციონალური)
 */
export const trackEvent = (category, action, label = '', value = 0) => {
  if (canTrack()) {
    ReactGA.event({
      category,
      action,
      label: sanitizeLabel(label),
      value,
    });
  }
};

// მაგალითები კონკრეტული ივენთებისთვის:

/**
 * აფიქსირებს თამაშის დაწყების ივენთს
 * @param {string} gameType - თამაშის ტიპი
 */
export const trackGameStart = (gameType) => {
  trackEvent('Game', 'Start Game', gameType);
};

/**
 * აფიქსირებს სიტყვის არჩევის ივენთს
 * @param {string} word - არჩეული სიტყვა
 */
export const trackWordSelection = (word) => {
  trackEvent('Game', 'Word Selected', word);
};

/**
 * აფიქსირებს სწორი პასუხის ივენთს
 * @param {string} gameType - თამაშის ტიპი
 */
export const trackCorrectAnswer = (gameType) => {
  trackEvent('Game', 'Correct Answer', gameType);
};

/**
 * აფიქსირებს არასწორი პასუხის ივენთს
 * @param {string} gameType - თამაშის ტიპი
 */
export const trackIncorrectAnswer = (gameType) => {
  trackEvent('Game', 'Incorrect Answer', gameType);
};

/**
 * აფიქსირებს ღილაკზე დაჭერის ივენთს
 * @param {string} buttonName - ღილაკის სახელი
 */
export const trackButtonClick = (buttonName) => {
  trackEvent('User Interaction', 'Button Click', buttonName);
};

/**
 * აფიქსირებს მომხმარებლის რეგისტრაციის ივენთს
 */
export const trackRegistration = () => {
  trackEvent('User', 'Registration', 'New User');
};

/**
 * აფიქსირებს მომხმარებლის ავტორიზაციის ივენთს
 */
export const trackLogin = () => {
  trackEvent('User', 'Login', 'User Login');
};

const analyticsService = {
  initGA,
  initializeConsentMode,
  setAnalyticsConsent,
  getAnalyticsConsentState,
  hasConsentDecision,
  hasAnalyticsConsent,
  trackPageView,
  trackEvent,
  trackGameStart,
  trackWordSelection,
  trackCorrectAnswer,
  trackIncorrectAnswer,
  trackButtonClick,
  trackRegistration,
  trackLogin,
};

export default analyticsService;
