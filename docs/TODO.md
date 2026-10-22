# FinanceFlow — Complete Project Roadmap & Development Master Plan

This document serves as the single source of truth for the ongoing engineering, architecture, and deployment of **FinanceFlow** — from its core full-stack foundations to its transformation into an **Agentic Personal Finance Intelligence Platform**.

---

## Roadmap Overview & Progress Dashboard

| Phase | Milestone | Status | Key Focus |
| :--- | :--- | :---: | :--- |
| **Phase 1** | Core Express Server Setup | **Completed** | Modular architecture, error handling, health checks |
| **Phase 2** | User Authentication & JWT Security | **Completed** | Bcrypt hashing, JWT tokens, auth middleware |
| **Phase 3** | Categories & Foundations | **Completed** | System default categories, custom user categories |
| **Phase 4** | Expense Management Module | **Completed** | CRUD, pagination, filtering, summary aggregation |
| **Phase 5** | Income Management Module | **Completed** | CRUD, income sources, date range filtering |
| **Phase 6** | Budgeting System & Alerts | **Completed** | Monthly targets, real-time spent tracking |
| **Phase 7** | Analytics & Dashboard Aggregation | **Completed** | Multi-model aggregation, monthly trends |
| **Phase 8** | Production React Frontend | **Completed** | Vite, Tailwind CSS, Recharts, protected routing |
| **Phase 9** | Enterprise Features & Insights | **Completed** | RFC 4180 CSV export, rule-based health score |
| **Phase 10** | **AI Phase 1: Basic AI Assistant & Tool Foundation** | **Completed** | LangChain.js, 5 core tools, AIChat panel, tests |
| **Phase 11** | **AI Phase 2: Advanced Tool Calling & Simulation** | **Completed** | Period comparisons, budget simulations, sanitized logging, tests |
| **Phase 12** | **AI Phase 3: LangGraph Agent Orchestration** | **Not Started** | State machines, cyclical execution, multi-step analysis |
| **Phase 13** | **AI Phase 4: Genuine MCP Client/Server** | **Not Started** | Model Context Protocol SDK, protocol transport, tool discovery |
| **Phase 14** | **AI Phase 5: External Service Integrations** | **Not Started** | Google Calendar reminders, Google Drive reports, OAuth |
| **Phase 15** | **AI Phase 6: Human Approval & Controlled Write Actions**| **Not Started** | Cryptographic approval tokens, audit trails, budget updates |
| **Phase 16** | **AI Phase 7: Security, Guardrails & Threat Defense** | **Not Started** | Prompt injection defense, IDOR guards, rate limiting |
| **Phase 17** | **AI Phase 8: Persistent User Memory & Feedback** | **Not Started** | Savings targets, preference storage, user rating loop |
| **Phase 18** | **AI Phase 9: Evaluation Suite & Observability** | **Not Started** | Golden evals, accuracy benchmarking, Langfuse traces |
| **Phase 19** | **AI Phase 10: Production Hardening & Final Verification**| **Not Started** | Dockerization, bundle optimization, interview readiness |

---

## Part 1: Core Application Foundations (Historical Phases)

### Phase 1: Core Express Server Setup
- [x] Initialize `server/package.json` with dependencies (`express`, `mongoose`, `dotenv`, `cors`, `helmet`, `morgan`).
- [x] Create environment configuration loader (`server/src/config/db.js` and `env.js`).
- [x] Implement central error handling middleware (`server/src/middlewares/errorHandler.js`).
- [x] Implement standardized response utility (`server/src/utils/response.js`).
- [x] Create `/health` status route and launch Express backend server.

### Phase 2: User Authentication & JWT Security
- [x] Create `User` Mongoose Schema with password hashing hooks (`bcryptjs`).
- [x] Implement `authService` (register, login, generateToken).
- [x] Implement `authController` and `/api/v1/auth` routes.
- [x] Create JWT validation middleware (`server/src/middlewares/authMiddleware.js`).

### Phase 3: Categories & Transaction Foundations
- [x] Create `Category` model and seed script for default categories.
- [x] Implement `categoryService`, `categoryController`, and `/api/v1/categories` routes.

