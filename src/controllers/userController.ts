import {Request, Response, NextFunction} from 'express';
import User, {IUser} from '../models/User';
import {Permission} from '../models/Permission';
import Company from '../models/Company';
import mongoose from 'mongoose';

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      userId,
      email,
      password,
      permissions,
      companyId,
      isAdmin,
      isSuperAdmin,
    } = req.body;

    if (!userId || !email || !password || !companyId) {
      return res
        .status(400)
        .json({error: 'userId, email, password, and companyId are required'});
    }

    // Check if the company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(400).json({error: 'Invalid company ID'});
    }

    console.log('Received permissions:', permissions);

    // Validate permissions
    const validPermissions = await Permission.find({name: {$in: permissions}});
    console.log(
      'Valid permissions found:',
      validPermissions.map(p => p.name),
    );

    if (validPermissions.length !== permissions.length) {
      console.log(
        'Mismatch in permissions count. Received:',
        permissions.length,
        'Valid:',
        validPermissions.length,
      );
      return res.status(400).json({
        error: 'Invalid permissions provided',
        receivedPermissions: permissions,
        validPermissions: validPermissions.map(p => p.name),
      });
    }

    const newUser: IUser = new User({
      userId,
      email,
      password,
      permissions: validPermissions.map(p => p._id),
      company: new mongoose.Types.ObjectId(companyId),
      isAdmin: isAdmin || false,
      isSuperAdmin: isSuperAdmin || false,
    });

    await newUser.save();

    // Create a safe user object without the password
    const safeUser = newUser.toObject();
    delete (safeUser as Partial<IUser>).password;

    // Replace permission ObjectIds with names for the response
    safeUser.permissions = validPermissions.map(p => p.name);

    res.status(201).json(safeUser);
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({error: 'A user with this userId or email already exists'});
    }
    next(error);
  }
};

// Get all users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await User.find().populate('company').select('-password');
    res.status(200).json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({error: error.message});
    next(error);
  }
};

// Get a single user by ID
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('company')
      .select('-password');
    if (!user) {
      return res.status(404).json({error: 'User not found'});
    }
    res.status(200).json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({error: error.message});
    next(error);
  }
};

// Update a user
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {permissions, company, isAdmin} = req.body;

    if (permissions) {
      // Validate permissions
      const validPermissions = await Permission.find({
        name: {$in: permissions},
      });
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({error: 'Invalid permissions provided'});
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {permissions, company, isAdmin},
      {new: true, runValidators: true},
    ).select('-password');

    if (!user) {
      return res.status(404).json({error: 'User not found'});
    }

    res.status(200).json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({error: error.message});
    next(error);
  }
};

// Delete a user
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({error: 'User not found'});
    }
    res.status(200).json({message: 'User deleted successfully'});
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({error: error.message});
    next(error);
  }
};
