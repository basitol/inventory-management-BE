import {NextFunction, Response} from 'express';
import Inventory, {IInventory} from '../models/Inventory';
import {AuthRequest} from '../middleware/authenticate';
import InventoryChangeLog from '../models/InventoryChangeLog';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

import {
  revenueInDateRange,
  totalSalesRevenue,
  totalNetProfit,
  totalGadgetsSold,
  averageSellingPrice,
  totalRepairs,
  averageRepairTime,
  totalRepairCosts,
  totalInventoryCount,
  totalAvailableDevices,
  newTotalSalesRevenue,
  newAverageRepairTime,
  newTotalRepairCosts,
  newTotalNetProfit,
} from '../services/analyticsService';
import {validationResult} from 'express-validator';
import Return from '../models/Return';
import {ObjectId} from 'mongodb';

type CompanyIdType =
  | string
  | number
  | mongoose.Types.ObjectId
  | mongoose.Types.ObjectId
  | Uint8Array;

// Helper function to validate companyId
const validateCompanyId = (companyId: unknown): companyId is CompanyIdType => {
  if (typeof companyId === 'string' || typeof companyId === 'number') {
    return mongoose.Types.ObjectId.isValid(companyId);
  }
  if (companyId instanceof mongoose.Types.ObjectId) {
    return true;
  }
  if (companyId instanceof Uint8Array) {
    return companyId.length === 12;
  }
  if (
    typeof companyId === 'object' &&
    companyId !== null &&
    'id' in companyId
  ) {
    return mongoose.Types.ObjectId.isValid(
      (companyId as mongoose.Types.ObjectId).id,
    );
  }
  return false;
};

