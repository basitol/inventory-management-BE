import {NextFunction, Response} from 'express';
import Inventory, {IInventory} from '../models/Inventory';
import {AuthRequest} from '../middleware/authenticate';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

interface BankDetail {
  amount: number;
  paymentMethod: string;
  bankName?: string;
  accountNumber?: string;
  date: Date;
}

interface InstallmentPayment {
  amountPaid: number;
  date: Date;
  paymentMethod: string;
  bankName?: string;
  description?: string;
}

interface CustomerDetails {
  name: string;
  contact: string;
}

interface CollectorInfo {
  name: string;
  contact: string;
}

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
  totalReturns,
  totalCollectedUnpaid,
} from '../services/analyticsService';
import {validationResult} from 'express-validator';
import Return from '../models/Return';
import {ObjectId} from 'mongodb';
import DailyStock, { IDailyStock } from '../models/DailyStock'; // Import the DailyStock model and interface
import { ICompany } from 'models/Company';

type CompanyIdType =
  | string
  | number
  | mongoose.Types.ObjectId
  | mongoose.Types.ObjectId
  | Uint8Array;

const logChanges = (
  originalItem: any,
  updatedFields: Record<string, any>,
  user: any,
) => {
  const changes: any[] = [];

  Object.entries(updatedFields).forEach(([field, newValue]) => {
    if (originalItem[field] !== newValue) {
      changes.push({
        field,
        oldValue: originalItem[field],
        newValue,
        changedBy: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        changeDate: new Date(),
      });
    }
  });

  return changes;
};

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

// Helper function to update daily stock transactions
const updateDailyTransactions = async (
  req: AuthRequest,
  transactionType: string,
  quantity: number = 1,
  amount: number = 0
): Promise<{ success: boolean; message?: string }> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyStock = await DailyStock.findOne({
    company: req.user?.company,
    date: today
  });

  if (!dailyStock) {
    return {
      success: false,
      message: 'Daily stock has not been opened yet. Please open daily stock first.'
    };
  }

  if (dailyStock.closingTime) {
    return {
      success: false,
      message: 'Daily stock has been closed. No further transactions can be processed today.'
    };
  }

  switch (transactionType) {
    case 'sale':
      dailyStock.transactions.sales += quantity;
      dailyStock.cashFlow.sales += amount;
      dailyStock.cashFlow.total += amount;
      break;
    case 'repair':
      dailyStock.transactions.repairs.sent += quantity;
      dailyStock.cashFlow.repairs += amount;
      dailyStock.cashFlow.total += amount;
      break;
    case 'repair_complete':
      dailyStock.transactions.repairs.completed += quantity;
      break;
    case 'return':
      dailyStock.transactions.returns += quantity;
      break;
    case 'new_addition':
      dailyStock.transactions.newAdditions += quantity;
      break;
  }

  await dailyStock.save();
  return { success: true };
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

    return res.status(200).json({
      success: true,
      message: 'Inventory items retrieved successfully',
      data: {
        items,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching inventory',
      error: (error as Error).message
    });
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
      return res.status(200).json({
        success: true,
        message: 'Item found successfully',
        data: item
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Item not found or not authorized'
      });
    }
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching inventory item',
      error: (error as Error).message
    });
  }
};

// Create an inventory item
export const createInventory = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: errors.array()
    });
  }

  try {
    if (!req.user?.company) {
      return res
        .status(400)
        .json({success: false, message: 'User is not associated with a company'});
    }

    const {
      deviceType,
      brand,
      modelName,
      serialNumber,
      name,
      // purchasePrice,
      // sellingPrice,
      condition,
      color,
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
      // purchasePrice,
      // sellingPrice,
      condition,
      status: 'In Stock',
      company: req.user.company,
      storageCapacity,
      roughness,
      color,
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
    return res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: createdItem
    });
  } catch (error: any) {
    console.error(error);
    if (error.code === 11000) {
      // Check if the error is due to a duplicate serialNumber for the same company
      if (
        error.keyPattern &&
        error.keyPattern.serialNumber &&
        error.keyPattern.company
      ) {
        return res.status(400).json({
          success: false,
          message:
            'An item with this serial number already exists for this company.',
          error: error.message,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Duplicate key error. Please check all unique fields.',
          error: error.message,
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message
      });
    }
  }
};

