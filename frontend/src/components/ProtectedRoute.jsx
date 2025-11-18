import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin, isModerator, isAdminOrModerator } from '../services/auth';

/**
 * Protected Route Component
 * ==========================
 * 
 * გვერდის დაცვა ავტორიზაციის და როლების მიხედვით
 * 
 * Props:
 *   - children: დასაცავი კომპონენტი
 *   - requireAdmin: მხოლოდ admin-ებისთვის (default: false)
 *   - requireModerator: admin ან moderator-ებისთვის (default: false)
 * 
 * Examples:
 *   <ProtectedRoute>
 *     <ProfilePage />
 *   </ProtectedRoute>
 * 
 *   <ProtectedRoute requireAdmin={true}>
 *     <AdminSettings />
 *   </ProtectedRoute>
 * 
 *   <ProtectedRoute requireModerator={true}>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 */

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireModerator = false 
}) => {
  // 1. შემოწმება: მომხმარებელი ავტორიზებულია?
  if (!isAuthenticated()) {
    console.warn('🔒 Access denied: User not authenticated');
    return <Navigate to="/login" replace />;
  }

  // 2. შემოწმება: საჭიროა admin როლი?
  if (requireAdmin && !isAdmin()) {
    console.warn('🔒 Access denied: Admin role required');
    return <Navigate to="/" replace />;
  }

  // 3. შემოწმება: საჭიროა moderator ან admin როლი?
  if (requireModerator && !isModerator()) {
    console.warn('🔒 Access denied: Moderator or Admin role required');
    return <Navigate to="/" replace />;
  }

  // ✅ ყველა შემოწმება გავლილია - კომპონენტის ჩვენება
  return children;
};

export default ProtectedRoute;