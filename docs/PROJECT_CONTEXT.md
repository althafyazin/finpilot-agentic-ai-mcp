# Project Context: Money Management Platform

## 1. Project Overview
- **Project Name**: FinanceFlow (Money Management Application)
- **Purpose**: A production-grade personal finance application enabling users to track income/expenses, set budgets, view visual financial analytics, and manage recurring transactions with strict data privacy and security.

## 2. Tech Stack
- **Frontend**: React.js (Vite), Tailwind CSS, Lucide Icons, Axios, Recharts
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Testing & Tooling**: Postman, ESLint, Prettier

## 3. Architecture Blueprint (Modular Layered Architecture)
```
[ Client (React + Vite) ]
       │  (HTTP / REST API - JSON)
       ▼
[ Routes (Express) ]  ──> Middleware (Auth, Validation, Error Handler)
       │
       ▼
[ Controllers ]  ──> (HTTP Request parsing & HTTP Response formatting ONLY)
       │
       ▼
[ Services ]     ──> (Core Business Logic, Calculations, Rules)
       │
       ▼
[ Models ]       ──> (Mongoose Schemas & DB Queries)
       │
       ▼
[ MongoDB Database ]
```

## 4. Folder Structure Plan
```
money-management-app/
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API_DOCUMENTATION.md
│   ├── CODING_RULES.md
│   ├── FEATURE_LOG.md
│   └── TODO.md
├── server/
│   ├── src/
│   │   ├── config/          # DB connection, env verification
│   │   ├── controllers/     # Controller handlers
│   │   ├── middlewares/     # Auth, error handling, validation
│   │   ├── models/          # Mongoose data models
│   │   ├── routes/          # API route declarations
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Helper utilities (response formatters, logger)
│   │   └── app.js           # Express app setup
│   ├── .env.example
│   ├── package.json
│   └── server.js            # Entry point (HTTP server)
└── client/
    ├── src/
    │   ├── api/             # Axios instance & API requests
    │   ├── components/      # UI & Reusable components
    │   ├── context/         # React Context (AuthContext, ThemeContext)
    │   ├── hooks/           # Custom React hooks
    │   ├── pages/           # Page level components
    │   ├── utils/           # Formatting utilities (currency, dates)
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── tailwind.config.js
```

## 5. Feature Breakdown & Roadmap

### Core Application Foundations (Completed)
- [x] **Phase 1: Foundation & Setup** (Backend Express setup, DB connection, Global Error Handling)
- [x] **Phase 2: Authentication & User Management** (Register, Login, JWT Middleware, Profile)
- [x] **Phase 3: Category Management** (Default & Custom categories)
- [x] **Phase 4: Expense Management** (CRUD, filtering, sorting, pagination)
- [x] **Phase 5: Income Management** (CRUD, sources)
- [x] **Phase 6: Budgeting & Goals** (Monthly budgets, category limits)
- [x] **Phase 7: Analytics & Reporting** (Charts, summary statistics)
- [x] **Phase 8: Production Frontend** (Vite, Tailwind CSS, Recharts, protected routes)
- [x] **Phase 9: Enterprise Features** (Recurring transactions, CSV export, Health score)

### Agentic Personal Finance Intelligence Platform
- [x] **Phase 10 (AI Phase 1): Basic AI Assistant & Tool Foundation** (LangChain.js, 5 tools, AIChat panel)
- [x] **Phase 11 (AI Phase 2): Advanced Tool Calling & Simulation** (Period comparison, budget what-ifs)
- [ ] **Phase 12 (AI Phase 3): LangGraph Agent Orchestration** (State machines, multi-step planning)
- [ ] **Phase 13 (AI Phase 4): Genuine MCP Client/Server** (Model Context Protocol SDK integration)
- [ ] **Phase 14 (AI Phase 5): External Service Integrations** (Google Calendar, Google Drive)
- [ ] **Phase 15 (AI Phase 6): Human Approval & Controlled Write Actions** (Cryptographic HITL tokens)
- [ ] **Phase 16 (AI Phase 7): Comprehensive Security & Guardrails** (Prompt injection, IDOR defenses)
- [ ] **Phase 17 (AI Phase 8): Persistent Memory & Feedback Loop** (User preferences, rating system)
- [ ] **Phase 18 (AI Phase 9): Evaluation Suite & Observability** (Golden evals, accuracy benchmarking)
- [ ] **Phase 19 (AI Phase 10): Production Hardening & Deployment** (Dockerization, bundle optimization)

## 6. Coding Standards & Guidelines
- Follow thin controllers, fat services principle.
- Use async/await and central error handling middleware (no unhandled rejections).
- Validate all incoming API inputs.
- Keep codebase clean, modular, and fully documented.