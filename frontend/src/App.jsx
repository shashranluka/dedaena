import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Home from './pages/Home/Home.jsx';
import LettersPage from './pages/LettersPage/LettersPage.jsx';
import Gogebashvili from './pages/Gogebashvili/Gogebashvili';
import GameDedaena from './pages/GameDedaena/GameDedaena';
import Registration from './pages/Registration/Registration.jsx';
import Login from './pages/Login/Login.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import ModeratorDashboard from './pages/Moderator/ModeratorDashboard.jsx';

function App() {
  console.log("App rendered");
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<GameDedaena />} />
        <Route path="/letters" element={<LettersPage />} />
        <Route path="/gogebashvili" element={<Gogebashvili />} />
        <Route path="/gamededaena" element={<GameDedaena />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/login" element={<Login />} />

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
    </BrowserRouter>
  );
}

export default App;