export const updatePricesAndMakeAvailable = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {id} = req.params;
    const {purchasePrice, sellingPrice} = req.body;

    const item = await Inventory.findById(id);
    const companyId = req.user?.company?._id as mongoose.Types.ObjectId;

    if (!item || !companyId || !item.company.equals(companyId)) {
      return res.status(404).json({
        success: false,
        message: 'Item not found or unauthorized'
      });
    }

    const updates = {purchasePrice, sellingPrice, status: 'Available'};
    const changes = logChanges(item, updates, req.user);

    Object.assign(item, updates);
    item.changeHistory.push(...changes);

    const updatedItem = await item.save();
    return res.json({
      success: true,
      message: 'Item updated',
      data: updatedItem
    });
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'Server Error';
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: errorMessage
    });
  }
};

export const updateInventory = async (req: AuthRequest, res: Response) => {
  try {
    // Find the inventory item by ID
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if the user is authorized to update this item
    if (item.company.toString() !== req.user?.company?._id?.toString()) {
      return res
        .status(403)
        .json({success: false, message: 'Not authorized to update this item'});
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
      return res.status(404).json({
        success: false,
        message: 'Item not found after update'
      });
    }

    // Respond with the updated item
    return res.json({
      success: true,
      message: 'Item updated',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error in updateInventory:', error);

    if (error instanceof mongoose.Error.ValidationError) {
      // Handle validation errors
      const messages = Object.values(error.errors).map(err => err.message);
      return res
        .status(400)
        .json({success: false, message: 'Validation Error', error: messages});
    } else if (error instanceof mongoose.Error.CastError) {
      // Handle invalid ID format errors
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    // Handle any other errors
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
  }
};

// Update inventory item repair status
export const updateInventoryRepair = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {id} = req.params;
    const {repairHistoryEntry} = req.body; // Only keep repairHistoryEntry

    // Check if the item exists
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Allow update if the item is not in 'Under Repair' status
    if (item.status === 'Under Repair') {
      return res.status(400).json({
        success: false,
        message: 'Item is currently under repair and cannot be updated'
      });
    }

    if (item.status === 'Collected (Unpaid)') {
      return res.status(400).json({
        success: false,
        message:
          'Item is currently not available in the office kindly, collect and update'
      });
    }

    if (repairHistoryEntry) {
      // Populate the assignedBy field with the logged-in user's details
      repairHistoryEntry.assignedBy = {
        _id: req.user?._id,
        name: req.user?.name,
      };
    }

    const updatedItem = await Inventory.findOneAndUpdate(
      {_id: id, company: req.user?.company?._id},
      {
        $set: {
          status: 'Under Repair', // Automatically set status to 'Under Repair'
          repairStatus: 'In Progress', // Automatically set repairStatus to 'In Progress'
          _user: req.user?._id, // Add user ID for changelog
        },
        $push: repairHistoryEntry ? {repairHistory: repairHistoryEntry} : {},
      },
      {new: true, runValidators: true},
    );

    if (!updatedItem) {
      return res
        .status(404)
        .json({success: false, message: 'Item not found or not authorized'});
    }

    await updateDailyTransactions(req, 'repair', 1, 0);

    return res.json({
      success: true,
      message: 'Item updated',
      data: updatedItem
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
  }
};

// Update inventory item repair status to "Available" and "Completed"
export const completeRepairAndMakeAvailable = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {id} = req.params;

    // First get the current item to track changes
    const currentItem = await Inventory.findOne({
      _id: id,
      status: 'Under Repair',
      repairStatus: 'In Progress'
    });

    if (!currentItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found or is not in the correct repair status'
      });
    }

    // Prepare change history entries
    const changeHistory = [
      {
        field: 'status',
        oldValue: currentItem.status,
        newValue: 'Available',
        changedBy: {
          _id: req.user?._id,
          name: req.user?.name,
          email: req.user?.email
        },
        changeDate: new Date()
      },
      {
        field: 'repairStatus',
        oldValue: currentItem.repairStatus,
        newValue: 'Completed',
        changedBy: {
          _id: req.user?._id,
          name: req.user?.name,
          email: req.user?.email
        },
        changeDate: new Date()
      }
    ];

    // Update the item with changes and add to change history
    const item = await Inventory.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          status: 'Available',
          repairStatus: 'Completed',
          _user: {
            _id: req.user?._id,
            name: req.user?.name,
            email: req.user?.email
          }
        },
        $push: { 
          changeHistory: { 
            $each: changeHistory 
          },
          statusLogs: {
            status: 'Available',
            date: new Date(),
            changedBy: req.user?._id
          }
        }
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update item'
      });
    }

    await updateDailyTransactions(req, 'repair_complete', 1);

    return res.status(200).json({
      success: true,
      message: 'Item repair completed and marked as available',
      data: item
    });
  } catch (error) {
    console.error('Error updating repair status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
  }
};