### Phase 4: Expense Management Module
- [x] Create `Expense` model with validation rules.
- [x] Implement `expenseService` (create, get list with pagination/filtering, update, delete).
- [x] Implement `expenseController` and `/api/v1/expenses` routes.

### Phase 5: Income Management Module
- [x] Create `Income` model.
- [x] Implement `incomeService`, `incomeController`, and `/api/v1/incomes` routes.

### Phase 6: Budgeting System
- [x] Create `Budget` model with month/year compound index.
- [x] Implement budget calculation logic and alert notifications.

### Phase 7: Analytics & Aggregation
- [x] Create multi-model `dashboardService` (`/summary`, `/charts`, `/recent`).
- [x] Implement `dashboardController` and `/api/v1/dashboard` routes.

### Phase 8: Production React Frontend
- [x] Configure Vite, Tailwind CSS, and Lucide Icons in `client/`.
- [x] Create Axios API client with request token & 401 response interceptors (`src/api/`).
- [x] Build `AuthContext` and `ThemeContext` global providers.
- [x] Build Recharts visual components (`CategoryPieChart`, `MonthlyTrendChart`).
- [x] Build full SPA pages (`Login`, `Register`, `Dashboard`, `Expenses`, `Incomes`, `Budgets`).

### Phase 9: Enterprise Features & Financial Health Engine
- [x] Create RFC 4180 CSV Export service (`exportService.js`, `exportController.js`, `/api/v1/export/csv`).
- [x] Implement rule-based Financial Health Score engine (`insightService.js`, `insightController.js`, `/api/v1/insights`).
- [x] Build `RecurringTransaction` model, service & auto-processing template engine (`/api/v1/recurring`).
- [x] Develop frontend `exportApi.js`, `insightApi.js`, `recurringApi.js`.
- [x] Create `AIInsightsCard.jsx` widget with Health Score SVG Gauge and recommendations.
- [x] Update Dashboard UI with CSV export download trigger & AI Health Card.

---

## Part 2: Agentic Personal Finance Intelligence Platform

---

### Phase 10 (AI Phase 1): Basic AI Assistant & Tool Foundation
- **Status**: **Completed** (Code implementation, tool factory, error handling, tests, and UI integration verified; live conversation awaits optional user API key configuration)
- **Objective**: Establish the foundational AI conversational interface using LangChain.js, connect core read-only financial tools to existing application services, and embed a persistent chat assistant into the authenticated frontend.

#### Tasks:
- [x] **Verify & Preserve Bug Fixes**:
  - `insightService.js`: Correct budget limit property to `b.amountLimit`.
  - `ProtectedRoute.jsx`: Correct React attribute to `className`.
  - `exportService.js`: Correct income export field to `item.source`.
  - `budgetService.js`: Wrap `userId` with `new mongoose.Types.ObjectId(userId)` in aggregation pipeline.
- [x] **Install Dependencies**: Install `@langchain/core`, `@langchain/google-genai`, and `zod` in `server/`.
- [x] **Implement AI Tool Factory (`server/src/services/aiTools.js`)**:
  - `get_expenses`: Month/year expense retrieval, top expenses, and case-insensitive category resolution.
  - `get_income`: Month/year income retrieval and source breakdown.
  - `get_financial_summary`: Lifetime income/expenses, net savings, and month-over-month growth.
  - `get_budget_status`: Category limits, amounts spent, remaining amounts, and alert thresholds.
  - `get_category_breakdown`: Category spending percentages and monthly trend history.
- [x] **Implement AI Agent Service (`server/src/services/aiService.js`)**:
  - Implement tool-calling agent loop with bounded iterations (`MAX_ITERATIONS = 6`).
  - Strict system prompt enforcing factual, non-hallucinatory financial grounding.
  - Graceful error handling for missing credentials (HTTP 503) and rate limits (HTTP 429).
- [x] **Implement Protected AI Controller & Routes**:
  - Create `server/src/controllers/aiController.js` and `server/src/routes/aiRoutes.js`.
  - Mount `/api/v1/ai` in `server/src/app.js` with `protect` JWT middleware.
- [x] **Build & Mount Client Interface (`client/src/components/AIChat.jsx`)**:
  - Floating responsive chat widget with suggestions, loading indicators, and tool badges.
  - Mount `<AIChat />` in `AppLayout` using React Router `<Outlet />` to ensure persistent state across page transitions.
