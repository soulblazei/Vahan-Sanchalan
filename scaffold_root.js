const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;

function write(filePath, content) {
    fs.writeFileSync(path.join(ROOT_DIR, filePath), content.trim() + '\n');
}

write('docker-compose.yml', `
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: fleet
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d fleet"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/fleet?schema=public
      - JWT_SECRET=supersecretfleetkey2026
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "npx prisma generate &&
             npx prisma migrate dev --name init &&
             npm run build &&
             node dist/index.js"

  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:5000/api
    depends_on:
      - backend

volumes:
  pgdata:
`);

write('backend/Dockerfile', `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
`);

write('frontend/Dockerfile', `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
`);

write('README.md', `
# Fleet Lifecycle & Operations Management Web Application

Production-ready enterprise-grade repository for managing a fleet lifecycle, drivers, dispatch, and operational costs.

## Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **DevOps**: Docker & docker-compose

## Setup Instructions

Ensure you have Docker and \`docker-compose\` installed.

1. Start the application:
   \`\`\`bash
   docker-compose up --build
   \`\`\`

2. Database Seeding
   The backend command will run migrations. To seed the initial users (RBAC mappings) and vehicles, you can run:
   \`\`\`bash
   docker-compose exec backend npx ts-node prisma/seed.ts
   \`\`\`

3. Accessing the Application
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000/api
   
   Login with:
   - Email: \`manager@fleet.com\`
   - Password: \`admin123\`

## Project Structure
- \`/backend\`: Express REST API, Prisma schema, Authentication & Authorization middlewares
- \`/frontend\`: React app configured with Vite & Tailwind, containing Dashboard, Vehicles registry, and Dispatch interfaces.

## Testing
Run backend tests:
\`\`\`bash
cd backend
npm test
\`\`\`
`);
console.log('Root scaffolding created.');
