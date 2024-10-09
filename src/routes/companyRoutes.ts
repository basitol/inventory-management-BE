import express from 'express';
import {createCompany, getAllCompanies} from '../controllers/companyController';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import {Permission} from '../models/User'; // Import the Permission enum

const router = express.Router();

// Only authenticated users with 'createCompany' permission can create a company
router.post(
  '/',
  authenticate,
  authorize([Permission.CreateCompany]),
  createCompany,
);

// Only authenticated users can view all companies
router.get('/', authenticate, getAllCompanies);

export default router;
