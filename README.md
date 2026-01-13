# Kind Mind AI

AI-powered voice and chat assistant for mental health support.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see `env.example`)

3. Run database migrations:
```bash
npm run db:push
```

4. Start development server:
```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key (optional, falls back to Groq)
- `GROQ_API_KEY` - Groq API key (recommended)

