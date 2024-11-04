import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import User, {IUser} from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({message: 'No token, authorization denied'});
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {id: string};

    const user = await User.findById(decoded.id).populate('company'); // Ensure company info is populated
    if (!user) {
      return res.status(401).json({message: 'User not found'});
    }

    req.user = user; // Correctly set the user on the request object
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({message: 'Token is not valid'});
  }
};

export default authenticate;
