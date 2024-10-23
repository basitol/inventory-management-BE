// validation.ts
import {body, param, query} from 'express-validator';

export const createInventoryValidation = [
  body('deviceType').notEmpty().withMessage('Device type is required'),
  body('brand').notEmpty().withMessage('Brand is required'),
  // ... other validations
];

export const getInventoryByIdValidation = [
  param('id').isMongoId().withMessage('Invalid inventory ID'),
];
