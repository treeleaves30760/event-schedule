# Event Schedule Application

A modern event scheduling application with AI-powered event creation, priority matrix visualization, and multi-user authentication support.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Technologies](#technologies)
- [Deployment & Production](#deployment--production)
- [Troubleshooting](#troubleshooting)

## Features

- **Visual Prioritization**: View events in a 5x5 priority matrix based on urgency and importance
- **AI-Powered Event Creation**: Use natural language to create events with OpenAI or Ollama integration
- **Multiple Event Types**: Support for events, homework, meetings, tasks, and reminders
- **Authentication**: Both local authentication (JWT) and Auth0 OAuth integration
- **API Access**: Generate API tokens for programmatic access
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Full dark mode support
- **Flexible Database**: SQLite for local development or PostgreSQL (Supabase) for production

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18 or higher
- **pnpm** (recommended), npm, or yarn
  ```bash
  npm install -g pnpm
  ```
- **AI Provider** (choose one for AI features):
  - **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/api-keys)
  - **Ollama** - Install locally from [Ollama.ai](https://ollama.ai) and pull a model (e.g., `ollama pull llama3`)
- **Auth0 Account** (optional, for OAuth authentication) - Sign up at [Auth0](https://auth0.com)
- **Supabase Account** (optional, for PostgreSQL database) - Sign up at [Supabase](https://supabase.com)

## Installation

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

   Or with npm:
   ```bash
   npm install
   ```

## Environment Configuration

1. **Copy the environment template**
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables**

   Open `.env` and configure the following:

   ### Required Configuration

   ```env
   # Database (choose one option below)
   DATABASE_URL="file:./dev.db"  # For local SQLite (recommended for development)

   # JWT Secret (required for local authentication)
   JWT_SECRET="your-generated-secret-here"

   # LLM Provider (choose "openai" or "ollama")
   LLM_PROVIDER="openai"

   # OpenAI Configuration (when using OpenAI)
   OPENAI_API_KEY="sk-your-openai-api-key-here"
   OPENAI_MODEL="gpt-4o-mini"

   # Ollama Configuration (when using Ollama)
   OLLAMA_ENDPOINT="http://localhost:11434"
   OLLAMA_MODEL="llama3"
   ```

   ### Generate JWT Secret
   ```bash
   openssl rand -hex 32
   ```
   Copy the output and paste it as your `JWT_SECRET` value.

   ### AI Provider Setup

   **Option 1: Using OpenAI**
   1. Set `LLM_PROVIDER="openai"`
   2. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   3. Set `OPENAI_API_KEY` to your API key
   4. (Optional) Change `OPENAI_MODEL` to use a different model (default: gpt-4o-mini)

   **Option 2: Using Ollama (Local LLM)**
   1. Install Ollama from [Ollama.ai](https://ollama.ai)
   2. Pull a model:
      ```bash
      ollama pull llama3
      # Or other models: mistral, gemma, etc.
      ```
   3. Start Ollama server (usually runs automatically):
      ```bash
      ollama serve
      ```
   4. Set `LLM_PROVIDER="ollama"`
   5. Configure `OLLAMA_ENDPOINT` (default: http://localhost:11434)
   6. Set `OLLAMA_MODEL` to your pulled model name

   **Benefits of Ollama:**
   - 🔒 Privacy: Run LLM locally, no data sent to external APIs
   - 💰 Cost-effective: No API usage fees
   - ⚡ No API rate limits
   - 🌐 Works offline

   ### Optional Configuration

   **For PostgreSQL (Supabase) Database:**
   ```env
   # Get from: Supabase Dashboard > Project Settings > Database
   DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@HOST:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@HOST:5432/postgres"
   ```

   **Note**: URL-encode special characters in your password:
   - `#` becomes `%23`
   - `@` becomes `%40`
   - `&` becomes `%26`

   **For Auth0 Authentication:**
   ```env
   # Generate with: openssl rand -hex 32
   AUTH0_SECRET="your-generated-secret-here"
   AUTH0_BASE_URL="http://localhost:3000"
   AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"
   AUTH0_CLIENT_ID="your-client-id"
   AUTH0_CLIENT_SECRET="your-client-secret"
   ```

   Get these values from: Auth0 Dashboard > Applications > Your Application

## Database Setup

### Option 1: SQLite (Recommended for Development)

1. **Initialize the database**
   ```bash
   pnpm migrate
   ```

   This command will:
   - Create the SQLite database file (`dev.db`)
   - Apply all schema migrations
   - Create User and Event tables

### Option 2: PostgreSQL with Supabase (Production)

1. **Create a Supabase project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project
   - Note your database password

2. **Get connection strings**
   - Navigate to: Project Settings > Database
   - Copy the "Connection string" for `DATABASE_URL`
   - Copy the "Direct connection string" for `DIRECT_URL`
   - Update both URLs in your `.env` file

3. **Push schema to Supabase**
   ```bash
   pnpm migrate
   ```

### Verify Database Setup

You can verify the database tables were created by checking your Supabase dashboard:
- Go to **Table Editor** in the Supabase dashboard
- You should see `User` and `Event` tables

## Running the Application

### Development Mode

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

### Other Commands

```bash
# Run ESLint
pnpm lint

# Run database migrations
pnpm migrate
```

## Usage Guide

### Creating Your First Account

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click "Sign Up" to create a local account
3. Or click "Sign in with Auth0" if configured

### AI-Powered Event Creation

Click the "Create Event" button and use natural language like:

- **Homework**: "Submit machine learning assignment by tomorrow 5pm"
- **Meeting**: "Team standup next Monday at 9am for 30 minutes"
- **Task**: "Review code before deployment Friday"
- **Event**: "Birthday party this Saturday at 7pm"

The AI will automatically:
- Parse the event details
- Set appropriate date and time
- Suggest urgency and importance levels
- Categorize the event type

### Understanding the Priority Matrix

Events are displayed in a 5×5 grid:

```
      1    2    3    4    5   ← Urgency
    ┌────┬────┬────┬────┬────┐
  5 │    │    │    │    │ !! │  High Importance
    ├────┼────┼────┼────┼────┤
  4 │    │    │    │    │    │
    ├────┼────┼────┼────┼────┤
  3 │    │    │    │    │    │  Medium
    ├────┼────┼────┼────┼────┤
  2 │    │    │    │    │    │
    ├────┼────┼────┼────┼────┤
  1 │    │    │    │    │    │  Low Importance
    └────┴────┴────┴────┴────┘
    Low                    High
         Urgency
```

**Focus on the top-right quadrant** (High urgency + High importance) for maximum impact.

### Managing Events

- **View Details**: Click any event card
- **Edit Event**: Click the edit icon on the event card
- **Delete Event**: Click the delete icon
- **Filter by Type**: Use the filter dropdown to show specific event types

### Generating API Tokens

1. Go to Settings (user icon in top-right)
2. Click "Generate API Token"
3. Copy your token (shown only once!)
4. Use it in API requests

## API Documentation

### Authentication

Include your API token in the request header:
```bash
x-api-token: YOUR_TOKEN_HERE
```

### List All Events

```bash
curl -H "x-api-token: YOUR_TOKEN" \
  http://localhost:3000/api/events
```

**Response:**
```json
[
  {
    "id": "1",
    "title": "Submit homework",
    "description": "Machine learning assignment",
    "type": "homework",
    "startTime": "2024-01-15T17:00:00Z",
    "urgency": 5,
    "importance": 4,
    "userId": "user123"
  }
]
```

### Create Event

```bash
curl -X POST \
  -H "x-api-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Event",
    "description": "Event description",
    "type": "task",
    "startTime": "2024-01-20T10:00:00Z",
    "urgency": 3,
    "importance": 3
  }' \
  http://localhost:3000/api/events
```

### AI Event Creation via API

```bash
curl -X POST \
  -H "x-api-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Team meeting tomorrow at 2pm"
  }' \
  http://localhost:3000/api/events/ai
```

### Update Event

```bash
curl -X PUT \
  -H "x-api-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "urgency": 4
  }' \
  http://localhost:3000/api/events/EVENT_ID
```

### Delete Event

```bash
curl -X DELETE \
  -H "x-api-token: YOUR_TOKEN" \
  http://localhost:3000/api/events/EVENT_ID
```

## Technologies

### Core Framework
- **Next.js 16** with App Router
- **React 19** with Server Components
- **TypeScript 5** for type safety

### Styling
- **Tailwind CSS 4** with PostCSS
- **CVA (class-variance-authority)** for component variants
- **Lucide React** for icons

### Database
- **postgres** library for PostgreSQL connections
- **Raw SQL** queries for database operations
- **SQLite** (development)
- **PostgreSQL** (production via Supabase)

### Authentication
- **JWT** with bcryptjs for password hashing
- **@auth0/nextjs-auth0** for OAuth

### AI Integration
- **OpenAI API** (GPT-4o-mini) for natural language processing
- **Ollama** for local LLM inference (llama3, mistral, gemma, etc.)

### Utilities
- **Zod** for runtime validation
- **date-fns** for date manipulation
- **clsx** & **tailwind-merge** for className management

## Deployment & Production

### Production Deployment Guides

For production deployment and self-hosting, please refer to our comprehensive documentation:

- **[Complete Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)**
  - Step-by-step guide for local and production deployment
  - Development environment setup (SQLite, Ollama)
  - Production environment setup (Supabase, OpenAI)
  - Security configuration checklist
  - Testing and verification steps
  - Deployment options (Vercel, Docker, VPS)

- **[Supabase Security Setup](./docs/deployment/SUPABASE_SECURITY.md)**
  - Understanding Row Level Security (RLS)
  - Security risks and mitigation
  - Complete RLS setup guide
  - Policy explanations
  - Production security best practices

- **[RLS Setup SQL Script](./docs/deployment/supabase_rls_setup.sql)**
  - Ready-to-use SQL script for Supabase
  - Enables RLS on all tables
  - Creates security policies
  - Fixes function security issues

### Quick Production Checklist

Before deploying to production, ensure you have:

- [ ] Set up Supabase database with proper connection strings
- [ ] **Executed RLS setup script** (critical for security!)
- [ ] Generated secure JWT_SECRET (`openssl rand -hex 32`)
- [ ] Configured AI provider (OpenAI or Ollama)
- [ ] Set up SSL/HTTPS for your domain
- [ ] Tested all features (auth, events, API)
- [ ] Verified data isolation between users
- [ ] Set up monitoring and logging
- [ ] Configured automated backups

⚠️ **Important**: Not setting up RLS will expose all user data to anyone with database access. This is a critical security vulnerability.

📖 **For detailed instructions**, see the [Complete Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md).

## Troubleshooting

### Database Issues

**Problem**: Database connection errors or "Cannot connect to database"

**Solution**: Initialize the database with Prisma migrations:
```bash
npx prisma migrate dev --name init
```

This command will:
- Create the database file if it doesn't exist
- Apply all pending migrations
- Generate Prisma Client
- Set up the schema properly

Alternatively, you can use:
```bash
pnpm migrate
```

**Problem**: Migration errors with Supabase

**Solution**:
1. Ensure your Supabase project is active (not paused)
2. Verify `DATABASE_URL` is correctly set and password is URL-encoded
3. Check that you can connect to Supabase from your network
4. If issues persist, try: `npx prisma migrate dev --name init`

### Authentication Issues

**Problem**: JWT errors or "Invalid token"

**Solution**:
1. Verify `JWT_SECRET` is set in `.env`
2. Generate a new secret: `openssl rand -hex 32`
3. Clear browser cookies and try again

**Problem**: Auth0 redirect errors

**Solution**:
1. Verify `AUTH0_BASE_URL` matches your running URL
2. Check Auth0 Dashboard > Applications > Allowed Callback URLs includes your base URL + `/api/auth/callback`
3. Ensure all Auth0 environment variables are set

### OpenAI Issues

**Problem**: AI event creation fails with OpenAI

**Solution**:
1. Verify `OPENAI_API_KEY` is correct
2. Check your OpenAI account has credits
3. Ensure key starts with `sk-`
4. Confirm `LLM_PROVIDER="openai"` in `.env`

### Ollama Issues

**Problem**: AI event creation fails with Ollama

**Solution**:
1. Ensure Ollama is installed and running:
   ```bash
   ollama list  # Check installed models
   ollama serve # Start Ollama server
   ```
2. Verify the model is pulled:
   ```bash
   ollama pull llama3  # Or your chosen model
   ```
3. Check `OLLAMA_ENDPOINT` is accessible:
   ```bash
   curl http://localhost:11434/api/tags
   ```
4. Confirm environment variables:
   - `LLM_PROVIDER="ollama"`
   - `OLLAMA_MODEL` matches an installed model
   - `OLLAMA_ENDPOINT` is correct (default: http://localhost:11434)

**Problem**: Ollama response is slow

**Solution**:
1. Ollama models run on your local hardware - performance depends on your CPU/GPU
2. Consider using a smaller model like `llama3:8b` instead of `llama3:70b`
3. First inference is slower (model loading), subsequent requests are faster
4. Check Ollama is using GPU acceleration if available

**Problem**: Ollama connection refused

**Solution**:
1. Ensure Ollama server is running: `ollama serve`
2. Check if the port is already in use: `lsof -i :11434`
3. Verify firewall settings allow localhost connections
4. Try restarting Ollama

### Development Server Issues

**Problem**: Port 3000 already in use

**Solution**:
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or run on a different port
pnpm dev -- -p 3001
```

**Problem**: Module not found errors

**Solution**:
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Build Issues

**Problem**: Type errors during build

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
pnpm build
```

## Project Structure

```
frontend/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── events/       # Event CRUD operations
│   │   └── user/         # User management
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── lib/              # Utilities and configurations
│   │   ├── db.ts         # PostgreSQL connection
│   │   └── auth.ts       # Authentication utilities
│   ├── types/            # TypeScript type definitions
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Homepage
├── migrations/           # SQL migration files
│   └── 001_init.sql      # Initial database schema
├── public/               # Static assets
├── scripts/              # Build and setup scripts
│   └── migrate.ts        # Database migration runner
├── .env.example          # Environment template
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## Support

For issues, questions, or contributions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the `.env.example` file for configuration examples
3. Open an issue on the repository

## License

This project is open source and available for personal and educational use.
