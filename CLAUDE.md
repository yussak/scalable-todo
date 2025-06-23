# CLAUDE.md

always answer in Japanese.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a scalable TODO application practice project built with a microservices architecture:
- **Frontend**: Next.js 15 with React 19, TailwindCSS 4, TypeScript
- **Backend**: Express.js with TypeScript 
- **Database**: PostgreSQL 17
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
```

### Frontend (runs on port 3010)
```bash
cd frontend
yarn dev        # Development server with Turbopack
yarn build      # Production build
yarn start      # Production server
yarn lint       # ESLint
```

### Backend (runs on port 3011)
```bash
cd backend
yarn dev        # Development server with nodemon
yarn build      # TypeScript compilation
yarn start      # Production server
```

## Architecture

### Service Configuration
- **Frontend**: Next.js on port 3010, depends on backend
- **Backend**: Express API on port 3011, connects to PostgreSQL
- **Database**: PostgreSQL on port 5433 (mapped from container port 5432)

### Database Connection
Backend connects to PostgreSQL using:
- Host: `db` (Docker service name)
- Port: 5432 (internal)
- Database: `myapp`
- User: `postgres`
- Password: `password`

### Development Environment
All services run in development mode with:
- Hot reload enabled
- Volume mounts for live code changes
- Node modules cached in anonymous volumes

## Key Files
- `compose.yaml`: Docker services configuration
- `backend/src/index.ts`: Express server entry point
- `frontend/src/app/`: Next.js App Router structure