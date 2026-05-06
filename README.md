# 🤖 Website Tuyển Dụng Thông Minh — Tích Hợp AI Phân Tích & Đánh Giá CV

> **Đồ án Khóa Luận Tốt Nghiệp — Nhóm GR65**
>
> Hệ thống tuyển dụng trực tuyến tích hợp trí tuệ nhân tạo chạy **offline** (Ollama + Qwen2) để tự động phân tích, trích xuất thông tin và chấm điểm CV ứng viên dựa trên mô tả công việc. Không cần kết nối API bên ngoài.

---

## 📑 Mục Lục

- [Tổng Quan](#-tổng-quan)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
- [Chạy Dự Án](#-chạy-dự-án)
- [Tài Khoản Mặc Định](#-tài-khoản-mặc-định)
- [API Endpoints](#-api-endpoints)
- [Cơ Sở Dữ Liệu](#-cơ-sở-dữ-liệu)
- [Tính Năng Chính](#-tính-năng-chính)
- [Tác Giả](#-tác-giả)

---

## 🎯 Tổng Quan

Hệ thống gồm **3 thành phần chính** hoạt động song song:

| Thành phần | Mô tả | Port |
|---|---|---|
| **Frontend** | Giao diện người dùng (React + Vite) | `5173` |
| **Backend** | API server xử lý nghiệp vụ (Node.js + Express) | `5000` |
| **AI Service** | Microservice AI phân tích CV (Python + FastAPI) | `8000` |

### Luồng xử lý CV bằng AI

```
Ứng viên upload CV
        │
        ▼
   Backend (Node.js)
   Lưu file + ghi DB
        │
        ▼
   AI Service (FastAPI)
   ├── Trích xuất text (PDF/DOCX/Image)
   ├── Gọi Ollama (Qwen2) phân tích offline
   ├── Sinh Embeddings + lưu FAISS
   └── Trả JSON kết quả
        │
        ▼
   Backend cập nhật DB
   (AIScore, AIExtractedJson)
        │
        ▼
   Frontend hiển thị kết quả
```

---

## 🏗 Kiến Trúc Hệ Thống

```
┌──────────────┐     HTTP      ┌──────────────┐     HTTP      ┌──────────────┐
│   Frontend   │ ◄──────────►  │   Backend    │ ◄──────────►  │  AI Service  │
│  React/Vite  │   :5173→5000  │  Express.js  │   :5000→8000  │   FastAPI    │
│  TailwindCSS │               │   JWT Auth   │               │Ollama(Qwen2) │
└──────────────┘               └──────┬───────┘               │ Tesseract+FAISS│
                                      │                       └──────────────┘
                                      │ mssql
                                      ▼
                               ┌──────────────┐
                               │  SQL Server  │
                               │ AIRecruitDB  │
                               └──────────────┘
```

---

## 🛠 Công Nghệ Sử Dụng

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| React | 18.3 | UI Library |
| Vite | 6.3 | Build tool & Dev server |
| TailwindCSS | 4.1 | Styling framework |
| React Router | 7.13 | Client-side routing |
| Radix UI | Latest | Accessible UI components |
| Recharts | 2.15 | Biểu đồ thống kê |
| Lucide React | Latest | Icon system |
| Motion (Framer) | 12.x | Animations |

### Backend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5.2 | Web framework |
| mssql | 12.2 | SQL Server driver |
| jsonwebtoken | 9.0 | JWT Authentication |
| bcryptjs | 3.0 | Mã hóa mật khẩu |
| multer | 2.1 | Upload file |
| nodemon | 3.1 | Hot reload (dev) |

### AI Service
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Python | 3.10+ | Runtime |
| FastAPI | Latest | Web framework |
| Ollama + Qwen2:1.5b | Latest | LLM chạy offline (phân tích CV) |
| Tesseract OCR | Latest | Nhận dạng chữ từ ảnh (OCR) |
| pdfplumber | Latest | Trích xuất text từ PDF |
| python-docx | Latest | Trích xuất text từ DOCX |
| Pillow + pytesseract | Latest | Xử lý ảnh + gọi Tesseract |
| faiss-cpu | Latest | Vector database (Embeddings) |
| sentence-transformers | Latest | Sinh vector embeddings |

### Database
| Công nghệ | Mục đích |
|---|---|
| SQL Server | RDBMS chính |
| FAISS (file-based) | Vector search cho CV |
| SQLite | Mapping metadata cho FAISS |

---

## 📁 Cấu Trúc Thư Mục

```
📦 Root
├── 📂 frontend/                    # Giao diện người dùng
│   ├── 📂 src/
│   │   ├── 📂 app/
│   │   │   ├── 📂 pages/
│   │   │   │   ├── 📄 LandingPage.jsx         # Trang chủ
│   │   │   │   ├── 📂 auth/
│   │   │   │   │   └── 📄 AuthPage.jsx        # Đăng nhập / Đăng ký
│   │   │   │   ├── 📂 candidate/              # Giao diện Ứng viên
│   │   │   │   │   ├── 📄 CandidateDashboard.jsx
│   │   │   │   │   ├── 📄 CandidateProfile.jsx
│   │   │   │   │   ├── 📄 CVManager.jsx
│   │   │   │   │   ├── 📄 JobSearch.jsx
│   │   │   │   │   └── 📄 CandidateApplications.jsx
│   │   │   │   ├── 📂 employer/               # Giao diện Nhà tuyển dụng
│   │   │   │   │   ├── 📄 EmployerDashboard.jsx
│   │   │   │   │   ├── 📄 EmployerProfile.jsx
│   │   │   │   │   ├── 📄 JobPostings.jsx
│   │   │   │   │   ├── 📄 CandidateList.jsx
│   │   │   │   │   ├── 📄 Pipeline.jsx
│   │   │   │   │   └── 📄 Interviews.jsx
│   │   │   │   └── 📂 admin/                  # Giao diện Quản trị viên
│   │   │   │       ├── 📄 AdminDashboard.jsx
│   │   │   │       ├── 📄 AdminProfile.jsx
│   │   │   │       ├── 📄 AccountManagement.jsx
│   │   │   │       ├── 📄 ContentModeration.jsx
│   │   │   │       └── 📄 AIStats.jsx
│   │   │   └── ...
│   │   └── 📂 styles/
│   └── 📄 package.json
│
├── 📂 backend/                     # API Server
│   ├── 📄 server.js                # Entry point
│   ├── 📄 db.js                    # Kết nối SQL Server
│   ├── 📄 initDb.js                # Khởi tạo & seed Admin
│   ├── 📄 .env                     # Biến môi trường (không push Git)
│   ├── 📄 AIRecruiDB.sql           # Script tạo database
│   ├── 📂 routes/
│   │   ├── 📄 auth.js              # Đăng nhập, đăng ký, Google OAuth
│   │   ├── 📄 profile.js           # Quản lý hồ sơ cá nhân
│   │   ├── 📄 jobs.js              # CRUD tin tuyển dụng
│   │   ├── 📄 cv.js                # Upload, phân tích CV bằng AI
│   │   └── 📄 applications.js      # Ứng tuyển & Pipeline quản lý
│   ├── 📂 middleware/
│   │   └── 📄 auth.js              # JWT Authentication middleware
│   └── 📂 uploads/                 # Thư mục lưu file CV
│
├── 📂 ai_service/                  # Microservice AI (Python)
│   ├── 📄 main.py                  # FastAPI entry point
│   ├── 📂 core/
│   │   ├── 📄 parser.py            # Trích xuất text & gọi Ollama AI
│   │   └── 📄 faiss_manager.py     # Quản lý FAISS vector database
│   ├── 📄 requirements.txt         # Python dependencies
│   └── 📂 venv/                    # Python virtual env (không push Git)
│
├── 📄 .gitignore
└── 📄 README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống

- **Node.js** >= 18.x
- **Python** >= 3.10
- **SQL Server** (LocalDB hoặc Express Edition)
- **Ollama** — [Tải tại đây](https://ollama.com/download) (chạy AI offline)
- **Tesseract OCR** — [Tải tại đây](https://github.com/UB-Mannheim/tesseract/wiki) (nhận dạng chữ từ ảnh)
- **Git**

### Bước 1: Clone dự án

```bash
git clone https://github.com/KLTN-03-2026/GR65.git
cd GR65
```

### Bước 2: Tạo Database

Mở **SQL Server Management Studio (SSMS)** và chạy file SQL:

```sql
-- Mở file backend/AIRecruiDB.sql và thực thi toàn bộ
```

### Bước 3: Cấu hình Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:

```env
DB_USER=sa
DB_PASS=your_sql_password
DB_NAME=AIRecruitDB
DB_SERVER=localhost
JWT_SECRET=your_super_secret_jwt_key_here
```

### Bước 4: Cài đặt Frontend

```bash
cd frontend
npm install
```

### Bước 5: Cài đặt Ollama (AI Offline)

```bash
# 1. Tải và cài đặt Ollama từ https://ollama.com/download
# 2. Tải model Qwen2:1.5b (chỉ cần chạy 1 lần)
ollama pull qwen2:1.5b
```

> **Lưu ý:** Ollama chạy như một service nền trên máy tính (port `11434`). Sau khi cài, nó sẽ tự khởi động cùng hệ thống.

### Bước 6: Cài đặt Tesseract OCR

1. Tải Tesseract từ [UB-Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
2. Cài đặt vào thư mục (ví dụ: `F:\OCR\tesseract.exe`)
3. Kiểm tra đường dẫn trong `ai_service/core/parser.py` (dòng `pytesseract.pytesseract.tesseract_cmd`)

### Bước 7: Cài đặt AI Service

```bash
cd ai_service

# Tạo môi trường ảo Python
python -m venv venv

# Kích hoạt môi trường ảo
# Windows PowerShell:
.\venv\Scripts\Activate
# Linux/macOS:
# source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt
```

---

## ▶ Chạy Dự Án

> **Yêu cầu:** Đảm bảo **Ollama** đang chạy nền (mặc định tự khởi động sau khi cài). Kiểm tra bằng: `ollama list`

Mở **3 Terminal** riêng biệt và chạy đồng thời:

### Terminal 1 — Backend (Node.js)
```bash
cd backend
npm run dev
```
> 🟢 Server chạy tại: `http://localhost:5000`

### Terminal 2 — Frontend (React)
```bash
cd frontend
npm run dev
```
> 🟢 Giao diện tại: `http://localhost:5173`

### Terminal 3 — AI Service (Python)
```bash
cd ai_service
.\venv\Scripts\Activate      # Kích hoạt venv (Windows)
uvicorn main:app --reload --port 8000
```
> 🟢 AI API tại: `http://localhost:8000`

### ⚡ Kiểm tra nhanh

| Service | URL | Kỳ vọng |
|---|---|---|
| Frontend | http://localhost:5173 | Trang Landing Page |
| Backend | http://localhost:5000 | `AI Recruitment API is running` |
| AI Service | http://localhost:8000 | `{"status":"ok","message":"AI Service FastAPI is up and running!"}` |

---

## 👤 Tài Khoản Mặc Định

Hệ thống tự tạo tài khoản Admin khi khởi chạy lần đầu:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@demo.vn` | `Admin@123` |

> Ứng viên (Candidate) và Nhà tuyển dụng (Employer) đăng ký tài khoản mới qua trang Đăng ký.

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký tài khoản |
| `POST` | `/api/auth/login` | Đăng nhập (trả JWT token) |
| `POST` | `/api/auth/google` | Đăng nhập bằng Google |

### Profile (`/api/profile`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/profile` | Lấy thông tin hồ sơ |
| `PUT` | `/api/profile` | Cập nhật hồ sơ |

### Jobs (`/api/jobs`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/jobs` | Danh sách tin tuyển dụng |
| `POST` | `/api/jobs` | Tạo tin mới (Employer) |
| `PUT` | `/api/jobs/:id` | Sửa tin |
| `DELETE` | `/api/jobs/:id` | Xóa tin |

### CV Management (`/api/cv`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/cv` | Danh sách CV của ứng viên |
| `POST` | `/api/cv/upload` | Upload CV → AI phân tích tự động |
| `POST` | `/api/cv/:id/reparse` | Phân tích lại CV bằng AI |
| `PUT` | `/api/cv/:id/default` | Đặt CV mặc định |
| `GET` | `/api/cv/:id/ai-result` | Lấy kết quả AI (polling) |
| `GET` | `/api/cv/:id/download` | Tải CV |
| `DELETE` | `/api/cv/:id` | Xóa CV |

### Applications (`/api/applications`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/applications` | Nộp đơn ứng tuyển |
| `GET` | `/api/applications` | Danh sách đơn ứng tuyển |
| `PUT` | `/api/applications/:id/stage` | Chuyển giai đoạn Pipeline |

### AI Service (`http://localhost:8000`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/ai/parse-cv` | Phân tích CV (nhận file path, trả JSON) |
| `POST` | `/api/ai/match-jd` | So khớp CV với Job Description (Cosine Similarity) |

---

## 🗄 Cơ Sở Dữ Liệu

### Sơ đồ ERD

```text
┌─────────┐       ┌────────────┐       ┌──────────┐
│  Users  │──1:1──│ Candidates │──1:N──│   CVs    │
│         │       │            │       └──────────┘
│         │       │            │──N:1──┌──────────────┐
│         │       └────────────┘       │ Applications │
│         │                            └──────┬───────┘
│         │       ┌────────────┐              │
│         │──1:1──│ Employers  │──1:N──┌──────┴──┐
└─────────┘       └────────────┘       │  Jobs   │
                                       └─────────┘
```

### Các bảng chính (Nhóm Cốt lõi)

| Bảng | Mô tả |
|---|---|
| `Users` | Tài khoản (Admin / Candidate / Employer) |
| `Candidates` | Thông tin ứng viên (kỹ năng, kinh nghiệm, AI Score) |
| `Employers` | Thông tin nhà tuyển dụng (công ty, ngành nghề) |
| `Jobs` | Tin tuyển dụng (yêu cầu, mức lương, kỹ năng, trạng thái duyệt) |
| `CVs` | Hồ sơ CV (file, trạng thái duyệt, AI Score, JSON trích xuất) |
| `Applications` | Đơn ứng tuyển & Pipeline (pending → reviewing → interview → offer) |

> **Lưu ý:** Ngoài các bảng cốt lõi trên, hệ thống còn sử dụng các bảng phụ chạy ngầm (`ActivityLog`, `AIPerformanceLogs`) để ghi nhận lịch sử thao tác và đo lường hiệu năng của AI, phục vụ riêng cho trang Thống kê của Quản trị viên.

---

## ✨ Tính Năng Chính

### 🧑‍💼 Ứng Viên (Candidate)
- 📋 Dashboard tổng quan trạng thái ứng tuyển
- 📄 Upload & quản lý nhiều CV (PDF, DOCX, Image)
- 🤖 AI tự động phân tích CV (trích xuất kỹ năng, kinh nghiệm, chấm điểm)
- 🔍 Tìm kiếm và lọc việc làm
- 📝 Nộp đơn ứng tuyển trực tuyến
- 👤 Quản lý hồ sơ cá nhân

### 🏢 Nhà Tuyển Dụng (Employer)
- 📊 Dashboard thống kê tuyển dụng
- 📝 Đăng và quản lý tin tuyển dụng
- 👥 Xem danh sách ứng viên & AI Match Score
- 🔄 Pipeline tuyển dụng (Kanban: Pending → Reviewing → Interview → Offer)
- 📅 Quản lý lịch phỏng vấn
- 🏢 Quản lý hồ sơ công ty

### 🔑 Quản Trị Viên (Admin)
- 📊 Dashboard tổng quan hệ thống
- 👥 Quản lý tài khoản người dùng
- 📋 Kiểm duyệt nội dung (tin tuyển dụng, hồ sơ)
- 📈 Thống kê AI (số lượng CV đã phân tích, điểm trung bình)

### 🤖 AI Features (100% Offline)
- Trích xuất text từ PDF, DOCX bằng thư viện Python
- Nhận dạng chữ từ ảnh CV bằng Tesseract OCR
- Phân tích CV bằng Ollama Qwen2 offline (skills, experience, education, languages)
- Chấm điểm CV tự động (AI Score 0-100)
- Sinh vector embeddings (sentence-transformers) và lưu trữ bằng FAISS
- So khớp CV - Job Description bằng Cosine Similarity (AI Match Score)
- **Không cần kết nối Internet, không cần API key bên ngoài**

---

## ⚠️ Lưu Ý

- **Ollama** phải đang chạy nền trước khi khởi động AI Service. Nếu gặp lỗi kết nối, kiểm tra bằng `ollama list` hoặc restart Ollama.
- **Tesseract OCR** cần cài đặt riêng và cấu hình đúng đường dẫn trong `parser.py`.
- **File `.env`** chứa thông tin nhạy cảm (DB password) — **KHÔNG push lên Git**.
- Sau khi tắt máy và khởi động lại, cần **kích hoạt lại venv** trước khi chạy AI Service.
- Model Qwen2:1.5b nhẹ (~1GB RAM) phù hợp chạy trên máy tính cá nhân.

---

## 👨‍💻 Tác Giả

**Nhóm GR65** — Khóa Luận Tốt Nghiệp 03/2026

📧 GitHub: [KLTN-03-2026/GR65](https://github.com/KLTN-03-2026/GR65)

---

> *Được phát triển với ❤️ sử dụng React, Node.js, Python FastAPI và Ollama AI (Offline)*