- [x] **Add Automated Test Suite (`server/src/tests/aiPhase1.test.js`)**:
  - Verify tool factory creation, Zod schema validation, category resolution, and fail-fast checks.
  - Add `npm test` script to `server/package.json`.

#### Acceptance Criteria:
- All 10 unit tests pass in `server/src/tests/aiPhase1.test.js`.
- Client builds without errors (`npm run build`).
- Private financial assistant is inaccessible to unauthenticated users.
- Server returns HTTP 503 when API key is missing without crashing.

---

### Phase 11 (AI Phase 2): Advanced Tool Calling & Simulation
- **Status**: **Completed** (Implementation verified: `compare_periods` and `simulate_budget_change` tools added, deterministic calculations verified, sanitized logging and call memoization enabled, 19 unit tests passing)
- **Objective**: Expand read-only financial tools to support cross-period comparative analysis, deterministic what-if budget simulations, and recurring transaction projections without mutating database state.

#### Tasks:
- [x] **Implement `compare_periods` Tool**:
  - Accept parameters: `baseMonth`, `baseYear`, `targetMonth`, `targetYear`. Defaults to current month vs previous month.
  - Calculate absolute and percentage differences for income, expenses, and net savings.
  - Identify top category spending shifts between the two periods.
  - Anchor date ranges to UTC to prevent local timezone month-shifting bugs.
- [x] **Implement `simulate_budget_change` Tool**:
  - Accept parameters: `categoryName`, `proposedAmountLimit` (positive number), or `percentageChange` (e.g. -15%).
  - Compute historical compliance across past 3-12 months: breach frequency and average monthly spending.
  - Calculate projected monthly difference and annual impact (savings vs deficit) deterministically.
- [x] **Enhance Input Validation & Security**:
  - Validate all tool arguments with strict Zod schemas (prevent negative amounts, invalid month numbers, or Malicious regex strings).
  - Enforce user data isolation on every tool execution (scoped to `userId`).
- [x] **Logging & Guardrails**:
  - Add sanitized logs for tool execution timing and parameter keys without leaking sensitive financial amounts.
  - Prevent duplicate identical tool invocations in a single turn via signature memoization.
- [x] **Automated Test Suite**:
  - Created `server/src/tests/aiPhase2.test.js` verifying comparative math, simulation formulas, breach counting, and schema validation.
  - Verified all 19 server tests pass cleanly with `npm test`.

#### Acceptance Criteria:
- Natural-language queries like "Compare my spending between August and September" invoke `compare_periods`.
- Natural-language queries like "What happens if I cut Dining Out by 15%?" invoke `simulate_budget_change` with deterministic calculations.
- Math calculations are 100% deterministic and match service unit tests.
- Zero database write operations occur during read-only tool execution.

---

### Phase 12 (AI Phase 3): LangGraph Multi-Step Agent Orchestration
- **Status**: **Not Started**
- **Objective**: Transition from a basic tool loop to an orchestrated state machine using `@langchain/langgraph`, managing complex multi-step reasoning, dynamic query decomposition, cyclical execution, and state checkpointing.

#### Tasks:
- [ ] **Install & Configure LangGraph**:
  - Verify and install `@langchain/langgraph` in `server/`.
- [ ] **Define Agent State Machine (`server/src/agent/state.js`)**:
  - Define state channels: `messages`, `plan`, `retrievedData`, `currentStep`, `errors`, `iterationCount`.
- [ ] **Implement Graph Nodes**:
  - `planner_node`: Decomposes complex financial queries into analytical steps.
  - `tool_executor_node`: Invokes user-scoped tools based on the current active plan.
  - `analyzer_node`: Evaluates retrieved data against the user's objective to decide if more data is needed.
  - `synthesizer_node`: Composes the final evidence-based answer referencing specific retrieved data points.
  - `fallback_node`: Handles missing data, timeouts, or unresolvable requests gracefully.
- [ ] **Define Conditional Routing & Edges**:
  - Create conditional edges: routes to `tool_executor_node` if more data is required, or to `synthesizer_node` when evidence is complete.
  - Implement hard loop boundary (e.g. maximum 8 graph transitions) with cycle detection.
