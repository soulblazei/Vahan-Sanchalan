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
