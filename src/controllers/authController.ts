import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import {ICompany} from 'models/Company';

// export const login = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   const {userId, password} = req.body;

//   try {
//     console.log('Login attempt for userId:', userId);

//     // Find the user
//     const user = await User.findOne({userId}).select('+password');

//     console.log('User found:', user ? 'Yes' : 'No');

//     if (!user) {
//       return res.status(401).json({message: 'Invalid credentials'});
//     }

//     console.log('Comparing passwords...');
//     const isMatch = await user.comparePassword(password);
//     console.log('Password match:', isMatch);

//     if (!isMatch) {
//       return res.status(401).json({message: 'Invalid credentials'});
//     }

//     // User permissions are now directly stored in the user document
//     console.log('User permissions:', user.permissions);

//     const payload = {
//       id: user._id,
//       userId: user.userId,
//       permissions: user.permissions,
//       isAdmin: user.isAdmin,
//       isSuperAdmin: user.isSuperAdmin,
//     };

//     const token = jwt.sign(payload, process.env.JWT_SECRET!, {
//       expiresIn: '1h',
//     });

//     res.status(200).json({token});
//   } catch (error) {
//     console.error('Login error:', error);
//     next(error);
//   }
// };

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {userId, password} = req.body;

  try {
    console.log('Login attempt for userId:', userId);

    // Find the user and populate company details
    const user = await User.findOne({userId})
      .select('+password')
      .populate('company', 'name'); // Populate company with only 'name' field

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

    // Use a type assertion to tell TypeScript that the company is populated
    const companyName =
      (user.company && (user.company as ICompany).name) || null;

    // Add user details to payload
    const payload = {
      id: user._id,
      userId: user.userId,
      name: user.name, // User name
      role: user.role, // User role
      permissions: user.permissions,
      companyName: companyName, // Company name
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '8h',
    });

    // Send response with the token and user info
    res.status(200).json({
      token,
      user: {
        name: user.name,
        role: user.role,
        companyName: companyName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};
