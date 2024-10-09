// import {Request, Response, NextFunction} from 'express';
// import jwt from 'jsonwebtoken';
// import mongoose from 'mongoose';
// import User, {IUser} from '../models/User';
// import {getPermissionNames} from '../utils/cachePermissions';
// import {IPermission} from '../models/Permission';
// import {checkConnection} from '../config/db';
// import connectDB from '../config/db';

// export const login = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   const {userId, password} = req.body;

//   try {
//     console.log('Login attempt for userId:', userId);
//     console.log(checkConnection);

//     // Check if the database is connected
//     if (!checkConnection()) {
//       console.log('Database not connected. Attempting to reconnect...');
//       await connectDB();
//       if (!checkConnection()) {
//         throw new Error('Unable to connect to the database');
//       }
//     }

//     // Find the user and populate permissions
//     const user = await User.findOne({userId})
//       .select('+password')
//       .populate<{permissions: IPermission[]}>('permissions');

//     console.log('User found:', user ? 'Yes' : 'No');

//     if (!user) {
//       return res.status(401).json({message: 'Invalid credentials'});
//     }

//     console.log('Comparing passwords...');
//     console.log('Provided password:', password);
//     const isMatch = await user.comparePassword(password);
//     console.log('Password match:', isMatch);

//     if (!isMatch) {
//       return res.status(401).json({message: 'Invalid credentials'});
//     }

//     // Rest of the login logic remains the same...
//   } catch (error) {
//     console.error('Login error:', error);
//     next(error);
//   }
// };

import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, {IUser} from '../models/User';
import {getPermissionNames} from '../utils/cachePermissions';
import {IPermission} from '../models/Permission';
import {checkConnection} from '../config/db';
import connectDB from '../config/db';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {userId, password} = req.body;

  try {
    console.log('Login attempt for userId:', userId);

    // Check if the database is connected
    if (!checkConnection()) {
      console.log('Database not connected. Attempting to reconnect...');
      await connectDB();
      if (!checkConnection()) {
        throw new Error('Unable to connect to the database');
      }
    }

    // Find the user and populate permissions
    const user = await User.findOne({userId})
      .select('+password')
      .populate<{permissions: IPermission[]}>('permissions');

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({message: 'Invalid credentials'});
    }

    console.log('Comparing passwords...');
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({message: 'Invalid credentials'});
    }

    // Assert that permissions are of correct type
    const permissionIds = user.permissions.map(
      p => p._id,
    ) as mongoose.Types.ObjectId[];

    // Get permission names
    const permissionNames = getPermissionNames(permissionIds);
    console.log('User permissions by name:', permissionNames);

    const payload = {
      id: user._id,
      userId: user.userId,
      permissions: permissionNames, // Include permission names in payload
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    res.status(200).json({token});
    // Rest of the login logic remains the same...
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};
