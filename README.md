# podverse-management-api

Administrative API for Podverse management system.

## Overview

The Podverse Management API provides backend services for the management system, handling admin account authentication and management-specific operations.

## Development Setup

### Prerequisites

- Node.js v22+
- PostgreSQL (management database on port 5999)
- npm

### Installation

```bash
npm install
```

### Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Key environment variables:
- `API_PORT`: API server port (default: 1999)
- `DB_HOST`: Management database host
- `DB_PORT`: Management database port (default: 5999)
- `AUTH_JWT_SECRET`: JWT secret for authentication

### Running

Development mode with hot reload:
```bash
npm run dev:watch
```

Build for production:
```bash
npm run build:prod
```

Start production server:
```bash
npm start
```

## Docker

Build the Docker image:
```bash
docker build -t podverse-management-api .
```

## API Endpoints

### Authentication

- `POST /api/v2/auth/login` - Admin login
- `POST /api/v2/auth/logout` - Admin logout
- `GET /api/v2/auth/me` - Get current admin user

### Admin Account

- `GET /api/v2/admin-account/:id` - Get admin account by ID

## Database

The management system uses its own PostgreSQL database with the following tables:

- `admin_account` - Admin user accounts
- `admin_account_credentials` - Admin login credentials

## License

AGPLv3
