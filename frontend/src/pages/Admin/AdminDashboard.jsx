import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser, isAdmin, getToken } from '../../services/auth';
import './AdminDashboard.scss';
import api from '../../services/api';

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalLetters: 33,
    totalWords: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  
  // ✅ Users management state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all'); // all, admin, moder, user

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
    
    console.log("Current User:", currentUser);
    console.log("Is Admin:", currentUser?.is_admin);
    console.log("Is Moderator:", currentUser?.is_moder);
  }, []);

  // ✅ Fetch users when 'users' tab is active
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  // ✅ Fetch all users from API
  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    
    try {
      const response = await api.get('/admin/users', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
          // 'Content-Type': 'application/json'
        }
      });

      if (!response.status) {
        throw new Error('Failed to fetch users');
      }

      const data = response.data;
      setUsers(data.users || []);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalUsers: data.total || 0,
        activeUsers: data.users?.filter(u => u.is_active).length || 0
      }));
      
      console.log('✅ Users loaded:', data.users?.length);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setUsersError(error.message);
    } finally {
      setUsersLoading(false);
    }
  };

  // ✅ Toggle user active status
  const toggleUserActive = async (userId, currentStatus) => {
    if (!window.confirm(`ნამდვილად გინდა მომხმარებლის ${currentStatus ? 'დეაქტივაცია' : 'აქტივაცია'}?`)) {
      return;
    }

    try {
      // ✅ Option 1: config მესამე პარამეტრად
      const response = await api.patch(
        `/admin/users/${userId}/toggle-active`,
        null,  // ← body არ გვჭირდება
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            // 'Content-Type': 'application/json'
          }
        }
      );

      // ✅ Option 2: headers ზედმეტია (api.js interceptor-ი ავტომატურად ამატებს!)
      // const response = await api.patch(`/admin/users/${userId}/toggle-active`);
      // ↑ api.js interceptor-ი ავტომატურად დაამატებს Authorization header-ს!

      if (!response.status) {
        throw new Error('Failed to update user');
      }

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      ));
      
      console.log('✅ User status updated');
    } catch (error) {
      console.error('❌ Error updating user:', error);
      alert('შეცდომა: ' + error.message);
    }
  };

  // ✅ Change user role
  const changeUserRole = async (userId, field, value) => {
    const roleText = field === 'is_admin' ? 'Admin' : 'Moderator';
    if (!window.confirm(`ნამდვილად გინდა ${roleText} როლის ${value ? 'მინიჭება' : 'მოხსნა'}?`)) {
      return;
    }
    console.log(`Changing user ${userId} role: ${field} = ${value}`);

    try {
      const response = await api.patch(`/admin/users/${userId}/role`, null, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          // 'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [field]: value
        })
      });

      if (!response.status) {
        throw new Error('Failed to update role');
      }

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, [field]: value } : u
      ));
      
      console.log('✅ User role updated');
    } catch (error) {
      console.error('❌ Error updating role:', error);
      alert('შეცდომა: ' + error.message);
    }
  };

  // ✅ Delete user
  const deleteUser = async (userId, username) => {
    if (!window.confirm(`ნამდვილად გინდა მომხმარებლის "${username}" წაშლა? ეს ქმედება შეუქცევადია!`)) {
      return;
    }

    try {
      const response = await api.delete(`/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          // 'Content-Type': 'application/json'
        }
      });

      if (!response.status) {
        throw new Error('Failed to delete user');
      }

      // Remove from local state
      setUsers(users.filter(u => u.id !== userId));
      
      console.log('✅ User deleted');
      alert('მომხმარებელი წარმატებით წაიშალა');
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      alert('შეცდომა: ' + error.message);
    }
  };

  // ✅ Filter and search users
  const filteredUsers = users.filter(u => {
    // Search filter
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Role filter
    let matchesRole = true;
    if (filterRole === 'admin') matchesRole = u.is_admin;
    else if (filterRole === 'moder') matchesRole = u.is_moder && !u.is_admin;
    else if (filterRole === 'user') matchesRole = !u.is_admin && !u.is_moder;
    
    return matchesSearch && matchesRole;
  });


  console.log("AdminDashboard Rendered", filteredUsers);



  // console.log("Rendering AdminDashboard - Active Tab:", activeTab, filteredUsers);
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.5rem'
      }}>
        ⏳ იტვირთება...
      </div>
    );
  }

  if (!user || !isAdmin()) {
    console.warn("Access denied: User is not admin");
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>
            {user.is_admin ? '👑' : '🛡️'} Admin Panel
          </h2>
          <p className="user-role">
            {user.is_admin ? 'Administrator' : 'Moderator'}
          </p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="icon">📈</span>
            <span>მთავარი</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="icon">👥</span>
            <span>მომხმარებლები</span>
            {users.length > 0 && <span className="badge">{users.length}</span>}
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'letters' ? 'active' : ''}`}
            onClick={() => setActiveTab('letters')}
          >
            <span className="icon">📚</span>
            <span>ანბანი</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <span className="icon">📝</span>
            <span>კონტენტი</span>
          </button>
          
          {user.is_admin && (
            <button 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="icon">⚙️</span>
              <span>პარამეტრები</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <div className="content-header">
          <h1>
            {activeTab === 'overview' && '📈 მთავარი გვერდი'}
            {activeTab === 'users' && '👥 მომხმარებლების მართვა'}
            {activeTab === 'letters' && '📚 ანბანის მართვა'}
            {activeTab === 'content' && '📝 კონტენტის მართვა'}
            {activeTab === 'settings' && '⚙️ პარამეტრები'}
          </h1>
          <p className="welcome-text">
            მოგესალმებით, {user.username}!
          </p>
        </div>

        <div className="content-body">
          {/* ========== OVERVIEW TAB ========== */}
          {activeTab === 'overview' && (
            <div className="stats-grid">
              <div className="stat-card users">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>მომხმარებლები</h3>
                  <p className="stat-number">{stats.totalUsers}</p>
                  <p className="stat-label">სულ რეგისტრირებული</p>
                </div>
              </div>
              
              <div className="stat-card active">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>აქტიური</h3>
                  <p className="stat-number">{stats.activeUsers}</p>
                  <p className="stat-label">აქტიური მომხმარებლები</p>
                </div>
              </div>
              
              <div className="stat-card letters">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h3>ასოები</h3>
                  <p className="stat-number">{stats.totalLetters}</p>
                  <p className="stat-label">ქართული ანბანი</p>
                </div>
              </div>
              
              <div className="stat-card words">
                <div className="stat-icon">📝</div>
                <div className="stat-info">
                  <h3>სიტყვები</h3>
                  <p className="stat-number">{stats.totalWords}</p>
                  <p className="stat-label">სწავლის მასალა</p>
                </div>
              </div>
            </div>
          )}

          {/* ========== USERS TAB ========== */}
          {activeTab === 'users' && (
            <div className="users-management">
              {/* Header with search and filters */}
              <div className="users-header">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 ძებნა (სახელი, ელ-ფოსტა)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${filterRole === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterRole('all')}
                  >
                    ყველა ({users.length})
                  </button>
                  <button 
                    className={`filter-btn ${filterRole === 'admin' ? 'active' : ''}`}
                    onClick={() => setFilterRole('admin')}
                  >
                    👑 Admins ({users.filter(u => u.is_admin).length})
                  </button>
                  <button 
                    className={`filter-btn ${filterRole === 'moder' ? 'active' : ''}`}
                    onClick={() => setFilterRole('moder')}
                  >
                    🛡️ Moderators ({users.filter(u => u.is_moder && !u.is_admin).length})
                  </button>
                  <button 
                    className={`filter-btn ${filterRole === 'user' ? 'active' : ''}`}
                    onClick={() => setFilterRole('user')}
                  >
                    👤 Users ({users.filter(u => !u.is_admin && !u.is_moder).length})
                  </button>
                </div>

                <button 
                  className="refresh-btn"
                  onClick={fetchUsers}
                  disabled={usersLoading}
                >
                  🔄 განახლება
                </button>
              </div>

              {/* Loading state */}
              {usersLoading && (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>მომხმარებლები იტვირთება...</p>
                </div>
              )}

              {/* Error state */}
              {usersError && (
                <div className="error-state">
                  <p>❌ შეცდომა: {usersError}</p>
                  <button onClick={fetchUsers}>თავიდან ცდა</button>
                </div>
              )}

              {/* Users table */}
              {!usersLoading && !usersError && (
                <>
                  <div className="users-count">
                    ნაპოვნია: <strong>{filteredUsers.length}</strong> მომხმარებელი
                  </div>

                  <div className="users-table-container">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>მომხმარებელი</th>
                          <th>ელ-ფოსტა</th>
                          <th>როლი</th>
                          <th>სტატუსი</th>
                          <th>რეგისტრაცია</th>
                          <th>მოქმედებები</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="no-data">
                              მომხმარებლები არ მოიძებნა
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map(u => (
                            <tr key={u.id} className={!u.is_active ? 'inactive' : ''}>
                              <td>#{u.id}</td>
                              <td>
                                <div className="user-cell">
                                  <div className={`user-avatar ${u.is_admin ? 'admin' : u.is_moder ? 'moder' : ''}`}>
                                    {u.username.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="username">{u.username}</span>
                                </div>
                              </td>
                              <td>{u.email}</td>
                              <td>
                                <div className="role-badges">
                                  {u.is_admin && <span className="role-badge admin">👑 Admin</span>}
                                  {u.is_moder && !u.is_admin && <span className="role-badge moder">🛡️ Mod</span>}
                                  {!u.is_admin && !u.is_moder && <span className="role-badge user">👤 User</span>}
                                </div>
                              </td>
                              <td>
                                <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                                  {u.is_active ? '✅ აქტიური' : '❌ არააქტიური'}
                                </span>
                              </td>
                              <td className="date-cell">
                                {new Date(u.created_at).toLocaleDateString('ka-GE')}
                              </td>
                              <td>
                                <div className="action-buttons">
                                  {/* Toggle Active */}
                                  <button
                                    className={`action-btn ${u.is_active ? 'deactivate' : 'activate'}`}
                                    onClick={() => toggleUserActive(u.id, u.is_active)}
                                    title={u.is_active ? 'დეაქტივაცია' : 'აქტივაცია'}
                                  >
                                    {u.is_active ? '🔒' : '🔓'}
                                  </button>

                                  {/* Toggle Admin */}
                                  {/* <button
                                    className={`action-btn ${u.is_admin ? 'remove-role' : 'add-role'}`}
                                    onClick={() => changeUserRole(u.id, 'is_admin', !u.is_admin)}
                                    title={u.is_admin ? 'Admin როლის მოხსნა' : 'Admin როლის მინიჭება'}
                                  >
                                    👑
                                  </button> */}

                                  {/* Toggle Moderator */}
                                  <button
                                    className={`action-btn ${u.is_moder ? 'remove-role' : 'add-role'}`}
                                    onClick={() => changeUserRole(u.id, 'is_moder', !u.is_moder)}
                                    title={u.is_moder ? 'Moderator როლის მოხსნა' : 'Moderator როლის მინიჭება'}
                                  >
                                    🛡️
                                  </button>

                                  {/* Delete User */}
                                  <button
                                    className="action-btn delete"
                                    onClick={() => deleteUser(u.id, u.username)}
                                    title="მომხმარებლის წაშლა"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========== OTHER TABS ========== */}
          {activeTab === 'letters' && (
            <div className="letters-management">
              <h2>ანბანის მართვა</h2>
              <p>მალე დაემატება...</p>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="content-management">
              <h2>კონტენტის მართვა</h2>
              <p>მალე დაემატება...</p>
            </div>
          )}

          {activeTab === 'settings' && user.is_admin && (
            <div className="settings-management">
              <h2>პარამეტრები</h2>
              <p>მალე დაემატება...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;