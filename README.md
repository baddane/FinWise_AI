# FinWise AI

An AI-powered personal finance assistant that helps users manage budgets, analyze spending patterns, track investments, and get intelligent financial advice.

## Features

- **AI Chat Interface**: Conversational AI for personalized financial guidance
- **Transaction Analysis**: Automatic categorization and spending insights
- **Budget Management**: Set and track budgets with intelligent alerts
- **Investment Tracking**: Monitor portfolio performance and get AI-driven insights
- **Financial Reports**: Detailed analytics and visualizations

## Architecture

```
FinWise_AI/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── models/   # Database models
│   │   ├── routers/  # API endpoints
│   │   ├── services/ # Business logic & AI integration
│   │   └── utils/    # Helper utilities
│   └── tests/
├── frontend/         # Next.js React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/
│   └── public/
└── docker-compose.yml
```

## Tech Stack

**Backend:**
- Python 3.11+
- FastAPI
- SQLAlchemy + PostgreSQL
- Anthropic Claude API
- JWT Authentication

**Frontend:**
- Next.js 14
- TypeScript
- Tailwind CSS
- Recharts (data visualization)

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Docker & Docker Compose (optional)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/baddane/FinWise_AI.git
   cd FinWise_AI
   ```

2. Set up environment variables:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

3. Configure `backend/.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/finwise
   ANTHROPIC_API_KEY=your_anthropic_api_key
   JWT_SECRET_KEY=your_secret_key
   ```

### Running with Docker

```bash
docker-compose up --build
```

### Running Locally

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The API will be available at `http://localhost:8000` and the frontend at `http://localhost:3000`.

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## License

MIT
