# RepoMemory Impact — Frontend Platform

> **Pull Request Change Impact Analysis Platform**  
> Core product question: *"What might this pull request break?"*

---

## 1. Product Overview

**RepoMemory Impact** is a specialized engineering platform designed for JavaScript and TypeScript development teams, engineering managers, and AI coding agent workflows. Before merging a pull request, RepoMemory parses repository dependencies, identifies affected downstream modules, computes regression risk, and recommends targeted test commands using evidence-backed AST traces.

The platform provides:
- An interactive React Flow dependency graph highlighting changed, affected, and unaffected modules.
- Downstream ripple and transitive dependency tracking with confidence scores.
- Test suite recommendations with copyable terminal commands.
- Clear distinction between verified AST evidence and AI semantic explanations.
- Dual-mode architecture: works out-of-the-box in **Mock Mode** for standalone demonstration and switches seamlessly to **Live API Mode** when connected to your Node.js/Express backend.

---

## 2. Frontend Architecture

The codebase follows a modular React architecture with clear separation of concerns:

```text
repomemory-impact/
└── frontend/
    ├── public/
    │   └── favicon.svg                  # Brand favicon
    ├── src/
    │   ├── app/
    │   │   ├── App.jsx                  # Root application component with providers
    │   │   ├── router.jsx               # React Router config with lazy loading
    │   │   └── ProtectedRoute.jsx       # Route guard for authenticated areas
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── AppLayout.jsx        # Responsive shell layout
    │   │   │   ├── Sidebar.jsx          # Left navigation and environment mode badge
    │   │   │   ├── Topbar.jsx           # Top contextual bar with repo indicator
    │   │   │   └── MobileNavigation.jsx # Mobile navigation drawer
    │   │   ├── graph/
    │   │   │   ├── DependencyGraph.jsx  # Main React Flow graph with canvas controls
    │   │   │   ├── DependencyNode.jsx   # Custom node with status rings & handles
    │   │   │   ├── GraphControls.jsx    # Zoom, fit-view, filter, and search toolbar
    │   │   │   └── GraphLegend.jsx      # Collapsible status and relationship legend
    │   │   ├── analysis/
    │   │   │   ├── RiskBadge.jsx        # High / Medium / Low risk badge with pulse
    │   │   │   ├── ImpactSummary.jsx    # Overview metrics and uncertainty explanation
    │   │   │   ├── AffectedFilesList.jsx# Filterable downstream affected files
    │   │   │   ├── TestRecommendations.jsx # Copyable CLI commands with priorities
    │   │   │   ├── EvidencePanel.jsx    # AST code snippets & AI explanation traces
    │   │   │   └── AnalysisStatus.jsx   # Status indicator (Completed, Running, Queued)
    │   │   ├── dashboard/
    │   │   │   ├── RepositoryCard.jsx   # Connected repository preview card
    │   │   │   ├── PullRequestCard.jsx  # PR status card with quick analysis link
    │   │   │   └── ActivityList.jsx     # Analysis timeline feed
    │   │   ├── common/
    │   │   │   ├── Button.jsx           # Accessible button with variants & loading state
    │   │   │   ├── Modal.jsx            # Accessible dialog with ESC key listener
    │   │   │   ├── SearchInput.jsx      # Search input with clear button
    │   │   │   ├── EmptyState.jsx       # Empty view state with action CTA
    │   │   │   ├── ErrorState.jsx       # Error view with technical diagnostics & retry
    │   │   │   ├── LoadingState.jsx     # Engineering theme animated loading state
    │   │   │   └── ConfirmDialog.jsx    # Confirmation prompt for critical actions
    │   │   └── ui/                      # Shared design primitives
    │   ├── pages/
    │   │   ├── LandingPage.jsx          # Public product introduction & demo CTA
    │   │   ├── LoginPage.jsx            # Login with demo sign-in button
    │   │   ├── RegisterPage.jsx         # User registration
    │   │   ├── DashboardPage.jsx        # Metrics, Recharts velocity chart, active PRs
    │   │   ├── RepositoriesPage.jsx     # Connected repositories and connect modal
    │   │   ├── RepositoryDetailPage.jsx # Repository metadata, 4-pillar tabs, mind map
    │   │   ├── QAPage.jsx               # Code-grounded repository Q&A workspace
    │   │   ├── MemoryPage.jsx           # Project memory & Architectural Decision Records
    │   │   ├── PullRequestsPage.jsx     # PR impact queue and trigger analysis modal
    │   │   ├── AnalysisPage.jsx         # Flagship impact report and graph workspace
    │   │   ├── HistoryPage.jsx          # Analysis history with pagination and filters
    │   │   ├── SettingsPage.jsx         # Profile, API ping test, and theme controls
    │   │   └── NotFoundPage.jsx         # 404 handler
    │   ├── services/
    │   │   ├── apiClient.js             # Central Axios instance with interceptors
    │   │   ├── authService.js           # Auth operations (mock / live)
    │   │   ├── repositoryService.js     # Repository management (mock / live)
    │   │   ├── qaService.js             # Codebase Q&A queries (mock / live)
    │   │   ├── memoryService.js         # Architectural Decision Records (mock / live)
    │   │   ├── pullRequestService.js    # PR operations (mock / live)
    │   │   ├── analysisService.js       # Analysis and graph data (mock / live)
    │   │   └── historyService.js        # Historical runs and pagination (mock / live)
    │   ├── hooks/
    │   │   ├── useAuth.js               # Auth context hook
    │   │   ├── useRepositories.js       # Repository management hook
    │   │   └── useAnalysis.js           # Analysis workspace and node inspector hook
    │   ├── context/
    │   │   └── AuthContext.jsx          # Session state and authorization provider
    │   ├── mocks/
    │   │   ├── mockRepositories.js      # Sample JS/TS repositories
    │   │   ├── mockPullRequests.js      # Sample pull requests
    │   │   ├── mockAnalysis.js          # Deep AST impact graphs and test recommendations
    │   │   ├── mockQA.js                # Code-grounded Q&A citations and sample questions
    │   │   └── mockMemory.js            # Architectural Decision Records (ADRs)
    │   ├── utils/
    │   │   ├── formatters.js            # Date, relative time, and path formatters
    │   │   ├── riskUtils.js             # Risk, node status, and type helpers
    │   │   └── graphUtils.js            # React Flow layout transformation and filtering
    │   ├── config/
    │   │   └── env.js                   # Centralized environment configuration
    │   ├── styles/
    │   │   └── index.css                # Dark theme tokens and React Flow styles
    │   ├── main.jsx                     # Application bootstrap
    │   └── index.css                    # Tailwind entry stylesheet
    ├── .env.example                     # Environment template
    ├── .env                             # Active local environment variables
    ├── .gitignore                       # Git exclusions
    ├── index.html                       # HTML5 entry with Inter & JetBrains Mono fonts
    ├── package.json                     # Dependencies and build scripts
    ├── postcss.config.js                # PostCSS config
    ├── tailwind.config.js               # Tailwind custom palette & glow utilities
    ├── vite.config.js                   # Vite config with alias support
    └── README.md                        # Documentation
```

