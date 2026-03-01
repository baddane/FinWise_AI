# FinWise AI - Architecture Documentation

## Overview

FinWise AI is a full-stack AI-powered personal finance application built with a FastAPI backend and Next.js frontend.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│                 (Next.js / React)                       │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │Dashboard │  │Transactions│ │Analysis  │  │AI Chat │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────┐
│                   FastAPI Backend                        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  /auth   │  │/transactions│ │/analysis │  │ /chat  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │                   Services Layer                    │ │
│  │  AuthService  FinancialService  AIService           │ │
│  └────────────────────────────────────────────────────┘ │
└────────┬───────────────────────────┬────────────────────┘
         │                           │
┌────────▼──────────┐    ┌──────────▼──────────────────┐
│   PostgreSQL DB   │    │     Anthropic Claude API     │
│                   │    │      (claude-sonnet-4-6)     │
│  Users            │    │                              │
│  Transactions     │    │  AI Chat                     │
│  Budgets          │    │  Financial Analysis          │
│  Categories       │    │  Spending Insights           │
└───────────────────┘    └──────────────────────────────┘
```

## Backend Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app, middleware, router registration
│   ├── config.py        # Settings from environment variables
│   ├── database.py      # SQLAlchemy engine, session, Base
│   ├── models/          # SQLAlchemy ORM models
│   │   ├── user.py      # User model
│   │   ├── transaction.py # Transaction & Category models
│   │   ├── budget.py    # Budget model
│   │   └── analysis.py  # FinancialAnalysis model
│   ├── routers/         # FastAPI route handlers
│   │   ├── auth.py      # Register, login endpoints
│   │   ├── transactions.py # CRUD for transactions
│   │   ├── analysis.py  # Spending & budget analysis
│   │   └── chat.py      # AI chat endpoint
│   └── services/        # Business logic
│       ├── auth_service.py      # JWT, password hashing, user auth
│       ├── financial_service.py # Spending summaries, budget status
│       └── ai_service.py        # Claude API integration
└── tests/               # Pytest test suite
```

## Frontend Structure

```
frontend/
├── src/
│   ├── pages/           # Next.js pages (file-based routing)
│   │   ├── index.tsx    # Redirect to dashboard or login
│   │   ├── login.tsx    # Login & registration page
│   │   ├── dashboard.tsx # Main dashboard
│   │   └── chat.tsx     # AI chat page
│   ├── components/      # Reusable React components
│   │   ├── Layout/      # Sidebar navigation
│   │   ├── Dashboard/   # StatCard, BudgetProgress
│   │   └── Charts/      # SpendingChart, CategoryPieChart
│   ├── hooks/           # Custom React hooks
│   │   └── useAuth.ts   # Authentication state
│   ├── services/        # API client
│   │   └── api.ts       # Axios-based API calls
│   └── types/           # TypeScript type definitions
│       └── index.ts
└── public/              # Static assets
```

## Data Flow

### Authentication
1. User submits credentials → POST `/api/auth/login`
2. Backend validates → returns JWT token
3. Frontend stores token in localStorage
4. All subsequent requests include `Authorization: Bearer <token>`

### AI Chat
1. User sends message → POST `/api/chat`
2. Backend fetches user's financial context (spending, budgets)
3. Context + conversation history sent to Claude API
4. Claude's response returned to frontend

### Financial Analysis
1. Dashboard loads → GET `/api/analysis/spending` & `/api/analysis/budgets`
2. Backend queries DB, aggregates data
3. Frontend renders charts with Recharts

## Security

- Passwords hashed with bcrypt
- JWT tokens for stateless authentication
- CORS configured to allow only frontend origin
- Environment variables for all secrets

## Key Dependencies

| Package | Purpose |
|---------|---------|
| FastAPI | REST API framework |
| SQLAlchemy | ORM + database abstraction |
| Alembic | Database migrations |
| anthropic | Claude AI SDK |
| python-jose | JWT handling |
| passlib | Password hashing |
| Next.js | React framework |
| Recharts | Data visualization |
| Zustand | Client state management |
| Tailwind CSS | Utility-first styling |
