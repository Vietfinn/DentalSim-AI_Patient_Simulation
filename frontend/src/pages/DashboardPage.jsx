import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import api from '../lib/api';
import { Award, CheckCircle, MessageSquare, Clock, User, ArrowRight, ExternalLink } from 'lucide-react';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const [statsRes, leaderRes, historyRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/dashboard/leaderboard'),
          api.get('/api/sessions')
        ]);
        setStats(statsRes.data);
        setLeaderboard(leaderRes.data);
        setHistory(historyRes.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setErrorMsg('Không thể tải dữ liệu bảng điều khiển. Vui lòng tải lại trang.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}s`;
    return `${minutes}ph ${remainingSeconds}s`;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'diagnosed_correct': return 'Chính xác';
      case 'diagnosed_wrong': return 'Chưa đúng';
      case 'in_progress': return 'Đang khám';
      default: return status;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      
      <main className="main-wrapper">
        <Header title="Bảng điều khiển & Theo dõi tiến trình" />
        
        <div className="content-container">
          {errorMsg && (
            <div className="alert-box alert-danger" style={{ marginBottom: '24px' }}>
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '16px', color: 'var(--neutral-700)', fontWeight: 600 }}>
                Đang tải dữ liệu tiến trình học tập...
              </div>
            </div>
          ) : (
            <div className="animate-fade">
              {/* Stat Cards Grid */}
              <div className="dashboard-grid">
                <div className="stat-card">
                  <div className="stat-icon-circle" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                    <CheckCircle size={24} />
                  </div>
                  <div className="stat-meta">
                    <span className="stat-label">Số ca hoàn thành</span>
                    <span className="stat-value">{stats?.total_completed || 0}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-circle" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                    <Award size={24} />
                  </div>
                  <div className="stat-meta">
                    <span className="stat-label">Tỷ lệ đúng</span>
                    <span className="stat-value">
                      {stats?.accuracy_rate !== undefined ? `${stats.accuracy_rate}%` : '0%'}
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-circle" style={{ backgroundColor: 'HSL(142, 72%, 40%)', color: 'white' }}>
                    <MessageSquare size={24} />
                  </div>
                  <div className="stat-meta">
                    <span className="stat-label">Hiệu suất hỏi (Avg)</span>
                    <span className="stat-value">
                      {stats?.avg_messages || 0} <span style={{ fontSize: '14px', fontWeight: 600 }}>tin</span>
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-circle" style={{ backgroundColor: 'var(--warning)', color: 'white' }}>
                    <Clock size={24} />
                  </div>
                  <div className="stat-meta">
                    <span className="stat-label">Thời gian trung bình</span>
                    <span className="stat-value" style={{ fontSize: '20px' }}>
                      {formatDuration(stats?.avg_duration_seconds)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Layout Columns */}
              <div className="dashboard-details-layout">
                {/* Left Column: Specialty progress and Practice History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Category Breakdown Progress */}
                  <div className="card">
                    <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '12px', marginBottom: '16px' }}>
                      Tiến độ theo chuyên khoa nha khoa
                    </h3>
                    
                    {(!stats?.category_breakdown || stats.category_breakdown.length === 0) ? (
                      <p style={{ color: 'var(--neutral-700)', fontSize: '14px', padding: '12px 0' }}>
                        Hoàn thành ca bệnh đầu tiên để xem thống kê chuyên khoa.
                      </p>
                    ) : (
                      <div className="category-bars-list">
                        {stats.category_breakdown.map((item) => (
                          <div key={item.category} className="category-bar-item">
                            <div className="bar-meta">
                              <span>{item.category}</span>
                              <span style={{ color: 'var(--neutral-700)' }}>
                                {item.correct}/{item.total} đúng ({item.accuracy_rate}%)
                              </span>
                            </div>
                            <div className="bar-bg">
                              <div className="bar-fill" style={{ width: `${item.accuracy_rate}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Practice History list */}
                  <div className="card dashboard-table-card">
                    <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '12px' }}>
                      Lịch sử luyện tập khám bệnh
                    </h3>
                    
                    {history.length === 0 ? (
                      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--neutral-700)', fontSize: '14px' }}>
                        Chưa có lịch sử thực hành nào.{' '}
                        <Link to="/cases" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                          Khám ca bệnh đầu tiên ngay!
                        </Link>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="dashboard-table">
                          <thead>
                            <tr>
                              <th>Ca bệnh</th>
                              <th>Chuyên khoa</th>
                              <th>Số tin</th>
                              <th>Trạng thái</th>
                              <th>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.slice(0, 10).map((session) => (
                              <tr key={session.id}>
                                <td style={{ fontWeight: 600 }}>{session.case?.name || 'Ca bệnh'}</td>
                                <td>{session.case?.category || '-'}</td>
                                <td>{session.message_count} tin</td>
                                <td>
                                  <span className={`status-tag ${
                                    session.status === 'diagnosed_correct' ? 'correct' : 
                                    session.status === 'diagnosed_wrong' ? 'wrong' : 'progress'
                                  }`}>
                                    {getStatusText(session.status)}
                                  </span>
                                </td>
                                <td>
                                  <Link 
                                    to={`/practice/${session.id}`} 
                                    style={{ 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: '4px', 
                                      fontSize: '13px', 
                                      color: 'var(--primary)', 
                                      fontWeight: 600, 
                                      textDecoration: 'none' 
                                    }}
                                  >
                                    <span>Xem lại</span>
                                    <ExternalLink size={12} />
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Global Leaderboard */}
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <Award size={20} style={{ color: 'var(--warning)' }} />
                    <h3 style={{ fontSize: '18px' }}>Bảng xếp hạng học viên</h3>
                  </div>

                  {leaderboard.length === 0 ? (
                    <p style={{ color: 'var(--neutral-700)', fontSize: '14px', padding: '12px 0' }}>
                      Chưa có học viên nào được xếp hạng.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {leaderboard.map((student) => (
                        <div 
                          key={student.user_id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '12px 16px', 
                            backgroundColor: student.rank === 1 ? 'var(--primary-light)' : 'var(--neutral-100)',
                            border: student.rank === 1 ? '1px solid var(--primary-glow)' : '1px solid transparent',
                            borderRadius: 'var(--border-radius-md)' 
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: 'var(--border-radius-full)', 
                              backgroundColor: student.rank === 1 ? 'var(--warning)' : 'var(--neutral-300)', 
                              color: student.rank === 1 ? 'white' : 'var(--neutral-800)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '13px'
                            }}>
                              {student.rank}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-900)' }}>
                                {student.full_name}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--neutral-700)' }}>
                                {student.university || 'Học viên tự do'}
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                              {student.correct_count} ca đúng
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--neutral-700)' }}>
                              Tỉ lệ: {student.accuracy_rate}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