// Get all inventory items with pagination
export const getInventory = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Inventory.countDocuments({company: req.user?.company});
    const items = await Inventory.find({company: req.user?.company})
      .skip(startIndex)
      .limit(limit);

    console.log(req.user);

    res.json({
      items,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

// Get single inventory item
export const getInventoryById = async (req: AuthRequest, res: Response) => {
  try {
    console.log(req.params.id);
    const item = await Inventory.findById(req.params.id);
    if (
      item &&
      item.company.toString() === req.user?.company?._id?.toString()
    ) {
      res.json(item);
    } else {
      res.status(404).json({message: 'Item not found or not authorized'});
    }
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

// Create an inventory item
export const createInventory = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({errors: errors.array()});
  }

  try {
    if (!req.user?.company) {
      return res
        .status(400)
        .json({message: 'User is not associated with a company'});
    }

    const {
      deviceType,
      brand,
      modelName,
      serialNumber,
      name,
      purchasePrice,
      sellingPrice,
      condition,
      status,
      storageCapacity,
      roughness,
      faceId,
      idm,
      ibm,
      icm,
      touchId,
      fault,
      screenSize,
      processorType,
      ramSize,
      bluetoothVersion,
      batteryLife,
      generation,
      storage,
      accessories,
      notes,
      specifications,
    } = req.body;

    const item = new Inventory({
      deviceType,
      brand,
      modelName,
      serialNumber,
      name,
      purchasePrice,
      sellingPrice,
      condition,
      status: status || 'Available',
      company: req.user.company,
      storageCapacity,
      roughness,
      faceId,
      idm,
      ibm,
      icm,
      touchId,
      fault,
      screenSize,
      processorType,
      ramSize,
      bluetoothVersion,
      batteryLife,
      generation,
      storage,
      accessories,
      notes,
      specifications,
    });

    console.log('Attempting to save item:', item);

    const createdItem = await item.save();
    res.status(201).json(createdItem);
  } catch (error: any) {
    console.error(error);
    if (error.code === 11000) {
      // Check if the error is due to a duplicate serialNumber for the same company
      if (
        error.keyPattern &&
        error.keyPattern.serialNumber &&
        error.keyPattern.company
      ) {
        res.status(400).json({
          message:
            'An item with this serial number already exists for this company.',
          error: error.message,
        });
      } else {
        res.status(400).json({
          message: 'Duplicate key error. Please check all unique fields.',
          error: error.message,
        });
      }
    } else {
      res.status(500).json({message: 'Server Error', error: error.message});
    }
  }
};

// Update an inventory item
export const updateInventory = async (req: AuthRequest, res: Response) => {
  try {
    // Find the inventory item by ID
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({message: 'Item not found'});
    }

    // Check if the user is authorized to update this item
    if (item.company.toString() !== req.user?.company?._id?.toString()) {
      return res
        .status(403)
        .json({message: 'Not authorized to update this item'});
    }

    // Prepare the update data from request body
    const updateData = {...req.body, _user: req.user?._id};

    // Remove any undefined or null values from the update data
    Object.keys(updateData).forEach(key => {
      if (
        updateData[key as keyof IInventory] === undefined ||
        updateData[key as keyof IInventory] === null
      ) {
        delete updateData[key as keyof IInventory];
      }
    });

    // Perform the update
    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      {$set: updateData}, // Use $set operator to define update fields
      {
        new: true, // Return the updated document
        runValidators: true, // Validate before applying the update
      },
    );

    if (!updatedItem) {
      return res.status(404).json({message: 'Item not found after update'});
    }

    // Respond with the updated item
    res.json(updatedItem);
  } catch (error) {
    console.error('Error in updateInventory:', error);

    if (error instanceof mongoose.Error.ValidationError) {
      // Handle validation errors
      const messages = Object.values(error.errors).map(err => err.message);
      return res
        .status(400)
        .json({message: 'Validation Error', errors: messages});
    } else if (error instanceof mongoose.Error.CastError) {
      // Handle invalid ID format errors
      return res.status(400).json({message: 'Invalid ID format'});
    }

    // Handle any other errors
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

// Update inventory item repair status
export const updateInventoryRepair = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {id} = req.params;
    const {repairStatus, repairHistoryEntry} = req.body;

    const updatedItem = await Inventory.findOneAndUpdate(
      {_id: id, company: req.user?.company?._id},
      {
        $set: {
          repairStatus: repairStatus,
          _user: req.user?._id, // Add user ID for changelog
        },
        $push: repairHistoryEntry ? {repairHistory: repairHistoryEntry} : {},
      },
      {new: true, runValidators: true},
    );

    if (!updatedItem) {
      return res
        .status(404)
        .json({message: 'Item not found or not authorized'});
    }

    res.json(updatedItem);
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

// update inventory item sold status
export const updateInventorySoldStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {id} = req.params;
    const {status, salesDate, customerDetails, sellingPrice} = req.body;

    const updatedItem = await Inventory.findOneAndUpdate(
      {_id: id, company: req.user?.company?._id},
      {
        $set: {
          status,
          salesDate: salesDate || new Date(),
          sellingPrice,
          customerDetails,
          _user: req.user?._id, // Add user ID for changelog
        },
      },
      {new: true, runValidators: true},
    );

    if (!updatedItem) {
      return res
        .status(404)
        .json({message: 'Item not found or not authorized'});
    }

    res.json(updatedItem);
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

// delete inventory item
export const deleteInventory = async (req: AuthRequest, res: Response) => {
  try {
    const deletedItem = await Inventory.findOneAndDelete({
      _id: req.params.id,
      company: req.user?.company?._id,
    });

    if (!deletedItem) {
      return res
        .status(404)
        .json({message: 'Item not found or not authorized'});
    }

    res.json({message: 'Item removed'});
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

export const updateInventoryGeneral = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {id} = req.params;
    const {name, modelName, brand, specifications, notes} = req.body;

    const updatedItem = await Inventory.findOneAndUpdate(
      {_id: id, company: req.user?.company?._id},
      {
        $set: {
          name,
          modelName,
          brand,
          specifications,
          notes,
          _user: req.user?._id, // Add user ID for changelog
        },
      },
      {new: true, runValidators: true},
    );

    if (!updatedItem) {
      return res
        .status(404)
        .json({message: 'Item not found or not authorized'});
    }

    res.json(updatedItem);
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

// Search inventory items
export const searchInventory = async (req: AuthRequest, res: Response) => {
  try {
    const {query} = req.query;
    const items = await Inventory.find({
      company: req.user?.company,
      $or: [
        {name: {$regex: query, $options: 'i'}},
        {imei: {$regex: query, $options: 'i'}},
      ],
    });
    res.json(items);
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

// Fetch change logs for a specific inventory item
export const getInventoryChangeLogs = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {id} = req.params;

    // Find change logs for the specific inventory item
    const changeLogs = await InventoryChangeLog.find({inventory: id})
      .populate('user', 'userId email') // Populate user details (userId and email)
      .sort({changeDate: -1}); // Sort logs by date, most recent first

    if (!changeLogs || changeLogs.length === 0) {
      return res
        .status(404)
        .json({message: 'No change logs found for this item.'});
    }

    res.status(200).json(changeLogs);
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

// Get average repair time
export const getAverageRepairTime = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.company?._id;
    if (!companyId || !validateCompanyId(companyId)) {
      return res.status(400).json({message: 'Valid Company ID is required'});
    }
    const objectId = new mongoose.Types.ObjectId(companyId);
    const averageTime = await averageRepairTime(objectId); // Convert companyId to ObjectId
    res.status(200).json({averageRepairTime: averageTime});
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

// Get total sales revenue
export const getTotalSalesRevenue = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.company?._id;
    if (!companyId || !validateCompanyId(companyId)) {
      return res.status(400).json({message: 'Valid Company ID is required'});
    }
    const objectId = new mongoose.Types.ObjectId(companyId); // Convert companyId to ObjectId
    const revenue = await totalSalesRevenue(objectId); // Use objectId instead
    const netProfit = await totalNetProfit(objectId); // Use objectId instead
    res.status(200).json({totalRevenue: revenue, netProfit: netProfit});
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

// Get total metrics for the current month
export const getTotalSalesMetricsForCurrentMonth = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const companyId = req.user?.company?._id;
    if (!companyId || !validateCompanyId(companyId)) {
      return res.status(400).json({message: 'Valid Company ID is required'});
    }
    const objectId = new mongoose.Types.ObjectId(companyId); // Convert companyId to ObjectId

    // Get the start and end dates of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // First day of the month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1); // First day of the next month

    console.log(startOfMonth, endOfMonth);

    // Fetch all the metrics for the current month
    const revenue = await newTotalSalesRevenue(
      objectId,
      startOfMonth,
      endOfMonth,
    );
    const netProfit = await newTotalNetProfit(
      objectId,
      startOfMonth,
      endOfMonth,
    );
    const gadgetsSold = await totalGadgetsSold(
      objectId,
      startOfMonth,
      endOfMonth,
    );
    const avgSellingPrice = await averageSellingPrice(
      objectId,
      startOfMonth,
      endOfMonth,
    );
    const repairCount = await totalRepairs(objectId, startOfMonth, endOfMonth);
    const avgRepairTime = await newAverageRepairTime(
      objectId,
      startOfMonth,
      endOfMonth,
    );
    const repairCost = await newTotalRepairCosts(
      objectId,
      startOfMonth,
      endOfMonth,
    );
    const inventoryCount = await totalInventoryCount(objectId); // Inventory count can be all-time
    const availableDevices = await totalAvailableDevices(objectId); // Available devices are real-time

    // Respond with all the metrics
    res.status(200).json({
      totalRevenue: revenue,
      netProfit: netProfit,
      totalGadgetsSold: gadgetsSold,
      averageSellingPrice: avgSellingPrice,
      totalRepairs: repairCount,
      averageRepairTime: avgRepairTime,
      totalRepairCosts: repairCost,
      totalInventoryCount: inventoryCount,
      totalAvailableDevices: availableDevices,
    });
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

// Get revenue in date range
export const getRevenueInDateRange = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const companyId = req.user?.company?._id;
    if (!companyId || !validateCompanyId(companyId)) {
      return res.status(400).json({message: 'Valid Company ID is required'});
    }

    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({message: 'Invalid date format'});
    }

    const objectId = new mongoose.Types.ObjectId(companyId);
    const revenue = await revenueInDateRange(objectId, startDate, endDate);
    res.status(200).json({revenueInRange: revenue});
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

export const openStockForDay = async (req: AuthRequest, res: Response) => {
  try {
    // Reset the necessary fields to start fresh for the day
    await Inventory.updateMany(
      {status: {$in: ['Available', 'In Stock']}},
      {$set: {dailySold: 0}},
    );

    // Log the opening time for auditing
    const openingTime = new Date();

    return res.status(200).json({
      message: 'Stock opened for the day successfully',
      openingTime,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error opening stock for the day',
      error,
    });
  }
};

// close stock for the day
export const closeStockForDay = async (req: AuthRequest, res: Response) => {
  try {
    // Get all items that were sold today
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const soldItems = await Inventory.find({
      status: 'Sold',
      salesDate: {$gte: todayStart},
    });

    // Get items collected but unpaid
    const collectedUnpaid = await Inventory.find({
      status: 'Collected (Unpaid)',
    });

    // Generate a summary report
    const report = {
      totalSales: soldItems.length,
      collectedButUnpaid: collectedUnpaid.length,
      closingTime: new Date(),
    };

    return res.status(200).json({
      message: 'Stock closed for the day successfully',
      report,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error closing stock for the day',
      error,
    });
  }
};

// open stock for the day
export const logStatusChange = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const {inventoryId, newStatus, userId} = req.body;

  try {
    const inventoryItem = await Inventory.findById(inventoryId);

    if (!inventoryItem) {
      return res.status(404).json({message: 'Inventory item not found'});
    }

    // Add the status change log
    inventoryItem.statusLogs.push({
      status: newStatus,
      date: new Date(),
      changedBy: userId,
    });

    inventoryItem.status = newStatus;

    await inventoryItem.save();

    next();
  } catch (error) {
    return res.status(500).json({
      message: 'Error logging status change',
      error,
    });
  }
};

// send daily report
export const generateAndSendDailyReport = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const soldItems = await Inventory.find({
      status: 'Sold',
      salesDate: {$gte: todayStart},
    });

    const collectedUnpaid = await Inventory.find({
      status: 'Collected (Unpaid)',
    });

    const report = {
      totalSales: soldItems.length,
      collectedButUnpaid: collectedUnpaid.length,
      closingTime: new Date(),
    };

    // Email the report
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password',
      },
    });

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: 'admin@example.com',
      subject: 'Daily Stock Report',
      text: `Report: ${JSON.stringify(report)}`,
    };

    transporter.sendMail(mailOptions, (error: Error | null, info: any) => {
      if (error) {
        return res
          .status(500)
          .json({message: 'Error sending report email', error});
      } else {
        return res
          .status(200)
          .json({message: 'Daily report generated and sent', info});
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error generating daily report',
      error,
    });
  }
};

