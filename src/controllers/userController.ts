import {Request, Response, NextFunction} from 'express';
import User, {IUser, Permission} from '../models/User';
import Company from '../models/Company';
import mongoose from 'mongoose';

interface RequestWithUser extends Request {
  user?: IUser;
}

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      userId,
      name,
      email,
      password,
      permissions,
      companyId,
      isAdmin,
      isSuperAdmin,
    } = req.body;

    console.log(req.body);

    if (!userId || !email || !password || !companyId || !name) {
      return res.status(400).json({
        error: 'userId, name, email, password, and companyId are required',
      });
    }

    // Check if the company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(400).json({error: 'Invalid company ID'});
    }

    console.log('Received permissions:', permissions);

    // Validate permissions
    const validPermissions = permissions.filter((p: string) =>
      Object.values(Permission).includes(p as Permission),
    );

    console.log('Valid permissions:', validPermissions);

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
        validPermissions: validPermissions,
      });
    }

    const newUser: IUser = new User({
      userId,
      email,
      name,
      password,
      permissions: validPermissions as Permission[],
      company: new mongoose.Types.ObjectId(companyId),
      isAdmin: isAdmin || false,
      isSuperAdmin: isSuperAdmin || false,
    });

    await newUser.save();

    // Create a safe user object without the password
    const safeUser = newUser.toObject();
    delete (safeUser as Partial<IUser>).password;

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

interface RequestWithUser extends Request {
  user?: IUser;
}

export const createUserForMyCompany = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {userId, email, password, permissions, isAdmin, isSuperAdmin} =
      req.body;

    if (!userId || !email || !password) {
      return res
        .status(400)
        .json({error: 'userId, email, and password are required'});
    }

    // Get the company ID from the authenticated user
    const companyId = req.user?.company;

    if (!companyId) {
      return res.status(400).json({error: 'Unable to determine company ID'});
    }

    // Check if the company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(400).json({error: 'Invalid company ID'});
    }

    console.log('Received permissions:', permissions);

    // Validate permissions
    const validPermissions = permissions.filter((p: string) =>
      Object.values(Permission).includes(p as Permission),
    );

    console.log('Valid permissions:', validPermissions);

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
        validPermissions: validPermissions,
      });
    }

    // Cast companyId as an ObjectId
    const newUser: IUser = new User({
      userId,
      email,
      password,
      permissions: validPermissions as Permission[],
      company: new mongoose.Types.ObjectId(companyId.toString()), // Ensure company is an ObjectId
      isAdmin: isAdmin || false,
      isSuperAdmin: isSuperAdmin || false,
    });

    await newUser.save();

    // Create a safe user object without the password
    const safeUser = newUser.toObject();
    delete (safeUser as Partial<IUser>).password;

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

export const getUsersByCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {companyId} = req.params;

    if (!companyId) {
      return res.status(400).json({error: 'Company ID is required'});
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({error: 'Invalid company ID format'});
    }

    const users = await User.find({company: companyId})
      .populate('company')
      .select('-password');

    res.status(200).json(users);
  } catch (error: any) {
    console.error('Error fetching users by company:', error);
    res.status(500).json({error: error.message});
    next(error);
  }
};

