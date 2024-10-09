import {Response} from 'express';
import Inventory, {IInventory} from '../models/Inventory';
import {AuthRequest} from '../middleware/authenticate';
import InventoryChangeLog from '../models/InventoryChangeLog';
import mongoose from 'mongoose';
import {
  averageRepairTime,
  revenueInDateRange,
  totalNetProfit,
  totalSalesRevenue,
} from '../services/analyticsService';

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
// export const createInventory = async (req: AuthRequest, res: Response) => {
//   try {
//     if (!req.user?.company) {
//       return res
//         .status(400)
//         .json({message: 'User is not associated with a company'});
//     }

//     const {
//       imei,
//       name,
//       purchasePrice,
//       condition,
//       roughness,
//       faceId,
//       idm,
//       ibm,
//       icm,
//       touchId,
//       fault,
//       storageCapacity,
//       brand,
//       modelName,
//     } = req.body;

//     const item = new Inventory({
//       imei,
//       name,
//       purchasePrice,
//       condition,
//       company: req.user.company,
//       roughness,
//       faceId,
//       idm,
//       ibm,
//       icm,
//       touchId,
//       fault,
//       storageCapacity,
//       brand,
//       modelName,
//     });

//     console.log('Attempting to save item:', item);

//     const createdItem = await item.save();
//     res.status(201).json(createdItem);
//   } catch (error: any) {
//     if (error.code === 11000) {
//       // Check if the error is due to a duplicate IMEI for the same company
//       if (
//         error.keyPattern &&
//         error.keyPattern.imei &&
//         error.keyPattern.company
//       ) {
//         res.status(400).json({
//           message: 'An item with this IMEI already exists for this company.',
//           error: error.message,
//         });
//       } else {
//         res.status(400).json({
//           message: 'Duplicate key error. Please check all unique fields.',
//           error: error.message,
//         });
//       }
//     } else {
//       res.status(500).json({message: 'Server Error', error: error.message});
//     }
//   }
// };

export const createInventory = async (req: AuthRequest, res: Response) => {
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

// Delete an inventory item
export const deleteInventory = async (req: AuthRequest, res: Response) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({message: 'Item not found'});
    }

    if (item.company.toString() !== req.user?.company?.toString()) {
      return res
        .status(403)
        .json({message: 'Not authorized to delete this item'});
    }

    await Inventory.deleteOne({_id: item._id});
    res.json({message: 'Item removed'});
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
    const companyId = req.user?.company;
    if (!companyId) {
      return res.status(400).json({message: 'Company ID is required'});
    }
    const averageTime = await averageRepairTime(companyId);
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
    if (!companyId) {
      return res.status(400).json({message: 'Company ID is required'});
    }
    const revenue = await totalSalesRevenue(companyId);
    const netProfit = await totalNetProfit(companyId);
    res.status(200).json({totalRevenue: revenue, netProfit: netProfit});
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
    const companyId = req.user?.company;
    if (!companyId) {
      return res.status(400).json({message: 'Company ID is required'});
    }

    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({message: 'Invalid date format'});
    }

    const revenue = await revenueInDateRange(companyId, startDate, endDate);
    res.status(200).json({revenueInRange: revenue});
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};
