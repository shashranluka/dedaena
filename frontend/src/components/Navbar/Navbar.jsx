import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, logoutUser, isAuthenticated, isAdmin } from "../../services/auth";
import './Navbar.scss';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // console.log("Navbar Rendered - Current Path:", location.pathname, user);
  // Check authentication status on component mount and route change
  useEffect(() => {
    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  // Handle logout
  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setShowUserMenu(false);
    navigate("/");
  };

  // Toggle user menu
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  return (
    <nav className="navbar">
      {/* Logo/Brand */}
      <div className="navbar-brand">
        <Link to="/" className="brand-link">
          <span className="brand-icon">📚</span>
          <span className="brand-text">დედაენა</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="navbar-links">
        {/* <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          მთავარი
        </Link> */}
        {/* <Link to="/letters" className={`nav-link ${location.pathname === '/letters' ? 'active' : ''}`}>
          ანბანი
        </Link> */}
        {/* <Link to="/gamededaena" className={`nav-link ${location.pathname === '/gamededaena' ? 'active' : ''}`}>
          თამაში
        </Link> */}
        
        {/* Admin and Moderator Panel Links */}
        {user && (user.is_admin || user.is_moder) && (
          <Link to="/moderator" className="nav-link">
            📝 მოდერაცია
          </Link>
        )}

        {user && user.is_admin && (
          <Link to="/admin" className="nav-link">
            ⚙️ ადმინი
          </Link>
        )}
      </div>

      {/* Auth Section */}
      <div className="navbar-auth">
        {user ? (
          // Logged in user
          <div className="user-menu-container">
            <button 
              className="user-button" 
              onClick={toggleUserMenu}
              aria-label="User menu"
            >
              <div className={`user-avatar ${user.is_admin ? 'admin' : user.is_moder ? 'moder' : ''}`}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user.username}</span>
              {user.is_admin && <span className="badge admin-badge">Admin</span>}
              {user.is_moder && !user.is_admin && <span className="badge moder-badge">Mod</span>}
              <svg 
                className={`chevron ${showUserMenu ? 'open' : ''}`}
                width="16" 
                height="16" 
                viewBox="0 0 16 16"
              >
                <path 
                  fill="currentColor" 
                  d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z"
                />
              </svg>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className={`user-avatar large ${user.is_admin ? 'admin' : user.is_moder ? 'moder' : ''}`}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <div className="user-name-large">
                      {user.username}
                      {user.is_admin && <span className="role-badge">👑 Admin</span>}
                      {user.is_moder && !user.is_admin && <span className="role-badge">🛡️ Mod</span>}
                    </div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                {/* Admin Panel Link in Dropdown */}
                {isAdmin() && (
                  <>
                    <Link 
                      to="/admin" 
                      className="dropdown-item admin-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      <span>Admin Panel</span>
                    </Link>
                    <div className="dropdown-divider"></div>
                  </>
                )}

                <Link 
                  to="/profile" 
                  className="dropdown-item"
                  onClick={() => setShowUserMenu(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>პროფილი</span>
                </Link>

                <Link 
                  to="/settings" 
                  className="dropdown-item"
                  onClick={() => setShowUserMenu(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  <span>პარამეტრები</span>
                </Link>

                <div className="dropdown-divider"></div>

                <button 
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  <span>გასვლა</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // Not logged in
          <div className="auth-buttons">
            {/* <Link to="/login" className="login-btn">
              შესვლა
            </Link> */}
            {/* <Link to="/registration" className="register-btn">
              რეგისტრაცია
            </Link> */}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
