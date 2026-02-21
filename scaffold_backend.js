const fs = require('fs');
const path = require('path');

const BACKEND_DIR = path.join(__dirname, 'backend');

function mkdir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function write(filePath, content) {
    fs.writeFileSync(path.join(BACKEND_DIR, filePath), content.trim() + '\n');
}

mkdir(BACKEND_DIR);

write('package.json', JSON.stringify({
  "name": "fleet-app-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "test": "jest",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.2",
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.3",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/node": "^20.4.5",
    "jest": "^29.6.2",
    "nodemon": "^3.0.1",
    "prisma": "^5.0.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  }
}, null, 2));

write('tsconfig.json', JSON.stringify({
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}, null, 2));

write('.env.example', `
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@db:5432/fleet?schema=public"
JWT_SECRET="supersecretfleetkey2026"
`);

mkdir(path.join(BACKEND_DIR, 'prisma'));
write('prisma/schema.prisma', `
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  password String
  role     Role
}

enum Role {
  MANAGER
  DISPATCHER
  SAFETY_OFFICER
  FINANCIAL_ANALYST
}

model Vehicle {
  id              Int               @id @default(autoincrement())
  name            String
  licensePlate    String            @unique
  maxLoadCapacity Float
  odometer        Float             @default(0)
  status          VehicleStatus     @default(AVAILABLE)
  trips           Trip[]
  maintenanceLogs MaintenanceLog[]
  expenses        Expense[]
}

enum VehicleStatus {
  AVAILABLE
  ON_TRIP
  IN_SHOP
  RETIRED
}

model Driver {
  id            Int           @id @default(autoincrement())
  name          String
  licenseType   String
  licenseExpiry DateTime
  safetyScore   Float         @default(100)
  status        DriverStatus  @default(OFF_DUTY)
  trips         Trip[]
}

enum DriverStatus {
  ON_DUTY
  OFF_DUTY
  SUSPENDED
  ON_TRIP
}

model Trip {
  id            Int        @id @default(autoincrement())
  vehicleId     Int
  driverId      Int
  cargoWeight   Float
  status        TripStatus @default(DRAFT)
  startOdometer Float?
  endOdometer   Float?
  createdAt     DateTime   @default(now())

  vehicle       Vehicle    @relation(fields: [vehicleId], references: [id])
  driver        Driver     @relation(fields: [driverId], references: [id])
}

enum TripStatus {
  DRAFT
  DISPATCHED
  COMPLETED
  CANCELLED
}

model MaintenanceLog {
  id          Int      @id @default(autoincrement())
  vehicleId   Int
  description String
  cost        Float
  date        DateTime @default(now())
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
}

model Expense {
  id        Int      @id @default(autoincrement())
  vehicleId Int
  liters    Float
  cost      Float
  date      DateTime @default(now())
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
}
`);

write('prisma/seed.ts', `
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  
  await prisma.user.createMany({
    data: [
      { email: 'manager@fleet.com', password, role: 'MANAGER' },
      { email: 'dispatcher@fleet.com', password, role: 'DISPATCHER' },
      { email: 'safety@fleet.com', password, role: 'SAFETY_OFFICER' },
      { email: 'finance@fleet.com', password, role: 'FINANCIAL_ANALYST' }
    ],
    skipDuplicates: true,
  });

  const v1 = await prisma.vehicle.create({
    data: { name: 'Volvo FH16', licensePlate: 'V-1001', maxLoadCapacity: 20000, odometer: 15000, status: 'AVAILABLE' }
  });

  const d1 = await prisma.driver.create({
    data: { name: 'John Doe', licenseType: 'CDL-A', licenseExpiry: new Date('2030-01-01'), status: 'ON_DUTY' }
  });
  console.log('Seeding complete');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
`);

mkdir(path.join(BACKEND_DIR, 'src'));
mkdir(path.join(BACKEND_DIR, 'src', 'controllers'));
mkdir(path.join(BACKEND_DIR, 'src', 'middlewares'));
mkdir(path.join(BACKEND_DIR, 'src', 'routes'));
mkdir(path.join(BACKEND_DIR, 'src', 'services'));
mkdir(path.join(BACKEND_DIR, 'tests'));

write('src/index.ts', `
import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`);

write('src/middlewares/auth.ts', `
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
`);

write('src/middlewares/errorHandler.ts', `
import { Request, Response, NextFunction } from 'express';
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
};
`);

write('src/services/db.ts', `
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
`);

write('src/controllers/authController.ts', `
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/db';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPwd = await bcrypt.compare(password, user.password);
    if (!validPwd) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
`);

