import ReactGA from 'react-ga4';

// Google Analytics Measurement ID
// მიიღე Google Analytics-დან: https://analytics.google.com/
// Admin > Property Settings > Measurement ID (იწყება G- პრეფიქსით)
const MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

let isInitialized = false;

// Initialize Google Analytics
export const initGA = () => {
  if (!isInitialized && MEASUREMENT_ID && MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.initialize(MEASUREMENT_ID, {
      gaOptions: {
        siteSpeedSampleRate: 100,
      },
    });
    isInitialized = true;
    console.log('Google Analytics initialized with ID:', MEASUREMENT_ID);
  }
};

// Track page view
export const trackPageView = (path) => {
  if (isInitialized) {
    ReactGA.send({ hitType: 'pageview', page: path, title: document.title });
  }
};

// Track custom events
export const trackEvent = (category, action, label = '', value = 0) => {
  if (isInitialized) {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  }
};

// მაგალითები კონკრეტული ივენთებისთვის:

// თამაშის დაწყება
export const trackGameStart = (gameType) => {
  trackEvent('Game', 'Start Game', gameType);
};

// სიტყვის არჩევა
export const trackWordSelection = (word) => {
  trackEvent('Game', 'Word Selected', word);
};

// სწორი პასუხი
export const trackCorrectAnswer = (gameType) => {
  trackEvent('Game', 'Correct Answer', gameType);
};

// არასწორი პასუხი
export const trackIncorrectAnswer = (gameType) => {
  trackEvent('Game', 'Incorrect Answer', gameType);
};

// ღილაკის დაჭერა
export const trackButtonClick = (buttonName) => {
  trackEvent('User Interaction', 'Button Click', buttonName);
};

// რეგისტრაცია
export const trackRegistration = () => {
  trackEvent('User', 'Registration', 'New User');
};

// ავტორიზაცია
export const trackLogin = () => {
  trackEvent('User', 'Login', 'User Login');
};

export default {
  initGA,
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
