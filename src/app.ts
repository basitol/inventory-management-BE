import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import setupSuperAdmin from './utils/setupSuperAdmin';
import userRoutes from './routes/userRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import companyRoutes from './routes/companyRoutes';
import authRoutes from './routes/authRoutes';
import errorHandler from './middleware/errorHandler';
import cors from 'cors';
import authenticate from './middleware/authenticate';
import {Permission} from './models/User';
import {getInventoryByDeviceTypeOrStatus} from './controllers/inventoryController';
import authorize from './middleware/authorize';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  }),
);

app.use(express.json());

// Add the inventory-filter route directly to the app
// app.get(
//   '/api/inventory-filter',
//   authenticate,
//   authorize([Permission.ViewInventory, Permission.ManageInventory]),
//   getInventoryByDeviceTypeOrStatus,
// );

app.use('/api/users', userRoutes);
app.use('/api', inventoryRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/auth', authRoutes);

app.use(errorHandler);

export {app};
export const startServer = async (): Promise<void> => {
  await connectDB();
  // await setupSuperAdmin();
};
