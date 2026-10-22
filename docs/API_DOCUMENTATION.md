# REST API Specification

Standard API Base URL: `http://localhost:5000/api/v1`

Standard JSON Response Structure:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```
Standard Error Response Structure:
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [ "Email is already registered" ]
}
```

---

## 1. System & Health Check
- `GET /health` - Check backend server & database connectivity status.

## 2. Authentication (`/api/v1/auth`)
- `POST /auth/register` - Register new user account.
- `POST /auth/login` - Authenticate user & issue JWT token.
- `GET /auth/me` - Get current authenticated user profile (Protected).
- `POST /auth/logout` - Logout user.

## 3. Categories (`/api/v1/categories`)
- `GET /categories` - List user & default categories (Protected).
- `POST /categories` - Create custom category (Protected).
- `DELETE /categories/:id` - Delete custom category (Protected).

## 4. Expenses (`/api/v1/expenses`)
- `GET /expenses` - List user expenses with pagination & filters (Protected).
- `POST /expenses` - Create expense (Protected).
- `GET /expenses/:id` - Get expense details (Protected).
- `PUT /expenses/:id` - Update expense (Protected).
- `DELETE /expenses/:id` - Delete expense (Protected).

## 5. Incomes (`/api/v1/incomes`)
- `GET /incomes` - List user incomes with pagination & filters (Protected).
- `POST /incomes` - Create income record (Protected).
- `PUT /incomes/:id` - Update income record (Protected).
- `DELETE /incomes/:id` - Delete income record (Protected).

## 6. Budgets (`/api/v1/budgets`)
- `GET /budgets` - List budgets and budget vs spent progress (Protected).
- `POST /budgets` - Set/Create budget for category (Protected).
- `PUT /budgets/:id` - Update budget limit (Protected).

## 7. Analytics & Dashboard (`/api/v1/dashboard`)
- `GET /dashboard/summary` - Total income, total expenses, net balance, monthly breakdown (Protected).
- `GET /dashboard/charts` - Category-wise spending breakdown for charts (Protected).

## 8. AI Financial Assistant (`/api/v1/ai`)
- `POST /ai/chat` - Natural language financial assistant query (Protected).
  - **Headers**: `Authorization: Bearer <token>`
  - **Request Body**:
    ```json
    {
      "message": "Compare my spending between August and September 2026"
    }
    ```
  - **Success Response (200)**:
    ```json
    {
      "success": true,
      "message": "AI response generated successfully",
      "data": {
        "response": "Comparing August and September 2026: your total spending increased by $250.00 (+25.0%)...",
        "toolsUsed": ["compare_periods"]
      }
    }
    ```
  - **Error Responses**:
    - `400 Bad Request`: Message missing, empty, or exceeds 2,000 characters.
    - `401 Unauthorized`: Invalid or missing JWT bearer token.
    - `503 Service Unavailable`: `GOOGLE_GEMINI_API_KEY` not configured in server environment.

### Supported Deterministic AI Tools (Read-Only)
1. `get_expenses`: Retrieves monthly expenses, totals, and top transactions with case-insensitive category resolution.
2. `get_income`: Retrieves monthly income records, sources, and total income.
3. `get_financial_summary`: Retrieves lifetime totals, net savings, and month-over-month growth metrics.
4. `get_budget_status`: Retrieves category budget limits, spent amounts, percentage used, and alert status.
5. `get_category_breakdown`: Retrieves percentage spending breakdowns by category and trend charts.
6. `compare_periods`: Compares income, expenses, net savings, and category spending shifts between two periods.
7. `simulate_budget_change`: Evaluates historical breach compliance (3–12 months) and projected annual savings/deficits for what-if budget limit adjustments.