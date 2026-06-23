import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserPlus, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already logged in, go directly to cases list
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/cases');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password || !fullName || !role) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    const result = await register(
      email,
      password,
      fullName,
      role,
      university,
      graduationYear
    );

    if (result.success) {
      navigate('/login?registered=true');
    } else {
      setErrorMsg(result.error);
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: '110vh' }}>
      <div className="card auth-card" style={{ maxWidth: '520px', padding: '32px' }}>
        <div className="auth-header" style={{ marginBottom: '24px' }}>
          <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
            <img src={`${API_URL}/static/images/logo.png`} alt="DentalSim Logo" style={{ height: '64px', width: 'auto', borderRadius: '12px' }} />
          </div>
          <h2 className="auth-title" style={{ fontSize: '24px' }}>Tạo tài khoản học viên</h2>
          <p className="auth-subtitle">Tham gia huấn luyện kỹ năng khai thác bệnh lịch nha khoa</p>
        </div>


        {errorMsg && (
          <div className="alert-box alert-danger" style={{ marginBottom: '20px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="fullName">Họ và tên *</label>
            <input
              id="fullName"
              type="text"
              className="input-field"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email đăng ký *</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="hocvien@dentalsim.edu.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Mật khẩu *</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="role">Vai trò học tập *</label>
            <select
              id="role"
              className="input-field"
              style={{ cursor: 'pointer' }}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="student">Sinh viên Y Nha khoa</option>
              <option value="intern_doctor">Bác sĩ thực tập</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="university">Trường đại học</label>
              <input
                id="university"
                type="text"
                className="input-field"
                placeholder="ĐH Y Dược..."
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="gradYear">Năm tốt nghiệp</label>
              <input
                id="gradYear"
                type="number"
                className="input-field"
                placeholder="2027"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px', padding: '12px' }}>
            <UserPlus size={18} />
            <span>Đăng ký học viên</span>
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--neutral-700)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