- [ ] **Agent Trace & Step Transparency**:
  - Update `AIChat.jsx` to display step-by-step reasoning milestones (e.g. "Step 1: Retrieved August expenses", "Step 2: Comparing with September") without exposing internal chain-of-thought tokens.
- [ ] **Automated Test Suite**:
  - Add tests in `server/src/tests/aiPhase3.test.js` verifying graph routing, state propagation, and termination guarantees.

#### Acceptance Criteria:
- Complex questions like "Why did my savings drop this month and what category drove it?" trigger a multi-step graph execution.
- Infinite loops and runaway execution are physically prevented by graph cycle limits.
- The UI displays user-friendly progress indicators for multi-step tasks.
- State is properly scoped and discarded at request completion.

---

### Phase 13 (AI Phase 4): Genuine MCP Client/Server Architecture
- **Status**: **Not Started**
- **Objective**: Architect and implement a genuine Model Context Protocol (MCP) integration using the official `@modelcontextprotocol/sdk`, establishing a standardized protocol for tool discovery and execution.

#### Tasks:
- [ ] **SDK Inspection & Architecture Design**:
  - Inspect official `@modelcontextprotocol/sdk` and define protocol boundaries.
  - Separate concerns: MCP Server (exposing tools), MCP Client (agent consumer), and internal FinanceFlow services.
- [ ] **Build FinanceFlow MCP Server (`server/src/mcp/server.js`)**:
  - Expose tool discovery endpoint (`tools/list`).
  - Register standardized tool definitions:
    - `financeflow_get_summary`
    - `financeflow_get_budget_status`
    - `financeflow_compare_periods`
    - `financeflow_simulate_budget`
  - Implement secure authentication handshake: authenticate incoming MCP connections using user-scoped session tokens.
- [ ] **Implement Transport Layer**:
  - Support stdio transport for local integration and authenticated Stream/SSE transport for web service communication.
- [ ] **Build Internal MCP Client (`server/src/mcp/client.js`)**:
  - Connect LangGraph agent to the MCP Server via protocol client.
  - Dynamically discover available tools at runtime.
- [ ] **Automated Protocol Testing**:
  - Add protocol-level unit and integration tests verifying MCP handshake, tool listing, and authorized execution.

#### Acceptance Criteria:
- A genuine MCP client connects to the FinanceFlow MCP server using official protocol specifications.
- `tools/list` returns accurate JSON schemas conforming to MCP standard.
- Tools invoked via MCP return authentic FinanceFlow data scoped to the authenticated user.
- Unauthorized or malformed MCP requests are rejected with standard protocol errors.

---

### Phase 14 (AI Phase 5): Useful External Service Integrations
- **Status**: **Not Started**
- **Objective**: Connect FinanceFlow to external productivity services (Google Calendar, Google Drive) to support meaningful end-to-end financial workflows while ensuring the core application functions completely without external credentials.

#### Tasks:
- [ ] **Select & Evaluate Integrations**:
  - Google Calendar: Automated creation of monthly financial review reminders.
  - Google Drive: Automated export and backup of monthly financial summary reports (PDF/CSV).
- [ ] **Design Secure OAuth 2.0 Token Management**:
  - Create encrypted user token storage for third-party OAuth tokens.
  - Support OAuth connection, token refresh, and complete disconnection in user settings.
- [ ] **Implement Google Calendar Workflow**:
  - Tool `schedule_financial_review`: Proposes a calendar reminder for budget reviews.
  - Present user confirmation before adding events to the external calendar.
- [ ] **Implement Google Drive Workflow**:
  - Tool `export_report_to_drive`: Generates formatted monthly financial summary and saves to user's Google Drive.
- [ ] **Decoupled Fallback Design**:
  - Ensure 100% of core FinanceFlow features continue working when external integrations are unconfigured or disconnected.
  - Provide clear setup instructions and scope definitions in documentation.
- [ ] **Automated Mock Testing**:
  - Add tests with mocked OAuth providers verifying error handling, expired tokens, and payload contracts.

#### Acceptance Criteria:
- End-to-end workflow "Schedule my monthly financial review" creates a Google Calendar reminder with user confirmation.
- Exporting reports to Google Drive uploads verified financial data.
- System functions flawlessly when external service API keys are absent or revoked.
- No external write operation occurs without explicit user agreement.

