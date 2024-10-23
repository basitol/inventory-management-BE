import {IUser} from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      // user?: any; // Add any custom properties here
      query?: any;
      body?: any;
      params?: any;
    }
  }
}
