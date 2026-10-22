# Architectural Specification: Modular Layered Architecture

## Overview
This application enforces a strict **Modular Layered Architecture** (also known as N-Tier Architecture) on the backend and a **Component-Driven State-Managed Architecture** on the frontend.

## 1. Backend Architecture (Express.js + Node.js)

```
                       ┌─────────────────────────┐
                       │   Client Request (HTTP) │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │      Router Layer       │
                       └────────────┬────────────┘
                                    │
                        (Middleware: Auth, Validation)
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │    Controller Layer     │ (Thin Controller)
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │      Service Layer      │ (Fat Service: Business Logic)
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │   Model Layer (Mongoose)│
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │     MongoDB Database    │
                       └─────────────────────────┘
```

### Layer Responsibilities
1. **Router Layer (`server/src/routes/`)**
   - Matches incoming URL path and HTTP verb (GET, POST, PUT, DELETE).
   - Applies route-specific middleware (Authentication, Role checks, Input Validation).
   - Delegates request handling to the Controller.

2. **Controller Layer (`server/src/controllers/`)**
   - **Thin Controllers**: No business logic or database queries here!
   - Extracts request data (`req.params`, `req.query`, `req.body`, `req.user`).
   - Invokes the appropriate Service function.
   - Formats the HTTP Response using standard API response helpers (`res.status(code).json(...)`).
   - Catches errors and passes them to `next(err)` for global error handling.

3. **Service Layer (`server/src/services/`)**
   - **Fat Services**: Contains all core business rules, math calculations, data transformations, and orchestration.
   - Interacts with Models to query/mutate the database.
   - Throws descriptive Custom Error objects (`AppError`, `BadRequestError`, `NotFoundError`, etc.) when rules fail.

4. **Model Layer (`server/src/models/`)**
   - Defines Mongoose Schemas, data validation, field types, indexes, and virtual fields.
   - Handles low-level database operations.

5. **Global Error Handling Middleware (`server/src/middlewares/errorHandler.js`)**
   - Catches all operational and syntax errors across the application.
   - Standardizes response structure (`{ success: false, message: "...", errors: [...] }`).
   - Logs errors cleanly in development/production.

---

## 2. Frontend Architecture (React + Vite)

```
[ Router (React Router v6) ]
          │
          ▼
[ Pages (Dashboard, Expenses, Incomes, Budgets, Auth) ]
          │
          ▼
[ Components (Forms, Tables, Charts, Modals, Navbar, Sidebar) ]
          │
          ▼
[ Global Context / State (AuthContext, ExpenseContext) ]
          │
          ▼
[ API Client (Axios Instance with Request/Response Interceptors) ]
```

### Key Architectural Concepts
- **Single Source of Truth**: Global authentication and UI themes are managed via React Context.
- **API Isolation**: All HTTP calls live inside `src/api/` services, never directly in UI components.
- **Interceptors**: Axios request interceptors automatically attach JWT bearer tokens; response interceptors catch 401 Unauthorized errors to handle session logout smoothly.

---

## 3. AI Agent Architecture (LangChain.js + Tool-Calling Loop)

```
[ User Request via AIChat.jsx ]
              │
              ▼ (POST /api/v1/ai/chat + JWT)
[ Auth Middleware (`protect`) ] ──> Validates Token, Extracts `req.user._id`
              │
              ▼
[ AI Controller (`aiController.js`) ]
              │
              ▼
[ AI Service Agent Loop (`aiService.js`) ]
   │
   ├─► 1. Bind Per-User Dynamic Tools (`aiTools.js` via `createToolsForUser(userId)`)
   ├─► 2. Invoke LLM (`ChatGoogleGenerativeAI` gemini-2.0-flash, temperature=0.3)
   │
   ▼ (Does LLM propose tool_calls?)
  ┌─────────────────────────┐
  │ YES: Execute Tool Loop  │ ──► [ AI Tool ] ──► [ Existing Service (Expense/Budget/Dashboard) ]
  │ (Bounded <= 6 steps)    │                                     │
  └───────────┬─────────────┘                                     ▼
              │ (Feed deterministic ToolMessage back to LLM) [ MongoDB Queries ]
              ▼
  ┌─────────────────────────┐
  │ NO: Final Response      │ ──► Returns `{ response, toolsUsed }` to Client
  └─────────────────────────┘
```

### Critical Security & Architectural Invariants
1. **User Identity Invariant**: The LLM is **never** asked for a `userId` and cannot pass one as a tool argument. `userId` is injected strictly by server-side authentication (`req.user._id`) into the tool factory.
2. **Zero Financial Math in LLM**: The LLM does not perform raw additions, subtractions, or database queries. All calculations are deterministically executed by existing services (`expenseService`, `budgetService`, `dashboardService`). The LLM only explains and structures the returned facts.
3. **Bounded Agent Iterations**: The tool loop is hard-capped at 6 iterations to prevent infinite recursion, uncontrolled token usage, or runaway costs.
4. **Resilient Category Matching**: The `get_expenses` tool resolves user-provided category names against accessible categories (`$or: [{ user: null }, { user: userId }]`), and safely informs the user/LLM if an unknown category is requested without returning misleading unfiltered totals.
5. **Fail-Fast Configuration**: If `GOOGLE_GEMINI_API_KEY` is omitted, the service returns a graceful `503 Service Unavailable` with setup guidance without crashing the application.
6. **Deterministic Financial Simulation Engine**: The `simulate_budget_change` tool calculates historical breach compliance over past months and projects annual impact using deterministic arithmetic. The `compare_periods` tool computes exact income, expense, and savings deltas alongside sorted category shifts. All date queries are anchored in UTC to prevent timezone month-shifting bugs.
7. **Sanitized Observability & Call Memoization**: Tool execution logs record execution duration and parameter keys while omitting sensitive financial amounts or notes. In-turn tool call memoization prevents redundant executions of identical requests within the same agent loop.