---

## 3. Technology Stack

- **Framework**: React 18 with Vite.
- **Routing**: React Router DOM (v6) with lazy-loaded code splitting.
- **Graph Visualization**: `@xyflow/react` (React Flow) for interactive node-edge dependency canvases.
- **Styling**: Tailwind CSS (custom dark engineering palette) with PostCSS and Autoprefixer.
- **Icons**: Lucide React.
- **Charts**: Recharts (velocity and risk trends).
- **HTTP Client**: Axios with centralized error normalization and request/response interceptors.
- **Typography**: Inter (sans-serif) and JetBrains Mono (monospace code font).

---

## 4. Prerequisites

- **Node.js**: `v18.0.0` or higher (verified on Node `v24.16.0`).
- **npm**: `v9.0.0` or higher (verified on npm `v11.13.0`).

---

## 5. Installation Commands (Windows PowerShell & Bash)

Navigate into the `frontend/` directory and install dependencies:

```powershell
cd "d:\REST\PROJECT FILES\RepoMemory\frontend"
npm install
```

---

## 6. Environment Setup

Create or review your local `.env` file (copied from `.env.example`):

```env
# Central Backend API Base URL
VITE_API_BASE_URL=http://localhost:5000/api/v1

# Enable Mock Mode (set to 'true' for standalone demo, 'false' for live backend)
VITE_USE_MOCKS=true
```