export const processReturn = async (req: AuthRequest, res: Response) => {
  const {itemId} = req.params;
  const {refundAmount, refundType, reason} = req.body;

  const item = await Inventory.findById(itemId);
  if (!item || item.company.toString() !== (req.user?.company?._id as string)) {
    return res.status(404).json({message: 'Item not found or not authorized'});
  }

  // Create a Return record
  const returnRecord = new Return({
    inventory: item._id,
    refundAmount,
    refundType,
    returnDate: new Date(),
    reason,
    refundedBy: {
      _id: req.user ? req.user._id : null, // Check if req.user is defined
      name: req.user ? req.user.name : 'Unknown', // Provide a default value if undefined
    },
  });
  await returnRecord.save();

  // Update the inventory item
  if (refundType === 'Full') {
    item.status = 'Available'; // Or 'Returned' based on your workflow
    item.salesDate = undefined;
    item.sellingPrice = undefined;
  } else {
    // For partial refunds, status might remain 'Sold'
    // Adjust selling price to reflect the refund
    if (item.sellingPrice !== undefined) {
      item.sellingPrice -= refundAmount;
    }
  }
  item.returns.push(returnRecord._id as ObjectId); // Type assertion added
  await item.save();

  res
    .status(200)
    .json({message: 'Return processed successfully', returnRecord});
};

