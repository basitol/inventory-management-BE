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
  getInventoryChangelog,
  getTotalSalesRevenue,
  getAverageRepairTime,
  getRevenueInDateRange,
  openStockForDay,
  closeStockForDay,
  logStatusChange,
  generateAndSendDailyReport,
  updateInventoryRepair,
  updateInventorySoldStatus,
  updateInventoryGeneral,
  getTotalSalesMetricsForCurrentMonth,
  processReturn,
  getInventoryByDeviceTypeOrStatus,
  updateStatusAndHandlePayments,
  getSalesForDate,
  completeRepairAndMakeAvailable,
  updatePricesAndMakeAvailable,
  openDailyStock,
  closeDailyStock,
  updateDailyStockTransactions,
  getDailyStockReport,
} from '../controllers/inventoryController';
import {getStockLogs, logDailyStock} from '../controllers/stockController';

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

// Route for getting inventory filtered by deviceType or status
router.get(
  '/inventory-filter',
  authenticate,
  authorize([Permission.ViewInventory, Permission.ManageInventory]),
  getInventoryByDeviceTypeOrStatus,
);

// Route for updating an inventory item
router.put(
  '/inventory/:id',
  authenticate,
  authorize([Permission.SetWarranty, Permission.ManageInventory]),
  updateInventory,
);

router.put(
  '/inventory/:id/update-repair',
  authenticate,
  authorize([Permission.ManageInventory]),
  updateInventoryRepair,
);

router.put(
  '/inventory/:id/complete-repair',
  authenticate,
  authorize([Permission.ManageInventory]),
  completeRepairAndMakeAvailable,
);

router.put(
  '/inventory/:id/status-payment',
  (req, res, next) => {
    console.log('Route hit:', req.path);
    next();
  },
  authenticate,
  authorize([Permission.ManageInventory]),
  updateStatusAndHandlePayments,
);
// Route for updating sold status and customer details
router.put(
  '/inventory/:id/update-sold-status',
  authenticate,
  authorize([Permission.ManageInventory]),
  updateInventorySoldStatus,
);

// Route for updating general inventory information
router.put(
  '/inventory/:id/update-general',
  authenticate,
  authorize([Permission.ManageInventory]),
  updateInventoryGeneral,
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
  getInventoryChangelog,
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

// Route to open stock for the day
router.post(
  '/inventory/open-stock',
  authenticate,
  authorize([Permission.ManageInventory]),
  openStockForDay,
);

// Route to close stock for the day
router.post(
  '/inventory/close-stock',
  authenticate,
  authorize([Permission.ManageInventory]),
  closeStockForDay,
);

// Route to log status changes
router.post(
  '/inventory/log-status',
  authenticate,
  authorize([Permission.ManageInventory]),
  logStatusChange,
);

// Route to generate and send daily report
router.post(
  '/inventory/daily-report',
  authenticate,
  authorize([Permission.ManageInventory]),
  generateAndSendDailyReport,
);

// New route to log daily stock summary at the end of the day
router.post(
  '/log-daily-stock',
  authenticate,
  authorize([Permission.ManageInventory]),
  logDailyStock,
);

// New route to get stock logs over time
router.get(
  '/stock-logs',
  authenticate,
  authorize([Permission.ViewInventory, Permission.ManageInventory]),
  getStockLogs,
);

// Route for getting metrics for the current month
router.get(
  '/metrics/current-month',
  authenticate,
  authorize([Permission.ManageInventory, Permission.ViewInventory]),
  getTotalSalesMetricsForCurrentMonth, // New route for metrics
);

// Route for processing a return
router.post(
  '/inventory/:itemId/return',
  authenticate,
  authorize([Permission.ManageInventory]),
  processReturn,
);

router.put(
  '/inventory/:id/update-prices',
  authenticate,
  authorize([Permission.ManageInventory, Permission.UpdatePrice]), // Ensure user has both permissions
  updatePricesAndMakeAvailable,
);

router.get('/sales-for-date', getSalesForDate);

// Daily Stock Management Routes
router.post('/daily-stock/open', authenticate, openDailyStock);
router.post('/daily-stock/close', authenticate, closeDailyStock);
router.post('/daily-stock/transactions', authenticate, updateDailyStockTransactions);
router.get('/daily-stock/report', authenticate, getDailyStockReport);

export default router;