> **Security Note**: All `VITE_*` environment variables are compiled into the client-side JavaScript bundle. **Never store client secrets, private keys, or passwords in Vite environment files.**

---

## 7. Running the Development Server

Start the local development server:

```powershell
npm run dev
```

The application will be accessible at:
```text
http://localhost:5173
```

---

## 8. Production Build Command

To validate code correctness and build the production bundle:

```powershell
npm run build
```

The compiled assets will be output to `frontend/dist/`. To preview the production bundle locally:

```powershell
npm run preview
```

---

## 9. Mock Mode Instructions

When `VITE_USE_MOCKS=true`:
1. The application operates 100% locally with zero backend dependencies.
2. Realistic JavaScript/TypeScript repository scenarios are provided:
   - **`student-management-system`**: PR #142 *"Refactor student authentication and grade calculation logic"* (High Risk: alters `calculateFinalGrade` signature, affects 7 downstream files and 4 test suites).
   - **`commerce-api-gateway`**: PR #89 *"Migrate checkout payment intent to v2 Stripe webhook handler"* (High Risk).
   - **`analytics-event-pipeline`**: PR #54 *"Add payload schema validation for telemetry events"* (Medium Risk).
   - **`ui-component-library`**: PR #210 *"Update button token variables and focus ring a11y"* (Low Risk).
3. On the login screen, click **"Sign In as Demo Developer"** for instant access without credentials.
4. An amber **MOCK MODE** badge is visible in the sidebar to remind developers that simulated data is active.

---

## 10. Live Backend Integration Instructions

To connect to your Node.js/Express backend:

1. Update `.env` in `frontend/`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   VITE_USE_MOCKS=false
   ```
2. Restart the Vite dev server (`npm run dev`).
3. The sidebar badge will turn green (**LIVE API**).
4. The service layer will send real HTTP requests via `apiClient.js` to `http://localhost:5000/api/v1`.
5. If the backend is unreachable or returns an error, the UI displays an `ErrorState` with technical diagnostics and a retry button. It will **never** silently fall back to fake mock data on network errors.

---

## 11. API Endpoint Reference

All endpoints expect JSON payloads and return the standard response structure:

### Standard Response Formats

**Success Response (200 / 201)**:
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

