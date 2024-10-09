// import {Request, Response, NextFunction} from 'express';
// import User, {IUser} from '../models/User';
// import {IPermission} from '../models/Permission';

// interface AuthRequest extends Request {
//   user?: IUser;
// }

// const authorize = (requiredPermissions: string[]) => {
//   return async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) {
//         console.log('No user found in request.');
//         return res.status(401).json({message: 'Unauthorized'});
//       }

//       // Populate the permissions with their full documents
//       const user = await User.findById(req.user._id).populate<{
//         permissions: IPermission[];
//       }>('permissions');

//       if (!user) {
//         return res.status(401).json({message: 'Unauthorized'});
//       }

//       const userPermissions = user.permissions.map(
//         permission => permission.name,
//       );
//       const hasPermission = requiredPermissions.every(permission =>
//         userPermissions.includes(permission),
//       );

//       console.log('User permissions:', userPermissions);
//       console.log('Required permissions:', requiredPermissions);
//       console.log('Has permission:', hasPermission);

//       if (!hasPermission) {
//         return res.status(403).json({message: 'Forbidden'});
//       }

//       next();
//     } catch (err) {
//       console.error('Authorization error:', err);
//       return res.status(401).json({message: 'Unauthorized'});
//     }
//   };
// };

// export default authorize;

import {Request, Response, NextFunction} from 'express';
import User, {IUser, Permission} from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

const authorize = (requiredPermissions: Permission[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        console.log('No user found in request.');
        return res.status(401).json({message: 'Unauthorized'});
      }

      // Fetch the user with permissions
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(401).json({message: 'Unauthorized'});
      }

      const userPermissions = user.permissions;
      const hasPermission = requiredPermissions.every(permission =>
        userPermissions.includes(permission),
      );

      console.log('User permissions:', userPermissions);
      console.log('Required permissions:', requiredPermissions);
      console.log('Has permission:', hasPermission);

      if (!hasPermission) {
        return res.status(403).json({message: 'Forbidden'});
      }

      next();
    } catch (err) {
      console.error('Authorization error:', err);
      return res.status(401).json({message: 'Unauthorized'});
    }
  };
};

export default authorize;
