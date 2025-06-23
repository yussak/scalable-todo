# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

always answer in Japanese.

## Project Overview

This is a scalable TODO application practice project built with a microservices architecture for handling large amounts of data:
- **Frontend**: Next.js 15.3.4 (App Router) with React 19, TailwindCSS 4, TypeScript 5
- **Backend**: Express.js 5.1.0 with TypeScript 5.8.3, Prisma ORM 6.10.1
- **Database**: PostgreSQL 17
- **Testing**: Vitest for both frontend and backend
- **Development**: Docker Compose for containerized development

## Development Commands

### Using Docker Compose (Recommended)
```bash
# Start all services (frontend, backend, database)
docker compose up

# Start with rebuild
docker compose up --build

# Stop all services
docker compose down

# Database operations
docker compose exec backend npx prisma migrate dev  # Run migrations
docker compose exec backend npx prisma studio       # Open Prisma Studio
```

### Frontend (runs on port 3010)
```bash
cd frontend
yarn dev        # Development server with Turbopack
yarn build      # Production build
yarn start      # Production server
yarn lint       # ESLint
yarn test       # Run tests in watch mode
yarn test:run   # Run tests once
yarn test:ui    # Run tests with UI
```

### Backend (runs on port 3011)
```bash
cd backend
yarn dev        # Development server with nodemon
yarn build      # TypeScript compilation to dist/
yarn start      # Production server
yarn test       # Run tests in watch mode
yarn test:run   # Run tests once

# Prisma commands
npx prisma migrate dev    # Create and apply migrations
npx prisma generate       # Generate Prisma Client
npx prisma studio        # Open Prisma Studio GUI
npx prisma db push       # Push schema changes without migration
```

## Architecture

### Service Configuration
- **Frontend**: Next.js on port 3010, depends on backend
- **Backend**: Express API on port 3011, connects to PostgreSQL
- **Database**: PostgreSQL on port 5433 (mapped from container port 5432)

### API Structure
Base URL: `http://localhost:3011`

Endpoints:
- `GET /` - API health check
- `GET /health` - Detailed health check
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create a new todo (body: `{title: string, description?: string}`)

### Database Schema (Prisma)
```prisma
model Todo {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Database Connection
Backend connects to PostgreSQL using:
- Host: `db` (Docker service name) / `localhost` (local development)
- Port: 5432 (internal) / 5433 (external)
- Database: `myapp`
- User: `postgres`
- Password: `password`
- Connection string: `postgresql://postgres:password@db:5432/myapp`

### Test Configuration
- Both frontend and backend use Vitest
- Frontend tests use React Testing Library with jsdom environment
- Backend tests use Node environment with global test functions
- Test files pattern: `*.test.ts` or `*.test.tsx`

## Key Architecture Patterns

### Backend Structure
- `src/index.ts` - Express server setup and middleware configuration
- `src/prisma.ts` - Prisma client singleton instance
- `src/routes/todos.ts` - RESTful API routes for TODO operations
- `prisma/schema.prisma` - Database schema definition

### Frontend Structure
- Next.js App Router in `src/app/`
- API calls to backend should use environment variables for base URL
- Server Components by default, Client Components with `"use client"` directive

### Development Workflow
1. Docker Compose starts all services with hot reload
2. Frontend proxies API calls to backend
3. Database migrations are managed with Prisma
4. Changes to schema.prisma require running migrations
5. Both services have TypeScript compilation checks