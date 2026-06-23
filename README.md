# DentalSim - AI Clinical Patient Simulation Platform

DentalSim là nền tảng đào tạo nha khoa lâm sàng chuyên nghiệp, ứng dụng Trí tuệ nhân tạo (Generative AI) kết hợp kiến trúc Full-Stack hiện đại. Hệ thống mô phỏng sinh động các bệnh nhân ảo với cá tính và hồ sơ bệnh án chuẩn xác, hỗ trợ học viên và bác sĩ thực tập rèn luyện kỹ năng khai thác bệnh lịch (SOAP), giao tiếp và chẩn đoán lâm sàng.

Hệ thống được phát triển trên kiến trúc Full-Stack hoàn chỉnh (React Frontend + FastAPI Backend) đáp ứng khả năng mở rộng, bảo mật và sẵn sàng triển khai trên môi trường Production.

---

## Tính năng cốt lõi

* **Bệnh nhân ảo thông minh (Information Drip-Feed):** Bệnh nhân AI được thiết lập qua hệ thống Prompt Engineering nâng cao (lưu trữ dạng YAML độc lập). AI đóng vai tự nhiên theo bệnh lịch, chỉ tiết lộ triệu chứng khi được hỏi đúng trọng tâm và diễn đạt hoàn toàn bằng ngôn ngữ bình dân của người bệnh.
* **Cận lâm sàng & Hình ảnh X-quang:** Hiển thị phim chụp X-quang răng (Panorama, quanh chóp) và hình ảnh lâm sàng trực quan tương ứng với hồ sơ bệnh án của từng ca bệnh để hỗ trợ quá trình chẩn đoán.
* **Xác thực học viên:** Đăng ký và đăng nhập tài khoản học viên (phân quyền sinh viên/bác sĩ thực tập) sử dụng mật khẩu mã hóa bằng thư viện bcrypt và cơ chế xác thực JWT.
* **Real-time SSE Streaming Chat:** Phản hồi của bệnh nhân AI được truyền tải theo thời gian thực character-by-character (Server-Sent Events) tăng trải nghiệm tương tác thực tế.
* **Vòng lặp Đánh giá chẩn đoán (Evidence-Based Grading):** Học viên đưa ra chẩn đoán xác định từ danh sách chuẩn hóa. Hệ thống chấm điểm trực tiếp, lưu trữ lịch sử và cung cấp lời giải thích y học thực chứng chi tiết.
* **Bảng theo dõi tiến trình (Dashboard & Leaderboard):** Thống kê số ca đã thực hiện, tỷ lệ chẩn đoán đúng, số lượt hỏi trung bình, tiến độ theo từng chuyên khoa và bảng xếp hạng học viên toàn cầu.

---

## Kiến trúc Hệ thống & An toàn dữ liệu (AI Guardrails)

Dự án áp dụng kiến trúc an toàn **GFI (Guardrails - Filter - Injection)** để kiểm soát luồng dữ liệu:

1. **Injection Detection (Đầu vào):** Quét tin nhắn của học viên để phát hiện và ngăn chặn các hành vi tấn công ghi đè chỉ dẫn hệ thống (Prompt Injection / Jailbreak). Nếu phát hiện tin nhắn độc hại, luồng gọi API sẽ lập tức bị ngắt (short-circuit) để bảo mật.
2. **System Guardrails (Hành vi AI):** Sử dụng hệ thống Prompt mẫu YAML định hình rào chắn hành vi, ngăn chặn AI tự động tiết lộ thuật ngữ y khoa hoặc chẩn đoán của ca bệnh.
3. **Terminology Filter & Stream Sanitization (Đầu ra):** Bộ lọc đầu ra sử dụng các quy tắc Regex so khớp liên tục trên cửa sổ đệm (window size 70 ký tự) để thay thế thuật ngữ lâm sàng phức tạp thành cách gọi bình dân của bệnh nhân và ẩn hoàn toàn tên bệnh lý chẩn đoán thành "bệnh lý răng miệng" trước khi stream về client.

---

## Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ sử dụng | Vai trò |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite (JavaScript) | Xây dựng giao diện Single Page Application (SPA) |
| **Routing** | React Router v7 | Điều hướng trang và bảo vệ Private Routes |
| **Styling** | Vanilla CSS (HSL Custom Tokens) | Thiết lý giao diện chuyên nghiệp, glassmorphism, micro-animations |
| **Backend** | FastAPI (Python 3.10+) | Lớp RESTful API bất đồng bộ (Async API Server) |
| **ORM** | SQLAlchemy 2.0 + Alembic | Quản lý cơ sở dữ liệu bất đồng bộ & Di cư dữ liệu |
| **Database** | SQLite (Local Dev) / PostgreSQL (Prod) | Hệ thống lưu trữ thông tin học viên, ca bệnh và phiên chat |
| **AI LLM** | Groq Cloud API (llama-3.3-70b-versatile) | Lõi xử lý suy luận AI hội thoại |
| **Security** | PyJWT + bcrypt | Đăng ký, đăng nhập và bảo mật phiên |
| **Testing** | PyTest + HTTPX AsyncClient | Bộ kiểm thử tích hợp tự động |