export const updateInventorySoldStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {id} = req.params;
    const {salesDate, customerDetails, sellingPrice} = req.body;

    const item = await Inventory.findById(id);

    const companyId = req.user?.company?._id as mongoose.Types.ObjectId;

    if (!item || !companyId || !item.company.equals(companyId)) {
      return res.status(404).json({
        success: false,
        message: 'Item not found or unauthorized'
      });
    }

    // Always set status to 'Sold' when marking as sold
    const updates = {
      status: 'Sold',
      salesDate: salesDate || new Date(),
      customerDetails,
      sellingPrice
    };
    
    const changes = logChanges(item, updates, req.user);

    Object.assign(item, updates);
    item.changeHistory.push(...changes);

    // First check daily stock status before saving
    const stockResult = await updateDailyTransactions(req, 'sale', 1, sellingPrice || 0);
    if (!stockResult.success) {
      return res.status(400).json({
        success: false,
        message: stockResult.message || 'Failed to update daily stock'
      });
    }

    const updatedItem = await item.save();

    return res.status(200).json({
      success: true,
      message: 'Item marked as sold successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error marking item as sold:', error);
    return res.status(500).json({
      success: false,
      message: 'Error marking item as sold',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteInventory = async (req: AuthRequest, res: Response) => {
  try {
    const deletedItem = await Inventory.findOneAndDelete({
      _id: req.params.id,
      company: req.user?.company?._id,
    });

    if (!deletedItem) {
      return res
        .status(404)
        .json({success: false, message: 'Item not found or not authorized'});
    }

    return res.json({
      success: true,
      message: 'Item removed'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
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
        .json({success: false, message: 'Item not found or not authorized'});
    }

    return res.json({
      success: true,
      message: 'Item updated',
      data: updatedItem
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
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
    return res.status(200).json({
      success: true,
      message: 'Inventory items retrieved successfully',
      data: items
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
  }
};

export const getInventoryChangelog = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory ID format'
      });
    }

    const inventory = await Inventory.findById(req.params.id)
      .select('changeHistory')
      .lean();

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Transform the change history into the desired format
    const formattedLogs = inventory.changeHistory.map((change: any) => ({
      // Use generated ObjectId if _id is not available
      id: change._id?.toString() || new mongoose.Types.ObjectId().toString(),
      inventoryId: req.params.id,
      modifiedBy: {
        id: change.changedBy._id.toString(),
        username: change.changedBy.name,
        email: change.changedBy.email,
      },
      change: {
        field: change.field,
        previousValue: change.oldValue,
        newValue: change.newValue,
      },
      modifiedAt: change.changeDate,
    }));

    return res.json({
      success: true,
      message: 'Changelog retrieved successfully',
      data: formattedLogs
    });
  } catch (error) {
    console.error('Full error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching changelog',
      error: (error as Error).message
    });
  }
};

// Helper function to filter changes by date range
export const getInventoryChangelogByDateRange = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {startDate, endDate} = req.query;
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    const filteredChanges = inventory.changeHistory.filter(change => {
      const changeDate = new Date(change.changeDate);
      return (
        changeDate >= new Date(startDate as string) &&
        changeDate <= new Date(endDate as string)
      );
    });

    return res.json({
      success: true,
      message: 'Changelog retrieved successfully',
      data: filteredChanges
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching changelog',
      error: (error as Error).message
    });
  }
};

// Get average repair time
export const getAverageRepairTime = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.company?._id;
    if (!companyId || !validateCompanyId(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Company ID is required'
      });
    }
    const objectId = new mongoose.Types.ObjectId(companyId); // Convert companyId to ObjectId
    const averageTime = await averageRepairTime(objectId); // Convert companyId to ObjectId
    return res.status(200).json({
      success: true,
      message: 'Average repair time retrieved successfully',
      data: {averageRepairTime: averageTime}
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
  }
};

