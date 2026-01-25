import ReactGA from 'react-ga4';

// Google Analytics Measurement ID
// მიიღე Google Analytics-დან: https://analytics.google.com/
// Admin > Property Settings > Measurement ID (იწყება G- პრეფიქსით)
const MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

let isInitialized = false;

/**
 * ინიციალიზაცია უწევს Google Analytics-ს
 * ამოწმებს Measurement ID-ს და ახდენს GA-ს კონფიგურაციას
 */
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

/**
 * აგზავნის გვერდის ნახვის მონაცემებს Google Analytics-ში
 * @param {string} path - გვერდის მისამართი
 */
export const trackPageView = (path) => {
  if (isInitialized) {
    ReactGA.send({ hitType: 'pageview', page: path, title: document.title });
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
