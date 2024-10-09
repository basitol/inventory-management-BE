// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import Inventory from '../models/Inventory'; // Adjust the path as needed
// // Import other models as needed

// dotenv.config();

// let isConnected = false;

// const syncIndexes = async () => {
//   try {
//     await Promise.all([
//       Inventory.syncIndexes(),
//       // Add other models here as needed, e.g.:
//       // User.syncIndexes(),
//       // Order.syncIndexes(),
//     ]);
//     console.log('Database indexes synced');
//   } catch (error) {
//     console.error('Error syncing indexes:', error);
//   }
// };

// const connectDB = async () => {
//   if (isConnected) {
//     console.log('Using existing database connection');
//     return;
//   }

//   try {
//     await mongoose.connect(process.env.MONGO_URI as string, {
//       serverSelectionTimeoutMS: 5000,
//       autoIndex: true,
//     });

//     isConnected = true;
//     console.log(`MongoDB Connected: ${mongoose.connection.host}`);

//     // Sync indexes after successful connection
//     await syncIndexes();

//     mongoose.connection.on('disconnected', () => {
//       console.log('MongoDB disconnected');
//       isConnected = false;
//       setTimeout(connectDB, 10); // Attempt to reconnect after 10 milliseconds
//     });

//     mongoose.connection.on('error', err => {
//       console.error('MongoDB connection error:', err);
//       isConnected = false;
//       setTimeout(connectDB, 5000); // Attempt to reconnect after 5 seconds
//     });
//   } catch (error) {
//     console.error('Error connecting to MongoDB:', error);
//     isConnected = false;
//     setTimeout(connectDB, 5000); // Attempt to reconnect after 5 seconds
//   }
// };

// export const checkConnection = () => {
//   return mongoose.connection.readyState === 1;
// };

// export default connectDB;

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Inventory from '../models/Inventory';
// Import other models as needed

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log(`MongoDB connected: ${mongoose.connection.host}`);

    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to db');
    });

    mongoose.connection.on('error', err => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose connection is disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log(
        'Mongoose connection is disconnected due to application termination',
      );
      process.exit(0);
    });

    await syncIndexes();
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const syncIndexes = async (): Promise<void> => {
  try {
    await Promise.all([
      Inventory.syncIndexes(),
      // Add other models here as needed
    ]);
    console.log('Database indexes synced');
  } catch (error) {
    console.error('Error syncing indexes:', error);
  }
};

export const checkConnection = (): boolean =>
  mongoose.connection.readyState === 1;

export default connectDB;
