import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogIn, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const { login, isAuthenticated } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect to cases
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/cases');
    }
  }, [isAuthenticated, navigate]);

  // Check query params for session expiration or registration success alert
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired')) {
      setInfoMsg('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
    } else if (params.get('registered')) {
      setInfoMsg('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
    }
  }, [location]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email || !password) {
      setErrorMsg('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      navigate('/cases');
    } else {
      setErrorMsg(result.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <div className="auth-header">
          <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
            <img src={`${API_URL}/static/images/logo.png`} alt="DentalSim Logo" style={{ height: '64px', width: 'auto', borderRadius: '12px' }} />
          </div>
          <h2 className="auth-title">Đăng nhập DentalSim</h2>
          <p className="auth-subtitle">Trình mô phỏng khám Nha khoa Lâm sàng AI</p>
        </div>


        {errorMsg && (
          <div className="alert-box alert-danger">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="alert-box" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-glow)' }}>
            <AlertCircle size={16} />
            <span>{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email học tập</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="ten@university.edu.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', padding: '12px' }}>
            <LogIn size={18} />
            <span>Đăng nhập</span>
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--neutral-700)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
