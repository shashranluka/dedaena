import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home';
import GamePage from './pages/Game/GamePage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ModeratorDashboard from './pages/Moderator/ModeratorDashboard';

function App() {
    console.log("App component rendered");
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}

        {/* Protected Routes - ავტორიზებული მომხმარებლები */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/game" 
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          } 
        />

        {/* Moderator Only - მხოლოდ მოდერატორი ან ადმინი */}
        <Route 
          path="/moderator" 
          element={
            <ProtectedRoute requireModerator={true}>
              <ModeratorDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Admin Only - მხოლოდ ადმინი */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* 404 Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;