export const getCompanyUsersForAdmin = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({message: 'User not authenticated'});
    }

    const users = await User.find({company: req.user.company})
      .select('-password')
      .populate('company', 'name');

    res.status(200).json(users);
  } catch (error: any) {
    console.error('Error fetching company users for admin:', error);
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

// export const updateUser = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const {permissions, company, isAdmin, isSuperAdmin} = req.body;

//     let updateData: Partial<IUser> = {};

//     if (permissions) {
//       // Validate permissions
//       const validPermissions = permissions.filter((p: string) =>
//         Object.values(Permission).includes(p as Permission),
//       );

//       if (validPermissions.length !== permissions.length) {
//         return res.status(400).json({
//           error: 'Invalid permissions provided',
//           receivedPermissions: permissions,
//           validPermissions: validPermissions,
//         });
//       }

//       updateData.permissions = validPermissions as Permission[];
//     }

//     if (company) {
//       updateData.company = new mongoose.Types.ObjectId(company);
//     }

//     if (typeof isAdmin === 'boolean') {
//       updateData.isAdmin = isAdmin;
//     }

//     if (typeof isSuperAdmin === 'boolean') {
//       updateData.isSuperAdmin = isSuperAdmin;
//     }

//     const user = await User.findByIdAndUpdate(req.params.id, updateData, {
//       new: true,
//       runValidators: true,
//     }).select('-password');

//     if (!user) {
//       return res.status(404).json({error: 'User not found'});
//     }

//     res.status(200).json(user);
//   } catch (error: any) {
//     console.error('Error updating user:', error);
//     res.status(500).json({error: error.message});
//     next(error);
//   }
// };

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      permissions,
      company,
      isAdmin,
      isSuperAdmin,
      email,
      name,
      role,
      userId,
    } = req.body;
    const userIdParam = req.params.id;
    console.log(userIdParam);

    // Check if user exists
    const existingUser = await User.findById(userIdParam);
    if (!existingUser) {
      return res.status(404).json({error: 'User not found'});
    }

    let updateData: Partial<IUser> = {};

    // Update userId
    if (userId && userId !== existingUser.userId) {
      const userIdExists = await User.findOne({userId});
      if (userIdExists) {
        return res.status(400).json({error: 'User ID already in use'});
      }
      updateData.userId = userId.trim().toLowerCase();
    }

    // Update permissions
    if (permissions) {
      const validPermissions = permissions.filter((p: string) =>
        Object.values(Permission).includes(p as Permission),
      );

      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({
          error: 'Invalid permissions provided',
          receivedPermissions: permissions,
          validPermissions: validPermissions,
        });
      }

      updateData.permissions = validPermissions as Permission[];
    }

    // Update company
    if (company) {
      if (!mongoose.Types.ObjectId.isValid(company)) {
        return res.status(400).json({error: 'Invalid company ID'});
      }
      updateData.company = new mongoose.Types.ObjectId(company);
    }

    // Update admin status
    if (typeof isAdmin === 'boolean') {
      updateData.isAdmin = isAdmin;
    }

    // Update super admin status
    if (typeof isSuperAdmin === 'boolean') {
      updateData.isSuperAdmin = isSuperAdmin;
    }

    // Update email
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({email});
      if (emailExists) {
        return res.status(400).json({error: 'Email already in use'});
      }
      updateData.email = email.trim().toLowerCase();
    }

    // Update name
    if (name) {
      updateData.name = name.trim();
    }

    // Update role
    if (role) {
      updateData.role = role.trim();
    }

    // Perform the update
    const updatedUser = await User.findByIdAndUpdate(userIdParam, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({error: 'User not found'});
    }

    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({error: 'Internal server error'});
    next(error);
  }
};

export const updateProfile = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      permissions,
      company,
      isAdmin,
      isSuperAdmin,
      email,
      name,
      role,
      userId,
    } = req.body;

    const loggedInUserId = req.user?._id;

    if (!loggedInUserId) {
      return res.status(401).json({error: 'User not authenticated'});
    }

    const existingUser = await User.findById(loggedInUserId);
    if (!existingUser) {
      return res.status(404).json({error: 'User not found'});
    }

    const updateData: Partial<IUser> = {};
    const isAdminUser = existingUser.isAdmin || existingUser.isSuperAdmin;

    // Regular user updates
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({email});
      if (emailExists) {
        return res.status(400).json({error: 'Email already in use'});
      }
      updateData.email = email.trim().toLowerCase();
    }

    if (name) {
      updateData.name = name.trim();
    }

    // Admin-only updates
    if (isAdminUser) {
      if (userId && userId !== existingUser.userId) {
        const userIdExists = await User.findOne({userId});
        if (userIdExists) {
          return res.status(400).json({error: 'User ID already in use'});
        }
        updateData.userId = userId.trim().toLowerCase();
      }

      if (permissions) {
        const validPermissions = permissions.filter((p: string) =>
          Object.values(Permission).includes(p as Permission),
        );
        if (validPermissions.length !== permissions.length) {
          return res.status(400).json({
            error: 'Invalid permissions provided',
            receivedPermissions: permissions,
            validPermissions: validPermissions,
          });
        }
        updateData.permissions = validPermissions as Permission[];
      }

      if (company) {
        if (!mongoose.Types.ObjectId.isValid(company)) {
          return res.status(400).json({error: 'Invalid company ID'});
        }
        updateData.company = new mongoose.Types.ObjectId(company);
      }

      if (role) {
        updateData.role = role.trim();
      }
    }

    // Super admin-only updates
    if (existingUser.isSuperAdmin) {
      if (typeof isAdmin === 'boolean') {
        updateData.isAdmin = isAdmin;
      }
      if (typeof isSuperAdmin === 'boolean') {
        updateData.isSuperAdmin = isSuperAdmin;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({error: 'No valid updates provided'});
    }

    const updatedUser = await User.findByIdAndUpdate(
      loggedInUserId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({error: 'User not found'});
    }

    console.log(updatedUser);

    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({error: 'Internal server error'});
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
