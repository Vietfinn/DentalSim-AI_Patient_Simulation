import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Header = ({ title = 'DentalSim Workspace' }) => {
  const { user } = useAuth();

  return (
    <header className="app-header">
      <h2 className="header-title">{title}</h2>
      
      {user && (
        <div style={{ fontSize: '14px', color: 'var(--neutral-700)', fontWeight: 500 }}>
          Xin chào, <span style={{ color: 'var(--neutral-900)', fontWeight: 600 }}>{user.full_name}</span>
          {user.university && ` (${user.university})`}
        </div>
      )}
    </header>
  );
};

export default Header;
