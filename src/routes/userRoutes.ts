import express from 'express';
import {
  createUser,
  createUserForMyCompany,
  getAllUsers,
  getCompanyUsersForAdmin,
  updateUser,
  updateProfile,
} from '../controllers/userController';
import authorize from '../middleware/authorize';
import authenticate from '../middleware/authenticate';
import {Permission} from '../models/User';

const router = express.Router();

router.post('/', authenticate, authorize([Permission.CreateStaff]), createUser);
router.put('/profile', authenticate, updateProfile);
router.put(
  '/:id',
  authenticate,
  authorize([Permission.ManageUsers]),
  updateUser,
);
router.post(
  '/company',
  authenticate,
  authorize([Permission.CreateStaff]),
  createUserForMyCompany,
);
router.get('/', authenticate, authorize([Permission.ManageUsers]), getAllUsers);
router.get(
  '/company',
  authenticate,
  authorize([Permission.ManageUsers]),
  getCompanyUsersForAdmin,
);

export default router;
