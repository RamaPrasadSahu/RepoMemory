# RepoMemory 🧠⚡

> **Pull Request Change Impact & Architectural Memory Platform**  
> *"What might this pull request break, and why was it built this way?"*

RepoMemory is an engineering intelligence platform designed for software teams and AI coding agents. Before merging a pull request, RepoMemory parses repository Abstract Syntax Trees (ASTs), traces transitive dependency graphs, identifies downstream breaking changes, predicts regression risk, and records Architectural Decision Records (ADRs).

---

## 🚀 Key Features

- **AST Dependency Graph & Ripple Propagation**: Static Babel AST analysis tracing ES imports, CommonJS calls, and Express routes with reverse-dependency BFS.
- **Visual Impact Analysis**: Interactive React Flow canvas highlighting changed, affected, and unaffected modules with confidence metrics.
- **Smart Test Recommendation**: Prioritized, copyable unit, integration, and E2E test commands targeted to affected files.
- **Architectural Memory (ADRs)**: Version-controlled architectural decision records with Broken Object-Level Authorization (BOLA) protections.
- **Codebase Q&A Engine**: Code-grounded question answering with verified line citations and AST call traces.
- **Enterprise-Grade Security**:
  - JWT Bearer authentication with 15-minute token expiry and cryptographic refresh token rotation.
  - Strict Role-Based Access Control (RBAC) preventing privilege escalation.
  - NoSQL query injection sanitization (`express-mongo-sanitize`).
  - HTTP security headers with Helmet & CORS origin policy.
  - Rate limiting against brute-force and DoS attacks.
  - Reverse proxy trust configuration (`trust proxy`).

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB Atlas with Mongoose ODM (includes offline in-memory fallback)
- **AST Parsing**: `@babel/parser`, `@babel/traverse`
- **Security**: `jsonwebtoken`, `bcryptjs`, `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`

### Frontend
- **Framework**: React 18 with Vite
- **Graph Engine**: `@xyflow/react` (React Flow)
- **Styling**: Tailwind CSS & Lucide Icons
- **HTTP Client**: Axios with JWT interceptors & error normalization

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js** v18+ (Node 20+ recommended)
- **npm** or **yarn**

### 2. Installation

Clone the repository:
```bash
git clone https://github.com/RamaPrasadSahu/RepoMemory.git
cd RepoMemory
```

Install backend dependencies:
```bash
cd backend
npm install
```

Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### 3. Environment Setup

Create `.env` inside `backend/`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017
CORS_ORIGIN=http://localhost:5173

ACCESS_TOKEN_SECRET=your_jwt_access_secret_key_at_least_32_characters
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_key_at_least_32_characters
REFRESH_TOKEN_EXPIRY=10d
```

Create `.env` inside `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_USE_MOCKS=false
```

### 4. Running Locally

Start the backend:
```bash
cd backend
npm run dev
```

In a separate terminal, start the frontend:
```bash
cd frontend
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing

Run backend security verification suite:
```bash
cd backend
node test_security.js
```

Run full backend API integration tests:
```bash
cd backend
node test_api.js
```

Build frontend for production:
```bash
cd frontend
npm run build
```

---

## 📄 License

MIT License © 2026 RepoMemory Engineering Team