---

## Hướng dẫn cài đặt và Khởi chạy cục bộ

### Yêu cầu hệ thống
* Python 3.10 trở lên
* Node.js 18 trở lên và npm

### 1. Cài đặt và Chạy Backend API

**Bước 1: Di chuyển vào thư mục backend và tạo môi trường ảo Python**
```cmd
cd backend
python -m venv venv
```

**Bước 2: Kích hoạt môi trường ảo**
* **Trên Windows (Command Prompt):**
  ```cmd
  venv\Scripts\activate
  ```
* **Trên Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
* **Trên Mac/Linux:**
  ```bash
  source venv/bin/activate
  ```

**Bước 3: Cài đặt các thư viện phụ thuộc**
```cmd
pip install -r requirements.txt
```

**Bước 4: Tạo cấu hình môi trường `.env`**
Tạo file `backend/.env` (bản mẫu tại `backend/.env.example`) và điền các tham số:
```ini
GROQ_API_KEY=gsk_your_groq_api_key_here
DATABASE_URL=sqlite+aiosqlite:///./dentalsim.db
JWT_SECRET=super_secure_random_key_string_for_dentalsim
JWT_ALGORITHM=HS256
LLM_MODEL=llama-3.3-70b-versatile
```

**Bước 5: Khởi tạo dữ liệu và nạp 50 ca bệnh mẫu (Seeding)**
```cmd
set PYTHONIOENCODING=utf-8
python seeds/seed_cases.py
```

**Bước 6: Chạy di cư dữ liệu cơ sở dữ liệu (Database Migrations)**
```cmd
set PYTHONPATH=.
alembic upgrade head
```

**Bước 7: Khởi chạy API Server**
```cmd
python -m uvicorn app.main:app --port 8000 --reload
```
API Server sẽ chạy tại: `http://127.0.0.1:8000`. Tài liệu hướng dẫn tương tác trực quan nằm tại `http://127.0.0.1:8000/docs`.

---

### 2. Cài đặt và Chạy Frontend React

Mở một terminal mới:

**Bước 1: Di chuyển vào thư mục frontend và cài đặt npm packages**
```cmd
cd frontend
npm install
```

**Bước 2: Khởi chạy dự án ở chế độ phát triển (Dev Mode)**
```cmd
npm run dev
```
Giao diện người dùng sẽ chạy tại: `http://localhost:5173`.

---

### 3. Chạy kiểm thử tự động
Môi trường ảo backend cần được kích hoạt. Di chuyển vào thư mục `backend/` và chạy:
```cmd
set PYTHONPATH=.
set PYTHONIOENCODING=utf-8
pytest -v
```

---

## Hướng dẫn triển khai môi trường Production

Khi triển khai hệ thống lên môi trường thực tế (chẳng hạn như Docker, Hugging Face Spaces, Render,...), hãy lưu ý các điểm cấu hình dưới đây:

### 1. Biến môi trường quan trọng trong `.env`
* `DATABASE_URL`: Đường dẫn PostgreSQL chạy bất đồng bộ, ví dụ: `postgresql+asyncpg://user:password@host:port/dbname`. Backend đã được tối ưu cơ chế Connection Pooling (`pool_size=10`, `max_overflow=20`) cho các kết nối cơ sở dữ liệu PostgreSQL.
* `JWT_SECRET`: Thay đổi thành một chuỗi bảo mật ngẫu nhiên dài (có thể sinh nhanh bằng lệnh `openssl rand -hex 32`).
* `ALLOWED_ORIGINS`: Danh sách trắng các tên miền Frontend được phép gửi yêu cầu tới API (ví dụ: `["https://dentalsim.edu.vn"]`), cấu hình này bảo vệ API khỏi các truy cập trái phép.

### 2. Triển khai bằng Docker
Dự án cung cấp sẵn file `Dockerfile` ở thư mục gốc giúp đóng gói ứng dụng nhanh chóng lên các Cloud Spaces (như Hugging Face Spaces):
```dockerfile
# Xây dựng và chạy container trên port 7860
docker build -t dentalsim .
docker run -p 7860:7860 --env-file ./backend/.env dentalsim
```