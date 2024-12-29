import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

// Validation for transaction updates
export const validateDailyStockTransaction = [
  body('transactionType')
    .isIn(['sale', 'repair', 'repair_complete', 'return', 'new_addition'])
    .withMessage('Invalid transaction type'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a non-negative number'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation for daily stock opening/closing
export const validateDailyStockOperation = [
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