// export const getInventoryByDeviceTypeOrStatus = async (
//   req: AuthRequest,
//   res: Response,
// ) => {
//   try {
//     const {deviceType, status} = req.query; // Query parameters for filtering
//     const companyId = req.user?.company?._id;

//     console.log(req.query);

//     if (!companyId) {
//       return res
//         .status(400)
//         .json({message: 'User is not associated with a company'});
//     }

//     // Build the query object dynamically based on parameters
//     const query: any = {
//       company: companyId,
//     };

//     if (deviceType) {
//       query.deviceType = deviceType; // Apply deviceType filter if provided
//     }

//     if (status) {
//       query.status = status; // Apply status filter if provided
//     }

//     // Execute the query
//     const items = await Inventory.find(query);

//     res.status(200).json(items);
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({message: 'Server error', error: (error as Error).message});
//   }
// };

// export const getInventoryByDeviceTypeOrStatus = async (
//   req: AuthRequest,
//   res: Response,
// ) => {
//   try {
//     const {deviceType, status} = req.query;
//     const companyId = req.user?.company?._id;

//     console.log('Query parameters:', req.query);

//     if (!companyId) {
//       return res
//         .status(400)
//         .json({message: 'User is not associated with a company'});
//     }

//     // Build the query object dynamically based on parameters
//     const query: any = {
//       company: companyId,
//     };

//     if (deviceType && typeof deviceType === 'string') {
//       query.deviceType = deviceType;
//     }

//     if (status && typeof status === 'string') {
//       query.status = status;
//     }

//     console.log('Constructed query:', query);

//     // Execute the query
//     const items = await Inventory.find(query);

//     console.log(`Found ${items.length} items`);

//     res.status(200).json(items);
//   } catch (error) {
//     console.error('Error in getInventoryByDeviceTypeOrStatus:', error);
//     res
//       .status(500)
//       .json({message: 'Server error', error: (error as Error).message});
//   }
// };

export const getInventoryByDeviceTypeOrStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  console.log('getInventoryByDeviceTypeOrStatus called');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Request query:', req.query);

  try {
    const {deviceType, status} = req.query;
    const companyId = req.user?.company?._id;

    console.log('Company ID:', companyId);

    if (!companyId) {
      return res
        .status(400)
        .json({message: 'User is not associated with a company'});
    }

    // Build the query object dynamically based on parameters
    const query: any = {
      company: companyId,
    };

    if (deviceType && typeof deviceType === 'string') {
      query.deviceType = deviceType;
    }

    if (status && typeof status === 'string') {
      query.status = status;
    }

    console.log('Constructed query:', query);

    // Execute the query
    const items = await Inventory.find(query);

    console.log(`Found ${items.length} items`);

    res.status(200).json(items);
  } catch (error) {
    console.error('Error in getInventoryByDeviceTypeOrStatus:', error);
    res
      .status(500)
      .json({message: 'Server error', error: (error as Error).message});
  }
};