**Error Response (400 / 401 / 404 / 500)**:
```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Endpoints Implemented in Frontend Service Layer

| Method | Endpoint | Service Function | Description |
|---|---|---|---|
| `POST` | `/auth/register` | `authService.register(userData)` | Create user account |
| `POST` | `/auth/login` | `authService.login(credentials)` | User authentication |
| `GET` | `/auth/me` | `authService.getCurrentUser()` | Get current authenticated user |
| `POST` | `/auth/logout` | `authService.logout()` | Invalidate session |
| `GET` | `/repositories` | `repositoryService.getRepositories()` | List all connected repositories |
| `GET` | `/repositories/:repositoryId` | `repositoryService.getRepositoryById(id)` | Get repository metadata & branch list |
| `POST` | `/repositories/connect` | `repositoryService.connectRepository(data)` | Connect GitHub repository reference |
| `DELETE`| `/repositories/:repositoryId` | `repositoryService.disconnectRepository(id)`| Disconnect repository |
| `GET` | `/repositories/:repositoryId/pull-requests` | `pullRequestService.getPullRequests(id)` | List pull requests for repository |
| `GET` | `/pull-requests/:pullRequestId` | `pullRequestService.getPullRequestById(id)` | Fetch pull request details |
| `GET` | `/pull-requests/:pullRequestId/analysis` | `pullRequestService.getPullRequestAnalysis(id)` | Check if analysis exists for PR |
| `POST` | `/pull-requests/:pullRequestId/analyze` | `analysisService.startAnalysis(id, body)` | Trigger fresh AST impact analysis |
| `GET` | `/analyses/:analysisId` | `analysisService.getAnalysisById(id)` | Get complete impact analysis report |
| `GET` | `/analyses/:analysisId/graph` | `analysisService.getAnalysisGraph(id)` | Get React Flow nodes and edges |
| `GET` | `/analyses/:analysisId/affected-files` | `analysisService.getAffectedFiles(id)` | Get downstream affected files |
| `GET` | `/analyses/:analysisId/test-recommendations`| `analysisService.getTestRecommendations(id)` | Get recommended test suites |
| `GET` | `/analyses` | `historyService.getAnalysisHistory(params)` | Paginated analysis history |
| `POST`| `/repositories/:repositoryId/qa` | `qaService.askQuestion(id, question)` | Code-grounded repository Q&A query |
| `GET` | `/repositories/:repositoryId/qa/suggested` | `qaService.getSuggestedQuestions(id)` | Get suggested quick Q&A prompts |
| `GET` | `/repositories/:repositoryId/qa/history` | `qaService.getQAHistory(id)` | Get past answered questions |
| `GET` | `/repositories/:repositoryId/memory` | `memoryService.getMemories(id, params)` | Get architectural decision records (ADRs) |
| `POST`| `/repositories/:repositoryId/memory` | `memoryService.createMemory(id, data)` | Record architectural decision |
| `PUT` | `/memory/:memoryId` | `memoryService.updateMemory(id, updates)` | Update architectural decision |
| `DELETE`| `/memory/:memoryId` | `memoryService.deleteMemory(id)` | Delete architectural decision record |

---

## 12. Authentication Assumptions

- The frontend supports both **Bearer Token** (`Authorization: Bearer <token>`) and **Cookie-based sessions** (`withCredentials: true` is configured in `apiClient.js`).
- If token authentication is used, the frontend stores the token in `localStorage` under `repomemory_auth_token` and automatically attaches it on every request via Axios request interceptors.
- On receiving a `401 Unauthorized` response, the client clears the token and broadcasts a custom event that redirects the user to `/login` while preserving their target location in route state.

---

## 13. Features Requiring Backend Implementation

To complete full end-to-end functionality when you implement your Node.js/Express server:

1. **GitHub Repository Ingestion**:
   - Webhook listener or GitHub API app integration to sync pull requests and commits.
2. **AST Code Dependency Parser**:
   - Static analysis parser (e.g. `@babel/parser`, `typescript`, or `tree-sitter`) that scans imports, exports, and call expressions across the repository to generate `{ nodes, edges }`.
3. **Change Diff Computation**:
   - Git diff comparison between `baseBranch` and `headBranch` to determine changed files, line numbers, and added/removed functions.
4. **Test Recommendation Engine**:
   - Mapping modified files and affected downstream modules to existing test suites (`.test.js`, `.spec.ts`) in the repository.
5. **Database Storage**:
   - MongoDB or PostgreSQL schemas storing users, repositories, pull requests, analyses, and evidence records.

---

## 14. Troubleshooting

- **White screen on load**: Verify that dependencies were installed (`npm install`) and that the browser console does not report browser extension blocks.
- **Connection Refused in Live Mode**: Check that your backend server is running on `http://localhost:5000` or adjust `VITE_API_BASE_URL` in `.env`.
- **Resetting Demo Data**: Go to `/settings` and click **"Reset Local Demo Data"** to clear cached mock edits.