---

### Phase 15 (AI Phase 6): Human-in-the-Loop & Controlled Write Actions
- **Status**: **Not Started**
- **Objective**: Enable the AI agent to propose and execute controlled financial modifications (such as budget limits and new categories) through an explicit, cryptographically secured Human-in-the-Loop (HITL) approval workflow.

#### Tasks:
- [ ] **Define Permitted Controlled Actions**:
  - `create_budget`: Propose setting a new budget target for a category.
  - `update_budget_limit`: Propose adjusting an existing budget limit.
  - `create_category`: Propose creating a new custom expense or income category.
  - *Explicit Non-Goals*: Financial transfers, debit transactions, or account deletions are strictly prohibited.
- [ ] **Implement Cryptographic Proposal Engine**:
  - Generate temporary, signed Proposal tokens containing: `actionType`, `targetId`, `parameters`, `userId`, `timestamp`, `expiresAt` (5-minute TTL).
  - Store pending proposals in a short-lived cache or database collection.
- [ ] **Build Interactive Approval UI in `AIChat.jsx`**:
  - Render an `ActionProposalCard` showing: action description, previous value, proposed value, projected financial impact, and explicit "Approve" / "Reject" buttons.
- [ ] **Implement Action Execution Endpoint (`POST /api/v1/ai/action/execute`)**:
  - Re-verify user authentication, token signature, expiration, and current entity state before mutating database.
  - Execute modification via existing services (`budgetService`, `categoryService`).
- [ ] **Audit Trail Logging**:
  - Record an immutable audit log for every proposed, approved, and rejected action with user ID, timestamp, and payload diff.
- [ ] **Automated Security & Lifecycle Testing**:
  - Add tests verifying rejection of expired tokens, tampered parameters, and cross-user approvals.

#### Acceptance Criteria:
- The LLM cannot perform database write actions autonomously; all writes require explicit user approval.
- Proposal tokens cannot be reused, modified, or approved by another user.
- Approved actions successfully update database records through validated services.
- Every executed action creates a complete, inspectable audit log.

---

### Phase 16 (AI Phase 7): Comprehensive Security, Guardrails & Threat Defense
- **Status**: **Not Started**
- **Objective**: Harden the platform against prompt injections, adversarial manipulation, cross-user data leakage, and excessive resource consumption.

#### Tasks:
- [ ] **Prompt Injection Defense & Untrusted Content Isolation**:
  - Wrap user transaction descriptions and notes in strict data boundaries in tool outputs.
  - System prompt hardening prohibiting execution of commands embedded in transaction data.
- [ ] **Authorization & IDOR Defense**:
  - Enforce server-side `userId` injection across 100% of AI tools.
  - Test and prevent attacks where an attacker requests: "Show me user 123's expenses".
- [ ] **Rate Limiting & Abuse Prevention**:
  - Implement IP and user-based rate limiting on `/api/v1/ai/*` endpoints (e.g. 20 requests per minute).
  - Cap maximum request string lengths (2,000 characters) and tool output sizes.
- [ ] **LLM Cost & Output Control**:
  - Enforce strict `maxOutputTokens` on all model invocations.
  - Add timeout wrappers on LLM invocations (e.g. 15-second timeout).
- [ ] **Adversarial Security Test Suite**:
  - Add tests in `server/src/tests/aiSecurity.test.js` evaluating injection attacks, unauthorized access attempts, and rate limit responses.

#### Acceptance Criteria:
- Attempts to query other users' financial data return zero unauthorized records.
- Prompt injection strings inside expense notes fail to alter agent instructions.
- Exceeding rate limits returns HTTP 429 without service interruption.
- Automated security test suite verifies all threat models.

---

### Phase 17 (AI Phase 8): Persistent User Memory & Feedback Loop
- **Status**: **Not Started**
- **Objective**: Allow users to store persistent financial preferences and goals, while capturing user feedback on AI responses to continuously improve conversational quality.

