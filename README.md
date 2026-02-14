# PRD Generator

AI-Powered Product Requirements Document Generator using the ISTVON Framework.

**Live Demo**: [https://prd-generator-x8kd.onrender.com/login](https://prd-generator-x8kd.onrender.com/login)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (CRA) + Tailwind CSS + Lucide Icons |
| Backend | Express 4 + Node.js |
| Database | Supabase PostgreSQL (7 tables) |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| AI | OpenAI (GPT-4o-mini) or Anthropic Claude (Claude 3 Haiku) |
| Export | jsPDF, docx, xlsx-js-style |
| Deployment | Render / Docker + Nginx / AWS EC2 |

## Features

### 4-Step PRD Wizard

A guided workflow organized into four steps, each covering a key area of the PRD:

**Step 1 - App Concept & Scope**: App idea, problem statement, goals, target audience, user personas, user journeys, feature prioritization (MoSCoW), and success metrics.

**Step 2 - Platform & Tech Stack**: Platform selection, tech stack configuration, navigation architecture, tech justifications, database schema, security & compliance, performance planning, and competitive positioning.

**Step 3 - Visual Style Guide**: Color palette, typography scale, component specifications, dashboard layouts, UX guidelines, and responsive design breakpoints.

**Step 4 - Generate PRD & Deployment**: Full PRD generation, development phases, testing strategy, deployment planning, budget & resource allocation, smart validation, and review checklist.

### 37+ AI-Powered Methods

#### Enhancement Methods
- Problem Statement & Goals enhancement
- Out-of-Scope suggestions
- Chart & Image Guidelines
- API & MCP recommendations
- Competitor Discovery & Pain Point analysis
- Full PRD Generation (comprehensive, maxTokens=8000)
- Proposal Cover Letters

#### Auto-Generation Methods (19 Endpoints)
- User Personas, Stories, and Journeys
- MVP Features (MoSCoW prioritization)
- Success Metrics & KPIs
- Navigation Architecture
- Tech Justifications & Database Schema
- Security Plans & Performance Plans
- Competitive Analysis
- Typography Scale & Component Specs
- Dashboard Layouts & UX Guidelines
- Responsive Design Breakpoints
- Development Phases & Testing Strategy
- Deployment Plans & Budget Plans

#### Smart Validation (4 Endpoints)
- Tech Stack validation
- Timeline validation
- Budget validation
- Dependency validation

All four run in parallel via the "Validate PRD" button in Step 4.

### Authentication & Authorization
- Email/password signup and login via Supabase Auth
- Google OAuth integration
- JWT-based backend verification
- Protected routes for authenticated users
- Optional — app works without auth configured

### Real-Time Collaboration
- **Project Dashboard**: Create, open, and manage multiple PRD projects
- **Collaborators**: Invite team members and assign roles
- **Field-Level Comments**: Threaded discussions on specific fields with real-time updates
- **Version History**: Snapshot and rollback to previous versions
- **Approval Workflow**: Per-step approval tracking
- **Activity Log**: Track all project changes

### Auto-Save
- Debounced auto-save (5-second interval) to Supabase PostgreSQL
- All form data stored as JSONB in the `projects` table
- Graceful degradation to in-memory when Supabase is unconfigured

### Excel Template Download & Upload
- **Download Template**: Styled Excel template with all PRD fields organized by step
  - Color-coded sections (Blue/Green/Purple/Orange-Red per step)
  - Bold column headers with help text and valid options
- **Upload & Auto-Populate**: Upload a filled `.xlsx` file to auto-populate all form fields
  - Partial fills supported — only filled fields are applied
  - Preview dialog before applying
  - Deep merge for nested fields (app structure, tech stack, competitors, milestones)

### File Handling
- Base64 file storage with image preview thumbnails
- Support for ZIP, documents, and multiple file uploads
- Google Drive and OneDrive link sync with AI content extraction
- Claude Cowork: local file system scanning with multi-source AI analysis
- Backend PDF and DOCX parsing (pdf-parse, mammoth)

### Export Functionality
- **PDF Export**: Formatted with headers, colors, and branding via jsPDF
- **DOCX Export**: Microsoft Word format with proper styling via docx library
- **JSON Export**: Structured data for programmatic access
- **Markdown Export**: Clean markdown output

All export formats include the full PRD content across all 19 sections.

### Email Integration
- Send PRD to team via mailto: links
- Opens default email client with PRD content
- Supports multiple recipients

### PRD Review Checklist
- 25-item checklist (15 original + 10 extended)
- Auto-checked based on completed formData fields
- Section-by-section review tracking

### WCAG Color Accessibility
- Contrast ratio calculations for color palette choices
- Accessibility validation built into the style guide step

## Architecture

### Routing
```
/login             → LoginPage (public)
/app               → ProjectDashboard (protected)
/app/project/:id   → PRDGenerator (protected, loads project from Supabase)
/                  → Redirect to /app
```

### Request Flow (AI Features)
```
PRDGenerator.jsx → useAI hook → aiService.js → fetch POST /api/ai/{endpoint}
  → Express route (backend/routes/ai.js → controllers/)
  → callAI() (aiCaller.js) → AI API → response back up the chain
```

### Database Schema (Supabase PostgreSQL)

| Table | Purpose |
|-------|---------|
| user_profiles | User profile data |
| projects | Project definitions with JSONB form_data |
| project_collaborators | Collaboration access control |
| project_versions | Version snapshots for rollback |
| comments | Field-level threaded comments |
| approvals | Step-by-step approval tracking |
| activity_log | Project activity history |

## Installation

### Prerequisites
- Node.js 18+
- npm
- OpenAI or Anthropic API key
- (Optional) Supabase project for database, auth, and collaboration features

### Local Development (two terminals)

```bash
# Backend (Express, port 5000)
cd backend && npm install && npm run dev

# Frontend (React CRA, port 3000)
cd frontend && npm install && npm start
```

### Production (Docker)

```bash
docker compose up -d          # Start all services
docker compose logs -f        # Tail logs
docker compose down           # Stop
```

### First-Time SSL Setup (EC2)

```bash
# Edit DOMAIN and EMAIL in init-letsencrypt.sh first
sudo bash init-letsencrypt.sh
docker compose up -d
```

### Render Deployment

Single web service via `render.yaml`:
- Build: `cd frontend && npm install --include=dev && npm run build && cd ../backend && npm install`
- Start: `cd backend && node server.js`
- Health check: `/api/health`

## Configuration

### Backend (`backend/.env`)

```env
AI_PROVIDER=openai          # or 'claude'
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
PORT=5000
AWS_REGION=us-east-1        # for CloudWatch logging in production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Frontend (`frontend/.env.local`)

```env
REACT_APP_API_URL=http://localhost:5000/api/ai
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
```

Supabase environment variables are optional. Without them, the app gracefully degrades to in-memory storage with no auth.

## Project Structure

```
PRD-Generator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginPage.jsx          # Login/signup with email + Google OAuth
│   │   │   │   └── ProtectedRoute.jsx     # Route guard for authenticated users
│   │   │   ├── sections/                  # 19 extracted section components
│   │   │   │   ├── UserPersonasSection.jsx
│   │   │   │   ├── UserJourneySection.jsx
│   │   │   │   ├── FeaturePrioritySection.jsx
│   │   │   │   ├── SuccessMetricsSection.jsx
│   │   │   │   ├── NavigationArchSection.jsx
│   │   │   │   ├── TechJustificationsSection.jsx
│   │   │   │   ├── DatabaseArchSection.jsx
│   │   │   │   ├── SecurityComplianceSection.jsx
│   │   │   │   ├── PerformanceSection.jsx
│   │   │   │   ├── CompetitivePositionSection.jsx
│   │   │   │   ├── TypeScaleSection.jsx
│   │   │   │   ├── ComponentSpecsSection.jsx
│   │   │   │   ├── DashboardLayoutSection.jsx
│   │   │   │   ├── UXGuidelinesSection.jsx
│   │   │   │   ├── ResponsiveDesignSection.jsx
│   │   │   │   ├── DevPhasesSection.jsx
│   │   │   │   ├── TestingStrategySection.jsx
│   │   │   │   ├── DeploymentSection.jsx
│   │   │   │   └── BudgetResourceSection.jsx
│   │   │   ├── PRDGenerator.jsx           # Main 4-step wizard (~3700 lines)
│   │   │   ├── ProjectDashboard.jsx       # Project list and management
│   │   │   ├── CommentSidebar.jsx         # Field-level threaded comments
│   │   │   ├── VersionHistory.jsx         # Version snapshots and rollback
│   │   │   ├── CollaboratorDialog.jsx     # Share/invite collaborators
│   │   │   └── ApprovalPanel.jsx          # Per-step approval workflow
│   │   ├── hooks/
│   │   │   ├── useAI.js                   # AI state + 37+ methods
│   │   │   ├── useAuth.js                 # AuthProvider + AuthContext
│   │   │   ├── useFormData.js             # Form state mutations
│   │   │   └── useAutoSave.js             # Debounced auto-save (5s)
│   │   ├── services/
│   │   │   ├── aiService.js               # HTTP client for backend AI calls
│   │   │   ├── projectService.js          # Supabase CRUD for projects
│   │   │   └── commentService.js          # Supabase CRUD for comments
│   │   ├── utils/
│   │   │   ├── exportUtils.js             # PDF/DOCX/JSON/Markdown exports
│   │   │   ├── excelUtils.js              # Excel template & parsing
│   │   │   ├── emailUtils.js              # Email/mailto functionality
│   │   │   ├── colorUtils.js              # WCAG contrast calculations
│   │   │   └── fileUtils.js               # File handling utilities
│   │   ├── lib/
│   │   │   └── supabase.js                # Supabase client init
│   │   ├── constants/
│   │   │   └── index.js                   # Steps, options, templates (~560 lines)
│   │   ├── App.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   └── package.json
├── backend/
│   ├── routes/
│   │   ├── controllers/
│   │   │   ├── autopopulation.js          # 19 AI generation endpoints
│   │   │   └── validation.js              # 4 smart validation endpoints
│   │   ├── services/
│   │   │   ├── aiCaller.js                # OpenAI/Claude API integration
│   │   │   └── responseParser.js          # JSON parsing with regex fallback
│   │   ├── ai.js                          # Main AI router (16+ endpoints)
│   │   └── projects.js                    # Project CRUD & activity log
│   ├── middleware/
│   │   └── auth.js                        # JWT verification via Supabase
│   ├── lib/
│   │   └── supabase.js                    # Backend Supabase client
│   ├── server.js                          # Express setup, CORS, health check
│   └── package.json
├── docker-compose.yml                     # 3 services: backend, frontend, certbot
├── render.yaml                            # Render.com deployment config
├── .env.production                        # Production environment template
├── CLAUDE.md                              # Claude Code project guidance
└── README.md
```

## Dependencies

### Frontend
| Package | Purpose |
|---------|---------|
| react 18 | UI framework |
| react-router-dom 7 | Client-side routing |
| @supabase/supabase-js | Database, auth, real-time |
| lucide-react | Icon library |
| jspdf | PDF generation |
| docx | Microsoft Word document generation |
| xlsx-js-style | Excel template generation with styling |
| tailwindcss | Utility-first CSS framework |

### Backend
| Package | Purpose |
|---------|---------|
| express 4 | HTTP server |
| cors | Cross-origin support |
| @supabase/supabase-js | Database client (service role) |
| jsonwebtoken | JWT verification |
| mammoth | DOCX document parsing |
| pdf-parse | PDF document parsing |
| dotenv | Environment variable loading |

## API Endpoints

### AI Endpoints (`/api/ai/`)

| Endpoint | Description |
|----------|-------------|
| POST `/status` | Check backend status and AI provider |
| POST `/enhance-problem-statement` | AI-enhance problem statement |
| POST `/enhance-goal` | AI-enhance goals |
| POST `/suggest-out-of-scope` | Suggest out-of-scope items |
| POST `/recommend-apis` | Recommend APIs and integrations |
| POST `/discover-competitors` | Discover competitors |
| POST `/discover-competitor-painpoints` | Analyze competitor pain points |
| POST `/suggest-chart-guidelines` | Chart visualization guidelines |
| POST `/suggest-image-guidelines` | Image usage guidelines |
| POST `/generate-prd` | Generate full PRD (maxTokens=8000) |
| POST `/generate-proposal` | Generate proposal cover letter |
| POST `/generate-user-personas` | Generate user personas |
| POST `/generate-user-journey` | Generate user journey maps |
| POST `/generate-success-metrics` | Generate KPIs and metrics |
| POST `/generate-nav-architecture` | Generate navigation structure |
| POST `/generate-tech-justifications` | Generate tech choice rationale |
| POST `/generate-database-schema` | Generate database schema |
| POST `/generate-security-plan` | Generate security & compliance plan |
| POST `/generate-performance-plan` | Generate performance plan |
| POST `/generate-competitive-analysis` | Generate competitive analysis |
| POST `/generate-type-scale` | Generate typography scale |
| POST `/generate-component-specs` | Generate UI component specs |
| POST `/generate-dashboard-layout` | Generate dashboard layout |
| POST `/generate-ux-guidelines` | Generate UX guidelines |
| POST `/generate-responsive-design` | Generate responsive breakpoints |
| POST `/generate-dev-phases` | Generate development phases |
| POST `/generate-testing-strategy` | Generate testing strategy |
| POST `/generate-deployment-plan` | Generate deployment plan |
| POST `/generate-budget-plan` | Generate budget & resource plan |
| POST `/validate-tech-stack` | Validate technology choices |
| POST `/validate-timeline` | Validate project timeline |
| POST `/validate-budget` | Validate budget estimates |
| POST `/validate-dependencies` | Validate dependency graph |

### Project Endpoints (`/api/projects/`) — requires auth
- Project CRUD operations
- Activity logging

### Health Check
- GET `/api/health` — backend health status

## Docker Deployment

Three services in `docker-compose.yml`:
- **backend**: Express server, health-checked, 512MB memory limit
- **frontend**: Nginx (ports 80 + 443), serves React SPA, proxies `/api/` to backend
- **certbot**: Auto-renews Let's Encrypt SSL certificates every 12 hours

Nginx config: HTTP-to-HTTPS redirect, TLS 1.2/1.3, HSTS, gzip compression, 120s proxy timeout for AI calls, SPA fallback routing.

## Tests

```bash
cd frontend && npm test       # React tests (Jest via react-scripts)
```

No backend test suite exists.

## License

Powered by ISTVON PRD Prompt Framework | BuLLMake PRD Generator