write('src/controllers/vehicleController.ts', `
import { Request, Response } from 'express';
import { prisma } from '../services/db';

export const getVehicles = async (req: Request, res: Response) => {
  const vehicles = await prisma.vehicle.findMany();
  res.json(vehicles);
};

export const getVehicleById = async (req: Request, res: Response) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(req.params.id) } });
  if (!vehicle) return res.status(404).json({ error: 'Not found' });
  res.json(vehicle);
};

export const createVehicle = async (req: Request, res: Response) => {
  const vehicle = await prisma.vehicle.create({ data: req.body });
  res.json(vehicle);
};

export const updateVehicleStatus = async (req: Request, res: Response) => {
  const { status } = req.body;
  const vehicle = await prisma.vehicle.update({ where: { id: Number(req.params.id) }, data: { status } });
  res.json(vehicle);
};
`);

write('src/controllers/driverController.ts', `
import { Request, Response } from 'express';
import { prisma } from '../services/db';

export const getDrivers = async (req: Request, res: Response) => {
  const drivers = await prisma.driver.findMany();
  res.json(drivers);
};
`);

write('src/controllers/tripController.ts', `
import { Request, Response } from 'express';
import { prisma } from '../services/db';

export const getTrips = async (req: Request, res: Response) => {
  const trips = await prisma.trip.findMany({ include: { vehicle: true, driver: true } });
  res.json(trips);
};

export const dispatchTrip = async (req: Request, res: Response) => {
  const { vehicleId, driverId, cargoWeight } = req.body;
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });

  if (!vehicle || vehicle.status !== 'AVAILABLE') return res.status(400).json({ error: 'Vehicle unavailable' });
  if (cargoWeight > vehicle.maxLoadCapacity) return res.status(400).json({ error: 'Cargo exceeds capacity' });
  if (!driver || driver.status !== 'ON_DUTY') return res.status(400).json({ error: 'Driver unavailable' });
  if (new Date(driver.licenseExpiry) < new Date()) return res.status(400).json({ error: 'Driver license expired' });

  const trip = await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({ where: { id: vehicleId }, data: { status: 'ON_TRIP' } });
    await tx.driver.update({ where: { id: driverId }, data: { status: 'ON_TRIP' } });
    return tx.trip.create({ data: { vehicleId, driverId, cargoWeight, status: 'DISPATCHED', startOdometer: vehicle.odometer } });
  });

  res.json(trip);
};

export const completeTrip = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { endOdometer } = req.body;
  
  const trip = await prisma.trip.findUnique({ where: { id: Number(id) } });
  if (!trip || trip.status !== 'DISPATCHED') return res.status(400).json({ error: 'Invalid trip' });
  if (endOdometer <= trip.startOdometer!) return res.status(400).json({ error: 'Invalid odometer reading' });

  const completed = await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE', odometer: endOdometer } });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: 'ON_DUTY' } });
    return tx.trip.update({ where: { id: Number(id) }, data: { status: 'COMPLETED', endOdometer } });
  });

  res.json(completed);
};
`);

write('src/controllers/analyticsController.ts', `
import { Request, Response } from 'express';
import { prisma } from '../services/db';

export const getDashboardKPIs = async (req: Request, res: Response) => {
  const activeFleet = await prisma.vehicle.count({ where: { status: 'ON_TRIP' } });
  const inShop = await prisma.vehicle.count({ where: { status: 'IN_SHOP' } });
  const pendingCargoAggr = await prisma.trip.aggregate({ _sum: { cargoWeight: true }, where: { status: 'DRAFT' } });
  const totalVehicles = await prisma.vehicle.count();
  
  res.json({
    activeFleet,
    inShop,
    utilizationRate: totalVehicles ? (activeFleet / totalVehicles) * 100 : 0,
    pendingCargo: pendingCargoAggr._sum.cargoWeight || 0
  });
};
`);

write('src/routes/index.ts', `
import { Router } from 'express';
import { login } from '../controllers/authController';
import { getVehicles, getVehicleById, createVehicle, updateVehicleStatus } from '../controllers/vehicleController';
import { getTrips, dispatchTrip, completeTrip } from '../controllers/tripController';
import { getDrivers } from '../controllers/driverController';
import { getDashboardKPIs } from '../controllers/analyticsController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Auth
router.post('/auth/login', login);

// Vehicles
router.get('/vehicles', authenticate, getVehicles);
router.post('/vehicles', authenticate, authorize(['MANAGER']), createVehicle);
router.patch('/vehicles/:id/status', authenticate, authorize(['MANAGER']), updateVehicleStatus);

// Drivers
router.get('/drivers', authenticate, getDrivers);

// Trips
router.get('/trips', authenticate, getTrips);
router.post('/trips/dispatch', authenticate, authorize(['DISPATCHER', 'MANAGER']), dispatchTrip);
router.post('/trips/:id/complete', authenticate, authorize(['DISPATCHER', 'MANAGER']), completeTrip);

// Analytics
router.get('/analytics/kpis', authenticate, getDashboardKPIs);

export default router;
`);

write('tests/sample.test.ts', `
describe('Sample Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
`);

write('jest.config.js', `
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
};
`);
console.log('Backend scaffolding script created.');
