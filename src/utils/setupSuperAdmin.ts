// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import User from '../models/User';
// import bcrypt from 'bcryptjs';
// import {Permission, IPermission} from '../models/Permission';
// import connectDB from '../config/db'; // Import the connection script

// dotenv.config();

// const setupSuperAdmin = async () => {
//   try {
//     // Connect to MongoDB
//     await connectDB();

//     const permissionNames = [
//       'createCompany',
//       'manageUsers',
//       'setWarranty',
//       'manageRoles',
//       'createPermission',
//       'viewPermissions',
//       'manageInventory',
//       'createAdmin',
//       'createStaff',
//       'viewInventory',
//     ];

//     // Fetch permission ObjectIds from the database
//     const permissions = await Permission.find({name: {$in: permissionNames}});

//     if (permissions.length !== permissionNames.length) {
//       console.error(
//         'Not all permissions found in the database. Check permissions initialization.',
//       );
//       return;
//     }

//     const permissionIds = permissions.map(permission => permission._id);

//     const hashedPassword = await bcrypt.hash('supersecurepassword', 10);

//     const superAdmin = await User.findOneAndUpdate(
//       {userId: 'superadmin'},
//       {
//         userId: 'superadmin',
//         email: 'superadmin@example.com',
//         password: hashedPassword, // Ensure this password is hashed
//         permissions: permissionIds,
//         isSuperAdmin: true,
//         isAdmin: true,
//       },
//       {upsert: true, new: true},
//     ).populate<{permissions: IPermission[]}>('permissions'); // Populate permissions with names

//     if (superAdmin) {
//       // Log the superAdmin with populated permissions
//       console.log('Super Admin setup complete:', {
//         ...superAdmin.toObject(),
//         permissions: superAdmin.permissions.map(p => p.name),
//       });
//     }
//   } catch (error) {
//     console.error('Failed to set up Super Admin:', error);
//   } finally {
//     mongoose.disconnect();
//   }
// };

// export default setupSuperAdmin;

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, {IUser, Permission} from '../models/User';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db';

dotenv.config();

// Define a new interface for the setup flag
interface ISetupFlag extends mongoose.Document {
  key: string;
  value: boolean;
}

// Create a model for the setup flag
const SetupFlagSchema = new mongoose.Schema({
  key: {type: String, required: true, unique: true},
  value: {type: Boolean, required: true},
});

const SetupFlag = mongoose.model<ISetupFlag>('SetupFlag', SetupFlagSchema);

const setupSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Check if setup has already been performed
    const setupCompleted = await SetupFlag.findOne({key: 'superAdminSetup'});
    if (setupCompleted && setupCompleted.value) {
      console.log('Super Admin setup has already been completed.');
      return;
    }

    const allPermissions = Object.values(Permission);

    const hashedPassword = await bcrypt.hash('supersecurepassword', 10);

    const superAdmin = await User.findOneAndUpdate(
      {userId: 'superadmin'},
      {
        userId: 'superadmin',
        email: 'superadmin@example.com',
        password: hashedPassword,
        permissions: allPermissions,
        isSuperAdmin: true,
        isAdmin: true,
      },
      {upsert: true, new: true},
    );

    if (superAdmin) {
      // Log the superAdmin with permissions
      console.log('Super Admin setup complete:', {
        ...superAdmin.toObject(),
        permissions: superAdmin.permissions,
      });

      // Mark setup as completed
      await SetupFlag.findOneAndUpdate(
        {key: 'superAdminSetup'},
        {key: 'superAdminSetup', value: true},
        {upsert: true},
      );
      console.log('Super Admin setup marked as completed.');
    }
  } catch (error) {
    console.error('Failed to set up Super Admin:', error);
  } finally {
    await mongoose.disconnect();
  }
};

export default setupSuperAdmin;
