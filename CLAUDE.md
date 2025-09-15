# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FireTracker is a real-time wildfire monitoring application built with React, TypeScript, Express, and Mapbox GL JS. It tracks active wildfires across the United States using the NASA FIRMS API and provides features like location-based filtering, wildfire statistics, and alert subscriptions.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (serves both API and client on port 5000)
npm run dev

# Build production bundle
npm run build

# Start production server
npm start

# Type checking
npm run check

# Database operations
npm run db:push    # Push schema changes to database
npm run db:seed    # Seed database with sample data
```

## Architecture

### Full-Stack Structure
- **Monorepo**: Single package.json with client and server code
- **Port 5000**: Single port serves both API (`/api/*`) and client (SPA)
- **Development**: Vite dev server with Express API integration
- **Production**: Express serves built static files + API

### Key Directories
- `client/src/`: React frontend application
- `server/`: Express backend with API routes and services
- `shared/`: Database schema and types shared between client/server
- `db/`: Database configuration, migrations, and seeding

### Database & Schema
- **ORM**: Drizzle ORM with PostgreSQL
- **Schema**: Defined in `shared/schema.ts` with types exported for both client/server
- **Tables**: wildfires, alerts, updates, subscriptions, users
- **Key Features**: Location-based queries, wildfire statistics, alert management

### External APIs
- **NASA FIRMS API**: Real-time wildfire data from satellites
- **Mapbox GL JS**: Interactive mapping with wildfire visualization
- **Location Services**: Geolocation-based wildfire filtering and nearby fire detection

### State Management
- **React Query**: Server state management and caching
- **Wouter**: Lightweight routing for React
- **Theme Provider**: Dark theme support

### UI Components
- **Design System**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Lucide React icons

## Important Implementation Details

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `NASA_FIRMS_API_KEY`: NASA FIRMS API access key

### Alias Configuration
Vite path aliases are configured for imports:
- `@/`: Points to `client/src/`
- `@db`: Points to `db/`
- `@shared`: Points to `shared/`

### API Caching
The server implements a 5-minute cache for NASA FIRMS API calls to prevent rate limiting. Refresh endpoint at `/api/wildfires/refresh` respects this cache.

### Location Features
- User location detection for nearby wildfire filtering
- Distance calculations use Haversine formula for accurate geographical distances
- Wildfire clustering based on proximity (5km radius) when processing NASA data

### Data Processing
- NASA FIRMS CSV data is converted to application wildfire schema
- Fire grouping and severity calculation based on FRP (Fire Radiative Power)
- Perimeter coordinates generated as circles for visualization
- Existing fires are updated rather than duplicated based on location proximity