// Get total sales revenue
export const getTotalSalesRevenue = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.company?._id;
    if (!companyId || !validateCompanyId(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Company ID is required'
      });
    }
    const objectId = new mongoose.Types.ObjectId(companyId); // Convert companyId to ObjectId
    const revenue = await totalSalesRevenue(objectId); // Use objectId instead
    const netProfit = await totalNetProfit(objectId); // Use objectId instead
    return res.status(200).json({
      success: true,
      message: 'Total sales revenue retrieved successfully',
      data: {totalRevenue: revenue, netProfit: netProfit}
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
  }
};

// Get total metrics for the current month
export const getTotalSalesMetricsForCurrentMonth = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const companyId = req.user?.company?._id;
    console.log(req.user);
    if (!companyId || !validateCompanyId(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Company ID is required'
      });
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

    const returns = await totalReturns(objectId);

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
    const totalUnpaid = await totalCollectedUnpaid(objectId);
    const inventoryCount = await totalInventoryCount(objectId); // Inventory count can be all-time
    const availableDevices = await totalAvailableDevices(objectId); // Available devices are real-time

    // Respond with all the metrics
    return res.status(200).json({
      success: true,
      message: 'Total sales metrics retrieved successfully',
      data: {
        totalRevenue: revenue,
        netProfit: netProfit,
        totalGadgetsSold: gadgetsSold,
        averageSellingPrice: avgSellingPrice,
        totalRepairs: repairCount,
        averageRepairTime: avgRepairTime,
        totalRepairCosts: repairCost,
        totalInventoryCount: inventoryCount,
        totalAvailableDevices: availableDevices,
        returns: returns,
        unPaid: totalUnpaid,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
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
      return res.status(400).json({
        success: false,
        message: 'Valid Company ID is required'
      });
    }

    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const objectId = new mongoose.Types.ObjectId(companyId);
    const revenue = await revenueInDateRange(objectId, startDate, endDate);
    return res.status(200).json({
      success: true,
      message: 'Revenue in date range retrieved successfully',
      data: {revenueInRange: revenue}
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
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
      success: true,
      message: 'Stock opened for the day successfully',
      data: {openingTime}
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error opening stock for the day',
      error: (error as Error).message
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
      success: true,
      message: 'Stock closed for the day successfully',
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error closing stock for the day',
      error: (error as Error).message
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
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
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
      success: false,
      message: 'Error logging status change',
      error: (error as Error).message
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
        return res.status(500).json({
          success: false,
          message: 'Error sending report email',
          error: error.message
        });
      } else {
        return res.status(200).json({
          success: true,
          message: 'Daily report generated and sent',
          data: info
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error generating daily report',
      error: (error as Error).message
    });
  }
};

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
        .json({success: false, message: 'User is not associated with a company'});
    }

    // Build the query object dynamically based on parameters
    const query: any = {
      company: req.user?.company,
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

    return res.status(200).json({
      success: true,
      message: 'Inventory items retrieved successfully',
      data: items
    });
  } catch (error) {
    console.error('Error in getInventoryByDeviceTypeOrStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

export const processReturn = async (req: AuthRequest, res: Response) => {
  try {
    const {itemId} = req.params;
    const {refundAmount, refundType, reason} = req.body;

    // Find the inventory item
    const item = await Inventory.findById(itemId);
    if (!item || !item.company.equals(req.user?.company?._id as string)) {
      return res
        .status(404)
        .json({success: false, message: 'Item not found or not authorized'});
    }

    // First check daily stock status
    const stockResult = await updateDailyTransactions(req, 'return', 1);
    if (!stockResult.success) {
      return res.status(400).json({
        success: false,
        message: stockResult.message || 'Failed to update daily stock'
      });
    }

    // Create a Return record
    const returnRecord = new Return({
      inventory: item._id,
      refundAmount,
      refundType,
      returnDate: new Date(),
      damage: reason,
      company: item.company,
    });

    await returnRecord.save();

    // Update the inventory item based on the refund type
    item.status = 'Available';
    item.purchasePrice = refundAmount;
    item.sellingPrice = 0;
    item.returns.push(returnRecord._id as mongoose.Types.ObjectId);
    await item.save();

    return res.status(200).json({
      success: true,
      message: 'Return processed successfully',
      data: {returnRecord, updatedItem: item}
    });
  } catch (error) {
    console.error('Error processing return:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
  }
};

export const updateStatusAndHandlePayments = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {id} = req.params;
    const {
      collectedBy,
      paymentStatus,
      bankDetails,
      installmentPayment,
      trustedCollector,
      salesDate,
      sellingPrice,
      customerDetails,
      removeCollector,
    }: {
      collectedBy?: CollectorInfo;
      paymentStatus: 'Paid' | 'Not Paid' | 'Installment';
      bankDetails?: BankDetail[];
      installmentPayment?: InstallmentPayment;
      trustedCollector?: boolean;
      salesDate?: Date;
      sellingPrice?: number;
      customerDetails?: CustomerDetails;
      removeCollector?: boolean;
    } = req.body;

    // First get the current item to check status and prepare changes
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if the item is ineligible for updates
    if (item.status === 'Under Repair') {
      return res.status(400).json({
        success: false,
        message: 'Item is currently under repair and cannot be updated'
      });
    }

    // Prepare updates
    const updates: {
      paymentStatus?: string;
      trustedCollector?: boolean;
      collectedBy?: CollectorInfo | null;
      status?: string;
      sellingPrice?: number;
      customerDetails?: CustomerDetails;
      salesDate?: Date;
      bankDetails?: BankDetail[];
      totalAmountPaid?: number;
      installmentPayments?: InstallmentPayment[];
    } = {
      paymentStatus,
      trustedCollector
    };

    // Handle collector information
    if (removeCollector) {
      updates.collectedBy = null;
      updates.status = 'Available';
    } else if (collectedBy) {
      updates.collectedBy = collectedBy;
    }

    // Prepare change history entries
    const changes: any[] = [];

    // Handle selling price update
    if (sellingPrice && (paymentStatus === 'Paid' || paymentStatus === 'Installment')) {
      updates.sellingPrice = sellingPrice;
    }

    // Handle customer details
    if (customerDetails && (paymentStatus === 'Paid' || paymentStatus === 'Installment')) {
      updates.customerDetails = customerDetails;
    }

    // Handle different payment scenarios
    if (paymentStatus === 'Paid') {
      // First check daily stock status for new sales
      if (item.status !== 'Sold') {
        const stockResult = await updateDailyTransactions(req, 'sale', 1, sellingPrice || 0);
        if (!stockResult.success) {
          return res.status(400).json({
            success: false,
            message: stockResult.message || 'Failed to update daily stock'
          });
        }
      }

      updates.status = 'Sold';
      updates.salesDate = salesDate || new Date();

      changes.push(
        ...logChanges(
          item,
          {
            status: updates.status,
            salesDate: updates.salesDate,
            sellingPrice: updates.sellingPrice,
            customerDetails: updates.customerDetails,
            paymentStatus: updates.paymentStatus
          },
          req.user,
        ),
      );
    } else if (paymentStatus === 'Not Paid' && !removeCollector) {
      updates.status = 'Collected (Unpaid)';
      changes.push(...logChanges(item, {
        status: updates.status,
        paymentStatus: updates.paymentStatus
      }, req.user));
    } else if (paymentStatus === 'Installment') {
      // For new installment setups
      if (item.status !== 'Collected') {
        updates.status = 'Collected';
        changes.push(...logChanges(item, {
          status: updates.status,
          paymentStatus: updates.paymentStatus,
          sellingPrice: updates.sellingPrice
        }, req.user));
      }
    }

    // Handle bank details
    if (bankDetails && Array.isArray(bankDetails)) {
      // Append new bank details to existing ones
      const currentBankDetails = item.bankDetails || [];
      updates.bankDetails = [...currentBankDetails, ...bankDetails];
      
      // Calculate total amount paid
      updates.totalAmountPaid = updates.bankDetails.reduce(
        (total: number, detail: BankDetail) => total + (detail.amount || 0),
        0
      );

      // Get the effective selling price
      const effectiveSellingPrice = updates.sellingPrice || item.sellingPrice || 0;

      // If total amount equals or exceeds selling price, mark as fully paid
      if (effectiveSellingPrice > 0 && updates.totalAmountPaid >= effectiveSellingPrice) {
        updates.paymentStatus = 'Paid';
        updates.status = 'Sold';
        changes.push(...logChanges(item, {
          paymentStatus: 'Paid',
          status: 'Sold'
        }, req.user));
      }
    }

    // Handle installment payments
    if (paymentStatus === 'Installment' && installmentPayment) {
      const currentInstallments = item.installmentPayments || [];
      updates.installmentPayments = [...currentInstallments, installmentPayment];
      
      // Calculate total amount paid including installments
      const installmentTotal = updates.installmentPayments.reduce(
        (total: number, payment: InstallmentPayment) => total + (payment.amountPaid || 0),
        0
      );
      updates.totalAmountPaid = installmentTotal;

      // Get the effective selling price
      const effectiveSellingPrice = updates.sellingPrice || item.sellingPrice || 0;

      // If total installments equal or exceed selling price, mark as fully paid
      if (effectiveSellingPrice > 0 && updates.totalAmountPaid >= effectiveSellingPrice) {
        updates.paymentStatus = 'Paid';
        updates.status = 'Sold';
        changes.push(...logChanges(item, {
          paymentStatus: 'Paid',
          status: 'Sold'
        }, req.user));
      }
    }

    // Create update operation
    const updateOperation: any = {
      $set: {
        ...updates,
        _user: {
          _id: req.user?._id,
          name: req.user?.name,
          email: req.user?.email
        }
      }
    };

    // Add changes to history if any exist
    if (changes.length > 0) {
      updateOperation.$push = {
        changeHistory: {
          $each: changes
        }
      };
    }

    // Update the item with changes and add to change history
    const updatedItem = await Inventory.findOneAndUpdate(
      { _id: id },
      updateOperation,
      { 
        new: true,
        runValidators: false
      }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update item'
      });
    }

    // Prepare response message
    let message = 'Status and payment details updated successfully';
    if (removeCollector) {
      message = 'Item returned and collector information removed';
    } else if (updates.status === 'Sold' && updates.paymentStatus === 'Paid') {
      message = 'Item marked as sold and fully paid';
    } else if (updates.status === 'Collected' && updates.paymentStatus === 'Installment') {
      message = 'Installment payment recorded successfully';
    }

    return res.status(200).json({
      success: true,
      message,
      data: updatedItem
    });
  } catch (error: any) {
    console.error('Error updating status and payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const getSalesForDate = async (req: AuthRequest, res: Response) => {
  try {
    const {date} = req.query; // Expecting date in 'YYYY-MM-DD' format
    console.log(date);
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Parse the date and set the time range for the day
    const startDate = new Date(date as string);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    // Query to get sales data for the specific date
    const salesData = await Inventory.find({
      status: 'Sold',
      salesDate: {$gte: startDate, $lt: endDate},
    });

    return res.json({
      success: true,
      message: 'Sales data retrieved successfully',
      data: salesData
    });
  } catch (error) {
    console.error('Error fetching sales data for the date:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching sales data',
      error: (error as Error).message
    });
  }
};

export const recordOpeningStock = async (req: AuthRequest, res: Response) => {
  try {
    const {month, year, openingStock} = req.body;
    // Validate input
    if (!month || !year || openingStock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Month, year, and opening stock are required.'
      });
    }
    // Logic to save opening stock in the database
    // ... (database interaction code here)
    return res.status(200).json({
      success: true,
      message: 'Opening stock recorded successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
  }
};

export const recordClosingStock = async (req: AuthRequest, res: Response) => {
  try {
    const {month, year, closingStock} = req.body;
    // Validate input
    if (!month || !year || closingStock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Month, year, and closing stock are required.'
      });
    }
    // Logic to save closing stock in the database
    // ... (database interaction code here)
    return res.status(200).json({
      success: true,
      message: 'Closing stock recorded successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: (error as Error).message
    });
  }
};

