import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import api from '../lib/api';
import { DENTAL_DIAGNOSES } from '../lib/constants';
import { Send, ArrowLeft, Image, Check, AlertTriangle, HelpCircle, FileText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PracticePage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);
  
  // Chat stream states
  const { messages, loading, isTyping, error, fetchHistory, sendMessage } = useChat(sessionId);
  const [inputText, setInputText] = useState('');
  
  // Diagnosis submission modal states
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [submittingDiag, setSubmittingDiag] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch session details and history on load
  useEffect(() => {
    const fetchSessionDetails = async () => {
      setSessionLoading(true);
      try {
        const response = await api.get(`/api/sessions/${sessionId}`);
        setSession(response.data);
        if (response.data.status !== 'in_progress') {
          // If already completed, display the grading modal
          setSelectedDiagnosis(response.data.user_diagnosis || '');
        }
      } catch (err) {
        console.error('Failed to load session details:', err);
        alert('Không thể tải thông tin phiên thực hành. Vui lòng trở lại trang danh sách.');
        navigate('/cases');
      } finally {
        setSessionLoading(false);
      }
    };

    fetchSessionDetails();
    fetchHistory();
  }, [sessionId, fetchHistory, navigate]);

  // Auto scroll chat to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus on input field on load
  useEffect(() => {
    if (!sessionLoading) {
      inputRef.current?.focus();
    }
  }, [sessionLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;
    const text = inputText;
    setInputText('');
    await sendMessage(text);
  };

  const handleDiagnose = async () => {
    if (!selectedDiagnosis) {
      alert('Vui lòng chọn chẩn đoán xác định trước khi nộp.');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn nộp chẩn đoán: "${selectedDiagnosis}"? Phiên khám bệnh sẽ kết thúc.`)) {
      setSubmittingDiag(true);
      try {
        const response = await api.post(`/api/sessions/${sessionId}/diagnose`, {
          diagnosis: selectedDiagnosis
        });
        setResultData(response.data);
        setShowResultModal(true);
        
        // Refresh session metadata (to change status from in_progress)
        const sessionUpdate = await api.get(`/api/sessions/${sessionId}`);
        setSession(sessionUpdate.data);
      } catch (err) {
        console.error('Failed to submit diagnosis:', err);
        alert('Có lỗi xảy ra khi nộp kết quả. Vui lòng thử lại.');
      } finally {
        setSubmittingDiag(false);
      }
    }
  };

  if (sessionLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--neutral-700)' }}>
          Đang tải dữ liệu hồ sơ bệnh nhân...
        </div>
      </div>
    );
  }

  const patient = session?.case?.patient_info || {};
  const caseTitle = session?.case?.name || 'Ca lâm sàng';
  const imgUrl = session?.case?.image_url 
    ? (session.case.image_url.startsWith('http') ? session.case.image_url : `${API_URL}${session.case.image_url}`) 
    : 'https://media.istockphoto.com/id/1145009653/photo/panoramic-dental-x-ray.jpg?s=612x612&w=0&k=20&c=6c6FzCjPzFw_k4kFzE5hTz7yQy6g_9oK1mF_5_j1jQ=';

  const isSessionClosed = session?.status !== 'in_progress';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top action header */}
      <div className="app-header" style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/cases')} className="btn btn-secondary" style={{ padding: '8px 12px', gap: '4px' }}>
            <ArrowLeft size={16} />
            <span>Trở về</span>
          </button>
          <div>
            <h2 className="header-title" style={{ fontSize: '18px' }}>{caseTitle}</h2>
            <div style={{ fontSize: '12px', color: 'var(--neutral-700)', marginTop: '2px' }}>
              Chuyên khoa: {session?.case?.category} • Mã: {session?.case?.case_code}
            </div>
          </div>
        </div>
        
        {isSessionClosed && (
          <div className={`status-tag ${session?.status === 'diagnosed_correct' ? 'correct' : 'wrong'}`} style={{ fontSize: '13px', padding: '6px 16px' }}>
            {session?.status === 'diagnosed_correct' ? 'Chẩn đoán đúng' : 'Chẩn đoán sai'}
          </div>
        )}
      </div>

      {/* Main Workspace layout */}
      <div className="practice-container">
        
        {/* Left Column: Patient Profile */}
        <section className="practice-sidebar">
          <h3 className="sidebar-section-title">Hồ sơ bệnh nhân</h3>
          
          <div className="patient-info-list">
            <div className="info-item">
              <span className="info-label">Họ và tên</span>
              <span className="info-value">{patient.name}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="info-item">
                <span className="info-label">Tuổi</span>
                <span className="info-value">{patient.age} tuổi</span>
              </div>
              <div className="info-item">
                <span className="info-label">Giới tính</span>
                <span className="info-value">{patient.gender}</span>
              </div>
            </div>

            <div className="info-item">
              <span className="info-label">Tiền sử / Thói quen</span>
              <span className="info-value" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                {patient.medical_history || 'Không có tiền sử bệnh lý đặc biệt.'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Lý do đến khám</span>
              <div className="complaint-box">
                "{patient.complaint}"
              </div>
            </div>
          </div>

          <div className="xray-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '12px', fontWeight: 700, color: 'var(--neutral-700)' }}>
              <Image size={14} />
              <span>CẬN LÂM SÀNG (X-QUANG / ẢNH)</span>
            </div>
            <div className="xray-image-wrapper">
              <img 
                src={imgUrl} 
                alt="Phim cận lâm sàng răng miệng" 
                onError={(e) => { e.target.src = 'https://media.istockphoto.com/id/1145009653/photo/panoramic-dental-x-ray.jpg?s=612x612&w=0&k=20&c=6c6FzCjPzFw_k4kFzE5hTz7yQy6g_9oK1mF_5_j1jQ='; }}
              />
            </div>
          </div>
        </section>

        {/* Middle Column: Chat Workspace */}
        <section className="chat-workspace">
          <div className="chat-messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`msg-row ${msg.role === 'user' ? 'right' : 'left'}`}>
                {msg.role !== 'user' && (
                  <div className="msg-avatar">👤</div>
                )}
                <div className="msg-bubble">
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="msg-avatar">👨‍⚕️</div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="msg-row left">
                <div className="msg-avatar">👤</div>
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            {error && (
              <div className="alert-box alert-danger animate-scale" style={{ margin: '8px 0' }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message input bar */}
          <form onSubmit={handleSend} className="chat-input-bar">
            <input
              ref={inputRef}
              type="text"
              className="chat-textarea"
              placeholder={isSessionClosed ? "Phiên khám đã kết thúc chẩn đoán." : "Khai thác thêm bệnh sử (Hỏi đau khi nào, kích thích ra sao...)"}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSessionClosed || isTyping}
            />
            <button 
              type="submit" 
              className="btn btn-primary btn-icon" 
              disabled={isSessionClosed || isTyping || !inputText.trim()}
              style={{ width: '44px', height: '44px', padding: 0 }}
            >
              <Send size={18} />
            </button>
          </form>
        </section>

        {/* Right Column: Diagnosis Conclusion */}
        <section className="diagnosis-panel">
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Chẩn đoán lâm sàng</h3>
            <p style={{ fontSize: '13px', color: 'var(--neutral-700)', lineHeight: '1.4' }}>
              Hãy hỏi kỹ bệnh sử và xem xét kỹ hình ảnh cận lâm sàng bên trái trước khi đưa ra kết luận chẩn đoán.
            </p>
          </div>

          <div className="diag-dropdown-group">
            <label className="input-label" htmlFor="diagnosisSelect">Chọn tên bệnh lý:</label>
            <select
              id="diagnosisSelect"
              className="diag-dropdown"
              value={selectedDiagnosis}
              onChange={(e) => setSelectedDiagnosis(e.target.value)}
              disabled={isSessionClosed}
            >
              <option value="">-- Vui lòng chọn --</option>
              {DENTAL_DIAGNOSES.map((diag) => (
                <option key={diag} value={diag}>
                  {diag}
                </option>
              ))}
            </select>
          </div>

          <div className="notes-area">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--neutral-700)' }}>
              <FileText size={14} />
              <span>Ghi chú chẩn đoán (Tùy chọn)</span>
            </div>
            <textarea
              className="notes-textarea"
              placeholder="Ghi nhận các triệu chứng chính để đối chiếu sau này..."
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              disabled={isSessionClosed}
            />
          </div>

          {!isSessionClosed ? (
            <button 
              onClick={handleDiagnose}
              className="btn btn-accent"
              style={{ width: '100%', padding: '12px' }}
              disabled={submittingDiag || !selectedDiagnosis}
            >
              <Check size={18} />
              <span>{submittingDiag ? 'Đang nộp...' : 'Nộp chẩn đoán'}</span>
            </button>
          ) : (
            <button 
              onClick={async () => {
                // Fetch grading information if already completed
                try {
                  const res = await api.post(`/api/sessions/${sessionId}/diagnose`, {
                    diagnosis: selectedDiagnosis
                  }).catch(() => {
                    // If diagnosed already, backend might raise validation, let's load mock or get results
                    // Let's call endpoint or fallback to checking the explanation via backend mock
                  });
                  if (res?.data) {
                    setResultData(res.data);
                  } else {
                    // Fallback using dummy details since session is closed
                    setResultData({
                      is_correct: session.status === 'diagnosed_correct',
                      correct_diagnosis: session.case.diagnosis || selectedDiagnosis,
                      explanation: session.case.explanation || 'Vui lòng xem thông tin chi tiết.'
                    });
                  }
                  setShowResultModal(true);
                } catch {
                  // Fallback
                  setResultData({
                    is_correct: session.status === 'diagnosed_correct',
                    correct_diagnosis: selectedDiagnosis,
                    explanation: 'Bệnh án đã nộp chẩn đoán.'
                  });
                  setShowResultModal(true);
                }
              }}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px' }}
            >
              <HelpCircle size={18} />
              <span>Xem giải thích chi tiết</span>
            </button>
          )}
        </section>
      </div>

      {/* Result Modal Overlay */}
      {showResultModal && resultData && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className={`modal-header-banner ${resultData.is_correct ? 'success' : 'error'}`}>
              <div className="banner-icon-circle">
                {resultData.is_correct ? (
                  <Check size={32} />
                ) : (
                  <AlertTriangle size={32} />
                )}
              </div>
              <h2 className="banner-title">
                {resultData.is_correct ? 'Chẩn đoán chính xác!' : 'Chẩn đoán chưa đúng!'}
              </h2>
            </div>

            <div className="modal-body">
              <div className="modal-body-section">
                <span className="section-label">Chẩn đoán của bạn</span>
                <span className="section-content highlight" style={{ color: resultData.is_correct ? 'var(--success)' : 'var(--danger)' }}>
                  {selectedDiagnosis}
                </span>
              </div>

              {!resultData.is_correct && (
                <div className="modal-body-section">
                  <span className="section-label">Đáp án đúng xác định</span>
                  <span className="section-content highlight" style={{ color: 'var(--neutral-900)' }}>
                    {resultData.correct_diagnosis}
                  </span>
                </div>
              )}

              <div className="modal-body-section">
                <span className="section-label">Lời giải thích lâm sàng</span>
                <p className="section-content" style={{ backgroundColor: 'var(--neutral-100)', padding: '14px', borderRadius: 'var(--border-radius-md)', fontStyle: 'italic' }}>
                  {resultData.explanation}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                <button 
                  onClick={() => {
                    setShowResultModal(false);
                    navigate('/cases');
                  }} 
                  className="btn btn-secondary"
                >
                  Danh sách ca bệnh
                </button>
                <button 
                  onClick={() => {
                    setShowResultModal(false);
                    navigate('/dashboard');
                  }} 
                  className="btn btn-primary"
                >
                  Xem bảng theo dõi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticePage;
