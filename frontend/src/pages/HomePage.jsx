import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, Stethoscope, BrainCircuit, Activity, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="animate-fade" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
      {/* Navigation Top Bar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px', borderBottom: '1px solid var(--neutral-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={`${API_URL}/static/images/logo.png`} alt="DentalSim Logo" style={{ height: '36px', width: 'auto', borderRadius: '6px' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--neutral-900)' }}>
            DentalSim AI
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--neutral-700)' }}>
                Bác sĩ: <strong>{user?.full_name}</strong>
              </span>
              <Link to="/cases" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                Vào học tập
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                Đăng ký học viên
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Banner Section */}
      <section className="landing-hero">
        <div className="hero-text">
          <span className="badge-tag">Học tập & Đào tạo thế hệ mới</span>
          <h1 className="hero-title">
            Nâng cao tay nghề khám<br />
            <span>Nha khoa Lâm sàng</span> với AI
          </h1>
          <p className="hero-subtitle">
            Hệ thống mô phỏng tương tác bệnh nhân nha khoa thông minh. Sinh viên và bác sĩ thực tập có thể luyện tập kỹ năng khai thác bệnh lịch, đặt câu hỏi chẩn đoán và xử trí các chuyên khoa Nội Nha, Nha Chu, Phẫu Thuật Răng, Bệnh Lý Miệng... trực quan, sinh động.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/cases" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '16px' }}>
                Bắt đầu chọn ca bệnh
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '16px' }}>
                  Đăng nhập học tập
                </Link>
                <Link to="/register" className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: '16px' }}>
                  Tìm hiểu thêm
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="hero-illustration">
          <div className="pulse-circle" style={{ overflow: 'hidden', padding: '16px', backgroundColor: '#fff', borderRadius: '24px', boxShadow: 'var(--shadow-md)' }}>
            <img src={`${API_URL}/static/images/logo_with_name.png`} alt="DentalSim AI Hero Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = `${API_URL}/static/images/logo.png` }} />
          </div>
        </div>
      </section>


      {/* Feature Section */}
      <section style={{ padding: '60px 0 100px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
          Các tính năng cốt lõi của nền tảng
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--neutral-700)', maxWidth: '600px', margin: '0 auto 48px', fontSize: '15px' }}>
          Được thiết kế chuyên sâu nhằm cung cấp môi trường mô phỏng chân thực và bảo mật nhất cho việc giảng dạy và thực tập nha khoa.
        </p>

        <div className="features-grid">
          <div className="card feature-card">
            <div className="feature-icon-wrapper">
              <Stethoscope size={24} />
            </div>
            <h3 style={{ fontSize: '18px' }}>Mô phỏng 20+ ca lâm sàng</h3>
            <p style={{ fontSize: '14px', color: 'var(--neutral-700)', lineHeight: '1.5' }}>
              Danh sách ca bệnh đa dạng thuộc nhiều chuyên khoa lớn (Nội Nha, Nha Chu, Chấn Thương, Phẫu thuật răng khôn, Bệnh lý miệng, Chỉnh Nha...).
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon-wrapper" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-dark)' }}>
              <BrainCircuit size={24} />
            </div>
            <h3 style={{ fontSize: '18px' }}>Tương tác hội thoại thông minh</h3>
            <p style={{ fontSize: '14px', color: 'var(--neutral-700)', lineHeight: '1.5' }}>
              Bệnh nhân AI trả lời dựa trên tính cách được cá nhân hóa, từ chối sử dụng thuật ngữ chuyên môn và chỉ cung cấp thông tin khi hỏi đúng trọng tâm.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon-wrapper" style={{ backgroundColor: 'HSL(142, 72%, 95%)', color: 'var(--success)' }}>
              <CheckCircle size={24} />
            </div>
            <h3 style={{ fontSize: '18px' }}>Chẩn đoán & Đánh giá lập tức</h3>
            <p style={{ fontSize: '14px', color: 'var(--neutral-700)', lineHeight: '1.5' }}>
              Gửi chẩn đoán để đối chiếu kết quả chính xác, nhận phản hồi lời giải thích chi tiết, đồng thời lưu trữ điểm số vào bảng xếp hạng.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--neutral-200)', padding: '32px 0', textAlign: 'center', fontSize: '13px', color: 'var(--neutral-700)' }}>
        <p>© 2026 DentalSim AI Professional Simulator. Phát triển cho mục đích giáo dục y khoa lâm sàng.</p>
      </footer>
    </div>
  );
};

export default HomePage;
