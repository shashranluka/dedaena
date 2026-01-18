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

  // ✅ Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [auditStats, setAuditStats] = useState(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(0);
  const [auditFilters, setAuditFilters] = useState({
    username: '',
    action: '',
    table_name: ''
  });

  // State-ში დაამატე:
  const [expandedValue, setExpandedValue] = useState(null);

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

  // ✅ Fetch audit logs when 'audit' tab is active
  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
      fetchAuditStats();
    }
  }, [activeTab, auditPage, auditFilters]);

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
      const response = await api.patch(`/admin/users/${userId}/role`, 
        { [field]: value }, // Body/Data მეორე პარამეტრად
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      

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

  // ✅ Fetch audit logs
  // მიზანი: audit_logs ცხრილიდან ლოგების წამოღება ფილტრებითა და pagination-ით
  // რას აკეთებს:
  //   - აგებს URL params-ს (page, page_size, username, action, table_name)
  //   - აგზავნის GET request-ს /admin/audit/logs-ზე Authorization header-ით
  //   - იღებს პასუხს: logs მასივს, total-ს, pagination info-ს
  //   - ახალდებს state-ს: auditLogs, auditTotal, auditTotalPages
  // გამოყენება: როცა admin audit logs ტაბს ხსნის ან ფილტრებს/pagination-ს იცვლის
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    setAuditError(null);
    
    try {
      const params = new URLSearchParams({
        page: auditPage.toString(),
        page_size: '50'
      });
      
      if (auditFilters.username) params.append('username', auditFilters.username);
      if (auditFilters.action) params.append('action', auditFilters.action);
      if (auditFilters.table_name) params.append('table_name', auditFilters.table_name);
      
      const response = await api.get(`/admin/audit/logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.status) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = response.data;
      setAuditLogs(data.logs || []);
      setAuditTotal(data.total || 0);
      setAuditTotalPages(data.total_pages || 0);
      
      console.log('✅ Audit logs loaded:', data.logs?.length);
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error);
      setAuditError(error.message);
    } finally {
      setAuditLoading(false);
    }
  };

  // ✅ Fetch audit statistics
  // მიზანი: audit logs-ის სტატისტიკური მონაცემების წამოღება dashboard-ის stat cards-ისთვის
  // რას აკეთებს:
  //   - აგზავნის GET request-ს /admin/audit/stats-ზე Authorization header-ით
  //   - იღებს: total_logs (სულ ლოგები), actions (მოქმედებების რაოდენობა), 
  //           tables (ცხრილების რაოდენობა), recent_activity (ბოლო 24 საათში)
  //   - ახალდებს auditStats state-ს რომელიც გამოჩნდება stat cards-ში
  // გამოყენება: audit ტაბზე გადასვლისას sidebar-ის badge-ისთვის და stat cards-ისთვის
  const fetchAuditStats = async () => {
    try {
      const response = await api.get('/admin/audit/stats', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.status) {
        setAuditStats(response.data);
        console.log('✅ Audit stats loaded');
      }
    } catch (error) {
      console.error('❌ Error fetching audit stats:', error);
    }
  };

  // modal handler:
  const showFullValue = (type, value, logId) => {
    setExpandedValue({ type, value, log_id: logId });
  };

  const closeValueModal = () => {
    setExpandedValue(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('✅ დაკოპირდა clipboard-ში');
  };

  console.log("AdminDashboard Rendered", filteredUsers);



  // console.log("Rendering AdminDashboard - Active Tab:", activeTab, filteredUsers);
  if (loading) {
    return (
      <div className="loading-screen">
        ⏳ იტვირთება...
      </div>
    );
  }
  console.log("User state at render:", user);
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
          
          {user.is_admin && (
            <button 
              className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <span className="icon">📋</span>
              <span>Audit Logs</span>
              {auditStats && <span className="badge">{auditStats.recent_activity}</span>}
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
            {activeTab === 'audit' && '📋 Audit Logs'}
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

          {/* ========== AUDIT LOGS TAB ========== */}
          {activeTab === 'audit' && user.is_admin && (
            <div className="audit-logs-management">
              {/* Stats Cards */}
              {auditStats && (
                <div className="audit-stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                      <h3>სულ ლოგები</h3>
                      <p className="stat-number">{auditStats.total_logs}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-info">
                      <h3>ბოლო 24 საათი</h3>
                      <p className="stat-number">{auditStats.recent_activity}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-info">
                      <h3>მოქმედებები</h3>
                      <p className="stat-number">{Object.keys(auditStats.actions || {}).length}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📁</div>
                    <div className="stat-info">
                      <h3>ცხრილები</h3>
                      <p className="stat-number">{Object.keys(auditStats.tables || {}).length}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="audit-filters">
                <input
                  type="text"
                  placeholder="🔍 მომხმარებლის სახელი..."
                  value={auditFilters.username}
                  onChange={(e) => {
                    setAuditFilters({...auditFilters, username: e.target.value});
                    setAuditPage(1);
                  }}
                  className="filter-input"
                />
                <select
                  value={auditFilters.action}
                  onChange={(e) => {
                    setAuditFilters({...auditFilters, action: e.target.value});
                    setAuditPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="">ყველა მოქმედება</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="TOGGLE_PLAYABLE">TOGGLE_PLAYABLE</option>
                </select>
                <select
                  value={auditFilters.table_name}
                  onChange={(e) => {
                    setAuditFilters({...auditFilters, table_name: e.target.value});
                    setAuditPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="">ყველა ცხრილი</option>
                  <option value="words">words</option>
                  <option value="sentences">sentences</option>
                  <option value="proverbs">proverbs</option>
                  <option value="toreads">toreads</option>
                  <option value="gogebashvili_1_with_ids">gogebashvili</option>
                </select>
                <button
                  className="refresh-btn"
                  onClick={() => {
                    fetchAuditLogs();
                    fetchAuditStats();
                  }}
                  disabled={auditLoading}
                >
                  🔄 განახლება
                </button>
              </div>

              {/* Loading state */}
              {auditLoading && (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Audit logs იტვირთება...</p>
                </div>
              )}

              {/* Error state */}
              {auditError && (
                <div className="error-state">
                  <p>❌ შეცდომა: {auditError}</p>
                  <button onClick={fetchAuditLogs}>თავიდან ცდა</button>
                </div>
              )}

              {/* Logs table */}
              {!auditLoading && !auditError && (
                <>
                  <div className="audit-count">
                    ნაპოვნია: <strong>{auditTotal}</strong> ლოგი
                  </div>

                  <div className="audit-table-container">
                    <table className="audit-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>დრო</th>
                          <th>მომხმარებელი</th>
                          <th>მოქმედება</th>
                          <th>ცხრილი</th>
                          <th>Record ID</th>
                          <th>ძველი მნიშვნელობა</th>
                          <th>ახალი მნიშვნელობა</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="no-data">
                              ლოგები არ მოიძებნა
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map(log => (
                            <tr key={log.id}>
                              <td>#{log.id}</td>
                              <td className="date-cell">
                                {new Date(log.timestamp).toLocaleString('ka-GE')}
                              </td>
                              <td>
                                <div className="user-badge">
                                  {log.username || 'System'}
                                </div>
                              </td>
                              <td>
                                <span className={`action-badge ${log.action.toLowerCase()}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="table-name">{log.table_name}</td>
                              <td>#{log.record_id}</td>
                              <td className="value-cell">
                                {log.old_value ? (
                                  <span 
                                    className="old-value clickable" 
                                    title="დააჭირე სრული ტექსტის სანახავად"
                                    onClick={() => showFullValue('old', log.old_value, log.id)}
                                  >
                                    {log.old_value.length > 50 
                                      ? log.old_value.substring(0, 50) + '...' 
                                      : log.old_value}
                                    {log.old_value.length > 50 && ' 🔍'}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="value-cell">
                                {log.new_value ? (
                                  <span 
                                    className="new-value clickable" 
                                    title="დააჭირე სრული ტექსტის სანახავად"
                                    onClick={() => showFullValue('new', log.new_value, log.id)}
                                  >
                                    {log.new_value.length > 50 
                                      ? log.new_value.substring(0, 50) + '...' 
                                      : log.new_value}
                                    {log.new_value.length > 50 && ' 🔍'}
                                  </span>
                                ) : '—'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {auditTotalPages > 1 && (
                    <div className="pagination">
                      <button
                        onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                        disabled={auditPage === 1}
                        className="pagination-btn"
                      >
                        ← წინა
                      </button>
                      <span className="pagination-info">
                        გვერდი {auditPage} / {auditTotalPages}
                      </span>
                      <button
                        onClick={() => setAuditPage(p => Math.min(auditTotalPages, p + 1))}
                        disabled={auditPage === auditTotalPages}
                        className="pagination-btn"
                      >
                        შემდეგი →
                      </button>
                    </div>
                  )}
                </>
              )}
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

      {/* Value Modal */}
      {expandedValue && (
        <div 
          className="modal-overlay" 
          onClick={closeValueModal}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {expandedValue.type === 'old' ? '🔴 ძველი მნიშვნელობა' : '🟢 ახალი მნიშვნელობა'}
              </h3>
              <button 
                className="modal-close-btn"
                onClick={closeValueModal}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-value-display">
              {expandedValue.value}
            </div>
            
            <div className="modal-actions">
              <button
                className="modal-btn primary"
                onClick={() => copyToClipboard(expandedValue.value)}
              >
                📋 დაკოპირება
              </button>
              <button
                className="modal-btn secondary"
                onClick={closeValueModal}
              >
                დახურვა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;