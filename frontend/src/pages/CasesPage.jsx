import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import api from '../lib/api';
import { Play, Filter, User } from 'lucide-react';

const CasesPage = () => {
  const [cases, setCases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [creatingSession, setCreatingSession] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const [casesRes, catsRes] = await Promise.all([
          api.get('/api/cases'),
          api.get('/api/cases/categories')
        ]);
        setCases(casesRes.data);
        setCategories(catsRes.data);
      } catch (error) {
        console.error('Failed to load cases:', error);
        setErrorMsg('Không thể tải danh sách ca bệnh. Vui lòng kiểm tra kết nối.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartSession = async (caseId) => {
    setCreatingSession(caseId);
    try {
      const response = await api.post('/api/sessions', { case_id: caseId });
      const newSession = response.data;
      navigate(`/practice/${newSession.id}`);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      alert('Không thể bắt đầu phiên khám bệnh mới. Vui lòng thử lại.');
    } finally {
      setCreatingSession(null);
    }
  };

  // Filter cases based on selected category tab
  const filteredCases = selectedCategory === 'all'
    ? cases
    : cases.filter(c => c.category === selectedCategory);

  return (
    <div className="app-container">
      <Sidebar />
      
      <main className="main-wrapper">
        <Header title="Hồ sơ ca bệnh lâm sàng" />
        
        <div className="content-container">
          {errorMsg && (
            <div className="alert-box alert-danger" style={{ marginBottom: '24px' }}>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Filtering Tab Bar */}
          <div className="cases-filter-bar animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neutral-700)', fontSize: '14px', fontWeight: 600 }}>
              <Filter size={16} />
              <span>Chuyên khoa:</span>
            </div>
            
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                Tất cả ({cases.length})
              </button>
              {categories.map(cat => {
                const count = cases.filter(c => c.category === cat).length;
                return (
                  <button 
                    key={cat}
                    className={`filter-tab ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Layout of Cases */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '16px', color: 'var(--neutral-700)', fontWeight: 600 }}>
                Đang tải danh sách ca bệnh...
              </div>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--neutral-700)' }}>
              Không tìm thấy ca bệnh nào trong chuyên khoa này.
            </div>
          ) : (
            <div className="cases-grid animate-slide">
              {filteredCases.map(c => (
                <div key={c.id} className="card case-card card-hover">
                  <div className="case-badge">{c.category}</div>
                  <h3 className="case-title">{c.name}</h3>
                  
                  <div className="case-complaint">
                    <strong>Lý do khám:</strong> "{c.patient_info.complaint}"
                  </div>

                  <div className="case-patient-summary">
                    <span>Họ tên: <strong>{c.patient_info.name}</strong></span>
                    <span>Tuổi: <strong>{c.patient_info.age}</strong></span>
                    <span>Giới tính: <strong>{c.patient_info.gender}</strong></span>
                  </div>

                  <button 
                    onClick={() => handleStartSession(c.id)}
                    className="btn btn-primary"
                    style={{ marginTop: 'auto', width: '100%', padding: '10px 16px', gap: '8px' }}
                    disabled={creatingSession !== null}
                  >
                    <Play size={16} fill="white" />
                    <span>
                      {creatingSession === c.id ? 'Đang khởi tạo...' : 'Bắt đầu khám'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CasesPage;
