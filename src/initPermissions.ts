import mongoose from 'mongoose';
import dotenv from 'dotenv';
// import connectDB from './db'; // Use the improved connection logic
import {Permission} from 'models/Permission';
import connectDB from 'config/db';
// import {Permission} from '../models/Permission';

dotenv.config();

const initializePermissions = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const permissionNames = [
      'createCompany',
      'manageUsers',
      'setWarranty',
      'manageRoles',
      'createPermission',
      'viewPermissions',
      'manageInventory', // Ensure this matches what you need
    ];

    const initializedPermissions = [];

    // Ensure each permission is initialized
    for (const name of permissionNames) {
      const result = await Permission.findOneAndUpdate(
        {name}, // Search for permission by name
        {name, description: `Allows ${name}`}, // Update or insert if it does not exist
        {upsert: true, new: true}, // Upsert option to insert if not found
      );

      if (result) {
        initializedPermissions.push(result.name);
      } else {
        console.error(`Failed to initialize permission: ${name}`);
      }
    }

    console.log('Initialized Permissions:', initializedPermissions);

    if (initializedPermissions.length !== permissionNames.length) {
      console.warn('Not all permissions were initialized correctly.');
    } else {
      console.log('All permissions initialized successfully.');
    }
  } catch (error) {
    console.error('Failed to initialize permissions:', error);
  } finally {
    mongoose.disconnect();
  }
};

initializePermissions().catch(console.error);
