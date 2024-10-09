import express from 'express';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import {Permission} from '../models/User'; // Import the Permission enum
import {
  createInventory,
  getInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
  getInventoryChangeLogs,
  getTotalSalesRevenue,
  getAverageRepairTime,
  getRevenueInDateRange,
} from '../controllers/inventoryController';

const router = express.Router();

// Route for creating inventory items
router.post(
  '/inventory',
  authenticate,
  authorize([Permission.SetWarranty, Permission.ManageInventory]),
  createInventory,
);

// Route for retrieving inventory items with pagination
router.get(
  '/inventory',
  authenticate,
  authorize([Permission.SetWarranty, Permission.ManageInventory]),
  getInventory,
);

// Route for retrieving a single inventory item by ID
router.get(
  '/inventory/:id',
  authenticate,
  authorize([Permission.SetWarranty, Permission.ManageInventory]),
  getInventoryById,
);

// Route for updating an inventory item
router.put(
  '/inventory/:id',
  authenticate,
  authorize([Permission.SetWarranty, Permission.ManageInventory]),
  updateInventory,
);

// Route for deleting an inventory item
router.delete(
  '/inventory/:id',
  authenticate,
  authorize([Permission.ManageInventory]),
  deleteInventory,
);

// Route for retrieving change logs for a specific inventory item
router.get(
  '/inventory/:id/changelogs',
  authenticate,
  authorize([
    Permission.SetWarranty,
    Permission.ManageInventory,
    Permission.ViewInventory,
  ]),
  getInventoryChangeLogs,
);

// Route for getting total sales revenue
router.get(
  '/inventory/sales/total-revenue',
  authenticate,
  authorize([Permission.ManageInventory, Permission.ViewInventory]),
  getTotalSalesRevenue,
);

// Route for getting average repair time
router.get(
  '/inventory/repairs/average-time',
  authenticate,
  authorize([Permission.ManageInventory, Permission.ViewInventory]),
  getAverageRepairTime,
);

// Route for getting revenue in date range
router.get(
  '/revenue-in-range',
  authenticate,
  authorize([Permission.ManageInventory, Permission.ViewInventory]),
  getRevenueInDateRange,
);

export default router;