#### Tasks:
- [ ] **User Financial Profile & Preferences Schema (`server/src/models/UserPreference.js`)**:
  - Fields: `monthlySavingsGoal`, `primaryCurrency`, `riskTolerance`, `customFinancialNotes`, `alertPreferences`.
  - CRUD endpoints: `GET /api/v1/user/preferences`, `PUT /api/v1/user/preferences`.
- [ ] **Inject Preferences into Agent Context**:
  - Feed authenticated user preferences into system context so the agent provides personalized advice (e.g. keeping monthly savings goal in mind).
- [ ] **Conversational Feedback Widget**:
  - Add thumbs-up / thumbs-down buttons to AI responses in `AIChat.jsx`.
  - Endpoint `POST /api/v1/ai/feedback`: Store rating, message ID, user prompt, and optional user comment.
- [ ] **Preference Management Interface**:
  - Add a "Financial Preferences" modal in the frontend for users to review and update stored memory.
- [ ] **Automated Tests**:
  - Verify preference persistence, user scoping, and prompt context injection.

#### Acceptance Criteria:
- Users can review, update, and clear their stored financial preferences.
- The assistant tailors insights based on user goals (e.g. referencing savings targets).
- Feedback records are saved with user association for evaluation tracking.

---

### Phase 18 (AI Phase 9): Evaluation Suite, Benchmarking & Observability
- **Status**: **Not Started**
- **Objective**: Build a reproducible automated evaluation framework measuring tool-selection accuracy, numerical correctness, latency, and agent observability.

#### Tasks:
- [ ] **Construct Golden Evaluation Dataset (`server/src/tests/evals/dataset.json`)**:
  - Curate 50+ diverse test queries covering:
    - Direct factual questions
    - Ambiguous dates ("last summer", "recent weeks")
    - Category-filtered queries
    - Multi-step comparisons
    - Zero-data / empty account states
    - Injection and out-of-scope queries
- [ ] **Build Automated Benchmark Runner (`server/src/tests/evals/evalRunner.js`)**:
  - Measure:
    - Tool Selection Accuracy (% correct tool chosen)
    - Argument Accuracy (% correct month/year/category)
    - Numerical Precision (% claims matching tool outputs)
    - Refusal Accuracy (% out-of-scope requests safely refused)
- [ ] **Observability & Tracing Evaluation**:
  - Evaluate and integrate Langfuse for tracking LLM traces, latency, and token consumption.
  - Add structured request-level metrics (duration, tools called, token usage).
- [ ] **Evaluation Reporting Script**:
  - Generate automated evaluation markdown reports summarizing benchmark results.

#### Acceptance Criteria:
- Automated benchmark runner runs deterministically and outputs a comprehensive accuracy report.
- 100% adherence to numerical claims matching tool data (zero fabricated figures).
- Observability logs capture execution traces without logging unhashed passwords or raw financial credentials.

---

### Phase 19 (AI Phase 10): Production Hardening, Final Verification & Deployment Readiness
- **Status**: **Not Started**
- **Objective**: Conduct comprehensive end-to-end integration testing, optimize frontend and backend performance, package application with Docker, and prepare technical interview demonstrations.

#### Tasks:
- [ ] **End-to-End System Integration Testing**:
  - Full user journey testing: Register -> Add Transactions -> Budget Setup -> AI Query -> Multi-step Analysis -> Action Proposal -> User Approval -> Database Verification.
- [ ] **Frontend Optimization**:
  - Dynamic code-splitting for routes and large chart components to reduce initial bundle size below 300 kB gzip.
- [ ] **Containerization & Deployment Configuration**:
  - Create production-grade `Dockerfile` for server and client.
  - Create `docker-compose.yml` orchestrating MongoDB, Express server, and Vite client.
- [ ] **Final Documentation Master Polish**:
  - Update root `README.md` with complete architecture diagrams, screenshots, and setup instructions.
  - Compile an **Interview Architecture Guide** detailing key decisions (LangChain vs raw API, MCP integration, security invariants, state machine trade-offs).
- [ ] **Handoff & Deployment Verification**:
  - Verify complete repository status, clean Git history, and reproducible local startup.

#### Acceptance Criteria:
- All test suites (unit, security, evaluation, frontend build) pass with 100% green status.
- Docker containers build and launch successfully with single `docker-compose up`.
- Complete, interview-ready documentation across all `/docs` files.