export const recordDailyOpeningStock = async (req: AuthRequest, res: Response) => {
  const { date, openingCount } = req.body;

  if (!date || !openingCount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  try {
    const existingRecord = await DailyStock.findOne({ date });

    if (existingRecord) {
      existingRecord.openingCount = openingCount;
      existingRecord.openingTime = new Date();
      await existingRecord.save();
      return res.status(200).json({
        success: true,
        message: 'Daily opening stock updated successfully',
        data: existingRecord
      });
    } else {
      const newStockRecord = new DailyStock({
        date,
        openingCount,
        openingTime: new Date(),
        company: req.user?.company
      });
      await newStockRecord.save();
      return res.status(201).json({
        success: true,
        message: 'Daily opening stock recorded successfully',
        data: newStockRecord
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error recording daily opening stock',
      error: (error as Error).message
    });
  }
};

export const recordDailyClosingStock = async (req: AuthRequest, res: Response) => {
  const { date, closingCount } = req.body;

  if (!date || !closingCount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  try {
    const existingRecord = await DailyStock.findOne({ date });

    if (existingRecord) {
      existingRecord.closingCount = closingCount;
      existingRecord.closingTime = new Date();
      await existingRecord.save();
      return res.status(200).json({
        success: true,
        message: 'Daily closing stock updated successfully',
        data: existingRecord
      });
    } else {
      const newStockRecord = new DailyStock({
        date,
        closingCount,
        closingTime: new Date(),
        company: req.user?.company
      });
      await newStockRecord.save();
      return res.status(201).json({
        success: true,
        message: 'Daily closing stock recorded successfully',
        data: newStockRecord
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error recording daily closing stock',
      error: (error as Error).message
    });
  }
};

// Helper function to safely convert company to ObjectId
const getCompanyId = (company: mongoose.Types.ObjectId | ICompany | string | undefined): mongoose.Types.ObjectId | null => {
  if (!company) return null;
  
  if (company instanceof mongoose.Types.ObjectId) {
    return company;
  }
  
  if (typeof company === 'string') {
    try {
      return new mongoose.Types.ObjectId(company);
    } catch {
      return null;
    }
  }
  
  if (typeof company === 'object' && '_id' in company && company._id) {
    return company._id instanceof mongoose.Types.ObjectId 
      ? company._id 
      : new mongoose.Types.ObjectId(company._id.toString());
  }
  
  return null;
};

export const openDailyStock = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const companyId = getCompanyId(req.user.company);
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing company ID',
        error: 'User must be associated with a valid company'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if stock is already opened for today
    const existingStock = await DailyStock.findOne({
      company: companyId,
      date: today
    });

    if (existingStock) {
      return res.status(400).json({
        success: false,
        message: 'Stock has already been opened for today'
      });
    }

    // Get current inventory counts
    const inventoryCounts = await Inventory.aggregate([
      {
        $match: { 
          company: companyId
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format counts by status
    interface StatusCounts {
      available: number;
      inRepair: number;
      reserved: number;
      damaged: number;
    }

    const byStatus: StatusCounts = {
      available: 0,
      inRepair: 0,
      reserved: 0,
      damaged: 0
    };

    let total = 0;
    inventoryCounts.forEach(item => {
      const status = item._id?.toLowerCase();
      if (status && status in byStatus) {
        byStatus[status as keyof StatusCounts] = item.count;
        total += item.count;
      }
    });

    // Create new daily stock record
    const dailyStock = new DailyStock({
      date: today,
      company: companyId,
      openingTime: new Date(),
      openingCount: {
        total,
        byStatus
      },
      transactions: {
        newAdditions: 0,
        sales: 0,
        repairs: {
          sent: 0,
          completed: 0
        },
        returns: 0
      },
      cashFlow: {
        sales: 0,
        repairs: 0,
        total: 0
      }
    });

    await dailyStock.save();

    return res.status(200).json({
      success: true,
      message: 'Daily stock opened successfully',
      data: dailyStock
    });
  } catch (error) {
    console.error('Error opening daily stock:', error);
    return res.status(500).json({
      success: false,
      message: 'Error opening daily stock',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const closeDailyStock = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const companyId = getCompanyId(req.user.company);
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing company ID',
        error: 'User must be associated with a valid company'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current daily stock record
    const dailyStock = await DailyStock.findOne({
      company: companyId,
      date: today
    });

    if (!dailyStock) {
      return res.status(404).json({
        success: false,
        message: 'No open stock found for today'
      });
    }

    if (dailyStock.closingTime) {
      return res.status(400).json({
        success: false,
        message: 'Stock has already been closed for today'
      });
    }

    // Get current inventory counts
    const inventoryCounts = await Inventory.aggregate([
      {
        $match: { 
          company: companyId
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format closing counts
    interface StatusCounts {
      available: number;
      inRepair: number;
      reserved: number;
      damaged: number;
    }

    const byStatus: StatusCounts = {
      available: 0,
      inRepair: 0,
      reserved: 0,
      damaged: 0
    };

    let total = 0;
    inventoryCounts.forEach(item => {
      const status = item._id?.toLowerCase();
      if (status && status in byStatus) {
        byStatus[status as keyof StatusCounts] = item.count;
        total += item.count;
      }
    });

    // Calculate discrepancies
    interface Discrepancy {
      type: string;
      description: string;
      quantity: number;
      value: number;
    }
    
    const discrepancies: Discrepancy[] = [];
    Object.keys(byStatus).forEach(status => {
      const openingStatus = status as keyof StatusCounts;
      const difference = byStatus[openingStatus] - dailyStock.openingCount.byStatus[openingStatus];
      if (difference !== 0) {
        discrepancies.push({
          type: status,
          description: `${Math.abs(difference)} ${difference > 0 ? 'more' : 'less'} items than opening count`,
          quantity: Math.abs(difference),
          value: 0
        });
      }
    });

    // Update daily stock with closing information
    dailyStock.closingTime = new Date();
    dailyStock.closingCount = {
      total,
      byStatus
    };
    dailyStock.discrepancies = discrepancies;

    await dailyStock.save();

    return res.status(200).json({
      success: true,
      message: 'Daily stock closed successfully',
      data: {
        openingCount: dailyStock.openingCount,
        closingCount: dailyStock.closingCount,
        transactions: dailyStock.transactions,
        cashFlow: dailyStock.cashFlow,
        discrepancies
      }
    });
  } catch (error) {
    console.error('Error closing daily stock:', error);
    return res.status(500).json({
      success: false,
      message: 'Error closing daily stock',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateDailyStockTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const {
      transactionType,
      quantity = 1,
      amount = 0
    } = req.body;

    const dailyStock = await DailyStock.findOne({
      company: req.user?.company,
      date: today
    });

    if (!dailyStock) {
      return res.status(404).json({
        success: false,
        message: 'No open stock found for today'
      });
    }

    if (dailyStock.closingTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update transactions after stock is closed'
      });
    }

    // Update transactions based on type
    switch (transactionType) {
      case 'sale':
        dailyStock.transactions.sales += quantity;
        dailyStock.cashFlow.sales += amount;
        dailyStock.cashFlow.total += amount;
        break;
      case 'repair':
        dailyStock.transactions.repairs.sent += quantity;
        dailyStock.cashFlow.repairs += amount;
        dailyStock.cashFlow.total += amount;
        break;
      case 'repair_complete':
        dailyStock.transactions.repairs.completed += quantity;
        break;
      case 'return':
        dailyStock.transactions.returns += quantity;
        break;
      case 'new_addition':
        dailyStock.transactions.newAdditions += quantity;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction type'
        });
    }

    await dailyStock.save();

    return res.status(200).json({
      success: true,
      message: 'Daily stock transactions updated successfully',
      data: dailyStock
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating daily stock transactions',
      error: (error as Error).message
    });
  }
};

export const getDailyStockReport = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date as string) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const dailyStock = await DailyStock.findOne({
      company: req.user?.company,
      date: queryDate
    });

    if (!dailyStock) {
      return res.status(404).json({
        success: false,
        message: 'No stock record found for the specified date'
      });
    }

    // Calculate additional metrics
    const netInventoryChange = dailyStock.closingCount?.total 
      ? dailyStock.closingCount.total - dailyStock.openingCount.total
      : 0;

    const report = {
      date: dailyStock.date,
      openingTime: dailyStock.openingTime,
      closingTime: dailyStock.closingTime,
      inventoryCounts: {
        opening: dailyStock.openingCount,
        closing: dailyStock.closingCount,
        netChange: netInventoryChange
      },
      transactions: dailyStock.transactions,
      financials: {
        ...dailyStock.cashFlow,
        averageTransactionValue: dailyStock.transactions.sales 
          ? dailyStock.cashFlow.sales / dailyStock.transactions.sales 
          : 0
      },
      discrepancies: dailyStock.discrepancies,
      reconciled: dailyStock.reconciled
    };

    return res.status(200).json({
      success: true,
      message: 'Daily stock report retrieved successfully',
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving daily stock report',
      error: (error as Error).message
    });
  }
};
