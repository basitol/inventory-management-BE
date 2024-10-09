// import express from 'express';
// import dotenv from 'dotenv';
// import connectDB from './config/db';
// import setupSuperAdmin from './utils/setupSuperAdmin';
// import userRoutes from './routes/userRoutes';
// import inventoryRoutes from './routes/inventoryRoutes';
// import companyRoutes from './routes/companyRoutes';
// import authRoutes from './routes/authRoutes'; // Import auth routes
// import errorHandler from './middleware/errorHandler';
// import cors from 'cors';
// // import init

// // Load environment variables
// dotenv.config();

// // Create Express app
// const app = express();

// // Use the CORS middleware
// app.use(
//   cors({
//     origin: 'http://localhost:3001', // Allow your front-end origin
//     credentials: true, // Allow cookies to be sent
//   }),
// );

// // Middleware to parse JSON requests
// app.use(express.json());

// // Routes
// app.use('/api/users', userRoutes);
// app.use('/api', inventoryRoutes);
// app.use('/api/companies', companyRoutes);
// app.use('/api/auth', authRoutes); // Add auth routes

// // Error Handling Middleware
// app.use(errorHandler);

// // Export the app and a function to start the server
// export {app};
// export const startServer = async () => {
//   await connectDB();

//   await setupSuperAdmin();
// };

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

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  }),
);

app.use(express.json());

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
