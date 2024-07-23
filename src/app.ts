import express, {Request, Response, NextFunction} from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import inventoryRoutes from './routes/inventoryRoutes';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/api/inventory', inventoryRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;
