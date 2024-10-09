import express from 'express';
import {createUser, getAllUsers} from '../controllers/userController';
import authorize from '../middleware/authorize';
import authenticate from '../middleware/authenticate';
import {Permission} from '../models/User'; // Import the Permission enum

const router = express.Router();

router.post('/', authenticate, authorize([Permission.CreateStaff]), createUser);
router.get('/', authorize([Permission.ManageUsers]), getAllUsers);

export default router;
