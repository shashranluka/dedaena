import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import CookieConsentBanner from './components/CookieConsentBanner/CookieConsentBanner.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import {
  getAnalyticsConsentState,
  initGA,
  initializeConsentMode,
  setAnalyticsConsent as persistAnalyticsConsent,
  trackPageView,
} from './services/analytics';

// Pages
import LettersPage from './pages/LettersPage/LettersPage.jsx';
import Gogebashvili from './pages/Gogebashvili/Gogebashvili';
import GameDedaena from './pages/GameDedaena/GameDedaena';
import Registration from './pages/Registration/Registration.jsx';
import Login from './pages/Login/Login.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import ModeratorDashboard from './pages/Moderator/ModeratorDashboard.jsx';
import Terms from './pages/Terms/Terms.jsx';
import Privacy from './pages/Privacy/Privacy.jsx';

// Component to track page views on route changes
function Analytics({ enabled }) {
  const location = useLocation();

  useEffect(() => {
    if (enabled) {
      trackPageView(location.pathname);
    }
  }, [enabled, location.pathname]);

  return null;
}

function App() {
  const [analyticsConsent, setAnalyticsConsentState] = useState(() => getAnalyticsConsentState());
  const showConsentBanner = analyticsConsent === null;

  useEffect(() => {
    initializeConsentMode();
  }, []);

  useEffect(() => {
    if (analyticsConsent === 'granted') {
      initGA();
    }
  }, [analyticsConsent]);

  const handleConsentChoice = (granted) => {
    persistAnalyticsConsent(granted);
    setAnalyticsConsentState(granted ? 'granted' : 'denied');
  };

  console.log("App rendered");
  return (
    <BrowserRouter>
      <Analytics enabled={analyticsConsent === 'granted'} />
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<GameDedaena />} />
        <Route path="/letters" element={<LettersPage />} />
        <Route path="/gogebashvili" element={<Gogebashvili />} />
        <Route path="/gamededaena" element={<GameDedaena />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Moderator Routes - admin და moderator-ებისთვის */}
        <Route
          path="/moderator"
          element={
            <ProtectedRoute requireModerator={true}>
              <ModeratorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - მხოლოდ admin-ებისთვის */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>

      <CookieConsentBanner
        visible={showConsentBanner}
        onAccept={() => handleConsentChoice(true)}
        onReject={() => handleConsentChoice(false)}
      />
    </BrowserRouter>
  );
}

export default App;