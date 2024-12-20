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
  totalReturns,
  totalCollectedUnpaid,
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

export const updatePricesAndMakeAvailable = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {id} = req.params;
    const {purchasePrice, sellingPrice} = req.body;

    // Validate input
    if (
      typeof purchasePrice !== 'number' ||
      typeof sellingPrice !== 'number' ||
      purchasePrice <= 0 ||
      sellingPrice <= 0
    ) {
      return res.status(400).json({
        message:
          'Both purchasePrice and sellingPrice must be numbers greater than zero',
      });
    }

    // Ensure we have a user ID
    if (!req.user?._id) {
      return res.status(400).json({
        message: 'User ID is required for this operation',
      });
    }

    // First get the original item to compare changes
    const originalItem = await Inventory.findOne({
      _id: id,
      company: req.user?.company?._id,
    });

    if (!originalItem) {
      return res.status(404).json({message: 'Item not found'});
    }

    // Prepare changes array
    const changes = [];

    // Check each field for changes
    if (originalItem.purchasePrice !== purchasePrice) {
      changes.push({
        field: 'purchasePrice',
        oldValue: originalItem.purchasePrice,
        newValue: purchasePrice,
        changedBy: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
        changeDate: new Date(),
      });
    }

    if (originalItem.sellingPrice !== sellingPrice) {
      changes.push({
        field: 'sellingPrice',
        oldValue: originalItem.sellingPrice,
        newValue: sellingPrice,
        changedBy: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
        changeDate: new Date(),
      });
    }

    if (originalItem.status !== 'Available') {
      changes.push({
        field: 'status',
        oldValue: originalItem.status,
        newValue: 'Available',
        changedBy: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
        changeDate: new Date(),
      });
    }

    // Update the item with new values and add changes to history
    const updatedItem = await Inventory.findOneAndUpdate(
      {
        _id: id,
        company: req.user?.company?._id,
      },
      {
        $set: {
          purchasePrice,
          sellingPrice,
          status: 'Available',
        },
        $push: {
          changeHistory: {
            $each: changes,
            $position: 0, // Add new changes at the beginning of the array
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,
      message: 'Prices updated and item is now available for sale',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error updating prices and status:', error);
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

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
    const {repairHistoryEntry} = req.body; // Only keep repairHistoryEntry

    // Check if the item exists
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({message: 'Item not found'});
    }

    // Allow update if the item is not in 'Under Repair' status
    if (item.status === 'Under Repair') {
      return res.status(400).json({
        message: 'Item is currently under repair and cannot be updated',
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
        .json({message: 'Item not found or not authorized'});
    }

    res.json(updatedItem);
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

// Update inventory item repair status to "Available" and "Completed"
export const completeRepairAndMakeAvailable = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {id} = req.params;

    // Find the inventory item by ID
    const item = await Inventory.findById(id);

    if (!item) {
      return res.status(404).json({message: 'Item not found'});
    }

    // Check if the item is currently under repair and has "In Progress" repair status
    if (item.status !== 'Under Repair' || item.repairStatus !== 'In Progress') {
      return res.status(400).json({
        message:
          'Item is not under repair or does not have "In Progress" status',
      });
    }

    // Update the status and repair status
    item.status = 'Available';
    item.repairStatus = 'Completed';

    // Save the updated inventory item
    await item.save();

    res.status(200).json({
      message: 'Item repair completed and marked as available',
      item,
    });
  } catch (error) {
    console.error('Error updating repair status:', error);
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

export const updateInventorySoldStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const {id} = req.params;
    const {status, salesDate, customerDetails, sellingPrice} = req.body;

    // Ensure we have a user
    if (!req.user?._id || !req.user?.name || !req.user?.email) {
      return res.status(400).json({
        message: 'Complete user information is required for this operation',
      });
    }

    // First get the original item to compare changes
    const originalItem = await Inventory.findOne({
      _id: id,
      company: req.user?.company?._id,
    });

    if (!originalItem) {
      return res
        .status(404)
        .json({message: 'Item not found or not authorized'});
    }

    // Prepare changes array
    const changes = [];

    // Check each field for changes and build change history
    if (originalItem.status !== status) {
      changes.push({
        field: 'status',
        oldValue: originalItem.status,
        newValue: status,
        changedBy: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
        changeDate: new Date(),
      });
    }

    if (originalItem.sellingPrice !== sellingPrice) {
      changes.push({
        field: 'sellingPrice',
        oldValue: originalItem.sellingPrice,
        newValue: sellingPrice,
        changedBy: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
        changeDate: new Date(),
      });
    }

    // For complex objects like customerDetails, we need to check if they're different
    if (
      JSON.stringify(originalItem.customerDetails) !==
      JSON.stringify(customerDetails)
    ) {
      changes.push({
        field: 'customerDetails',
        oldValue: originalItem.customerDetails,
        newValue: customerDetails,
        changedBy: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
        changeDate: new Date(),
      });
    }

    // If salesDate is provided and different from the original
    const newSalesDate = salesDate || new Date();
    if (
      originalItem.salesDate?.getTime() !== new Date(newSalesDate).getTime()
    ) {
      changes.push({
        field: 'salesDate',
        oldValue: originalItem.salesDate,
        newValue: newSalesDate,
        changedBy: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
        changeDate: new Date(),
      });
    }

    // Update the item with new values and add changes to history
    const updatedItem = await Inventory.findOneAndUpdate(
      {
        _id: id,
        company: req.user?.company?._id,
      },
      {
        $set: {
          status,
          salesDate: newSalesDate,
          sellingPrice,
          customerDetails,
        },
        // Only add to change history if there are actual changes
        ...(changes.length > 0
          ? {
              $push: {
                changeHistory: {
                  $each: changes,
                  $position: 0, // Add new changes at the beginning of the array
                },
              },
            }
          : {}),
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedItem) {
      return res.status(404).json({message: 'Item not found after update'});
    }

    res.json({
      success: true,
      message: 'Item status updated successfully',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error updating item sold status:', error);
    res.status(500).json({
      message: 'Server Error',
      error: (error as Error).message,
    });
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

export const getInventoryChangelog = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid inventory ID format',
      });
    }

    const inventory = await Inventory.findById(req.params.id)
      .select('changeHistory')
      .lean();

    if (!inventory) {
      return res.status(404).json({
        message: 'Inventory item not found',
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

    res.json(formattedLogs);
  } catch (error) {
    console.error('Full error:', error);
    res.status(500).json({
      message: 'Error fetching changelog',
      error: (error as Error).message,
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
      return res.status(404).json({message: 'Inventory not found'});
    }

    const filteredChanges = inventory.changeHistory.filter(change => {
      const changeDate = new Date(change.changeDate);
      return (
        changeDate >= new Date(startDate as string) &&
        changeDate <= new Date(endDate as string)
      );
    });

    res.json(filteredChanges);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching changelog',
      error: (error as Error).message,
    });
  }
};

// export const getInventoryChangelog = async (
//   req: AuthRequest,
//   res: Response,
// ) => {
//   try {
//     console.log('Searching for inventory ID:', req.params.id);

//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({
//         message: 'Invalid inventory ID format',
//       });
//     }

//     // Remove .lean() to keep Mongoose document methods
//     const logs = (await InventoryChangeLog.find({
//       inventory: req.params.id,
//     }).populate('user', 'userId email name')) as ChangeLogDocument[];

//     console.log('Populated logs found:', logs.length);

//     // Manual transform since we're working with Mongoose documents
//     const formattedLogs = logs.map(log => {
//       if (!('name' in log.user) || !('email' in log.user)) {
//         throw new Error('User data not properly populated');
//       }

//       return {
//         id: log._id.toString(),
//         inventoryId: log.inventory.toString(),
//         modifiedBy: {
//           id: log.user._id.toString(),
//           username: log.user.name,
//           email: log.user.email,
//         },
//         changes: Array.from(
//           log.changesMade instanceof Map
//             ? log.changesMade.entries()
//             : Object.entries(log.changesMade),
//         ).map(([field, values]) => {
//           const {old, new: newValue} = values as {old: any; new: any};
//           return {
//             field,
//             previousValue: old,
//             newValue: newValue,
//           };
//         }),
//         modifiedAt: log.changeDate,
//       };
//     });

//     console.log('First formatted log:', formattedLogs[0]);

//     res.json(formattedLogs);
//   } catch (error) {
//     console.error('Full error:', error);
//     res.status(500).json({
//       message: 'Error fetching changelog',
//       error: (error as Error).message,
//     });
//   }
// };

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
    console.log(req.user);
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
      returns: returns,
      unPaid: totalUnpaid,
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

export const processReturn = async (req: AuthRequest, res: Response) => {
  try {
    const {itemId} = req.params;
    const {refundAmount, refundType, reason} = req.body;

    // Find the inventory item
    const item = await Inventory.findById(itemId);
    if (!item || !item.company.equals(req.user?.company?._id as string)) {
      return res
        .status(404)
        .json({message: 'Item not found or not authorized'});
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
    item.status = 'Available'; // Item is back in stock
    item.purchasePrice = refundAmount; // Treat the refund amount as the new purchase price
    item.sellingPrice = 0; // Reset the selling price to 0

    // Add the return record to the item's returns list
    item.returns.push(returnRecord._id as mongoose.Types.ObjectId);

    // Save the updated inventory item
    await item.save();

    res.status(200).json({
      message: 'Return processed successfully',
      returnRecord,
      updatedItem: item,
    });
  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).json({
      message: 'Server Error',
      error: (error as Error).message,
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
      salesDate, // New field for when the item is sold
      sellingPrice, // New field for the selling price
      customerDetails, // New field for customer details
    } = req.body;

    // Find the inventory item by ID
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({message: 'Item not found'});
    }

    // Check if the item is either 'Under Repair' or 'Sold'
    if (item.status === 'Under Repair') {
      return res.status(400).json({
        message: 'Item is currently under repair and cannot be updated',
      });
    }

    if (item.status === 'Sold') {
      return res.status(400).json({
        message: 'Item is already sold and cannot be updated',
      });
    }

    // Prepare changes array for recording changes
    const changes = [];

    // Update basic status and collection details
    if (paymentStatus === 'Paid') {
      // Record changes before updating
      changes.push({
        field: 'status',
        oldValue: item.status,
        newValue: 'Sold',
      });
      changes.push({
        field: 'salesDate',
        oldValue: item.salesDate,
        newValue: salesDate || new Date(),
      });
      changes.push({
        field: 'sellingPrice',
        oldValue: item.sellingPrice,
        newValue: sellingPrice,
      });
      changes.push({
        field: 'customerDetails',
        oldValue: item.customerDetails,
        newValue: customerDetails,
      });

      // Update item details
      item.status = 'Sold'; // Mark the item as sold
      item.salesDate = salesDate || new Date(); // Use provided sales date or current date
      item.sellingPrice = sellingPrice; // Set the selling price
      item.customerDetails = customerDetails; // Set customer details
    } else if (paymentStatus === 'Not Paid') {
      item.status = 'Collected (Unpaid)'; // Item is collected but not paid for
    } else {
      item.status = 'Collected'; // General collected status for installment payments
    }

    item.collectedBy = collectedBy;
    item.paymentStatus = paymentStatus;
    item.trustedCollector = trustedCollector;

    // Handle bank details for full payments or multiple methods
    if (bankDetails && Array.isArray(bankDetails)) {
      item.bankDetails = bankDetails;
      item.totalAmountPaid = bankDetails.reduce(
        (total, detail) => total + (detail.amount || 0),
        0,
      );
    }

    // Handle installment payments
    if (paymentStatus === 'Installment' && installmentPayment) {
      item.installmentPayments = item.installmentPayments || []; // Initialize if undefined
      item.installmentPayments.push(installmentPayment);
      item.totalAmountPaid =
        (item.totalAmountPaid || 0) + installmentPayment.amountPaid;
    }

    // Save the updated inventory item
    const updatedItem = await item.save();

    // No need to manually log changes here; it will be handled by the hooks

    res.status(200).json({
      message: 'Status and payment details updated successfully',
      item: updatedItem,
    });
  } catch (error: any) {
    console.error('Error updating status and payments:', error);
    res.status(500).json({
      message: 'Server Error',
      error: error.message,
    });
  }
};

// Controller to fetch sales data for a specific date
export const getSalesForDate = async (req: AuthRequest, res: Response) => {
  try {
    const {date} = req.query; // Expecting date in 'YYYY-MM-DD' format
    console.log(date);
    if (!date) {
      return res.status(400).json({error: 'Date is required'});
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

    res.json(salesData);
  } catch (error) {
    console.error('Error fetching sales data for the date:', error);
    res.status(500).json({error: 'Failed to fetch sales data'});
  }
};
