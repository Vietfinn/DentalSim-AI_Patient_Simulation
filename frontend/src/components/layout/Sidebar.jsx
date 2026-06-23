import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Home, BookOpen, Award, LogOut, Activity } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/cases', label: 'Hồ sơ ca bệnh', icon: BookOpen },
    { path: '/dashboard', label: 'Bảng theo dõi', icon: Award },
  ];

  // Helper to extract initials for user avatar
  const getInitials = (name) => {
    if (!name) return 'DS';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header" style={{ gap: '10px' }}>
        <img src={`${API_URL}/static/images/logo.png`} alt="DentalSim Logo" style={{ height: '32px', width: 'auto', borderRadius: '4px' }} />
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span className="sidebar-logo">DentalSim AI</span>
        </Link>
      </div>


      <nav className="sidebar-nav">
        <Link 
          to="/cases" 
          className={`sidebar-item ${location.pathname === '/cases' ? 'active' : ''}`}
        >
          <BookOpen size={18} />
          <span>Danh sách ca bệnh</span>
        </Link>
        <Link 
          to="/dashboard" 
          className={`sidebar-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          <Award size={18} />
          <span>Bảng điều khiển</span>
        </Link>
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="avatar-circle">
              {getInitials(user.full_name)}
            </div>
            <div className="user-meta">
              <span className="user-name" title={user.full_name}>{user.full_name}</span>
              <span className="user-role">
                {user.role === 'intern_doctor' ? 'Bác sĩ thực tập' : 'Sinh viên'}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', marginTop: '8px', padding: '8px 16px', gap: '8px' }}>
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
