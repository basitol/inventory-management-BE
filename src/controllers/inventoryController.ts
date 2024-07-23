import {Request, Response} from 'express';
import Inventory from '../models/Inventory';

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Public
const getInventory = async (req: Request, res: Response) => {
  try {
    const items = await Inventory.find({});
    res.json(items);
  } catch (error) {
    res.status(500).json({message: 'Server Error'});
  }
};

// @desc    Create an inventory item
// @route   POST /api/inventory
// @access  Public
const createInventory = async (req: Request, res: Response) => {
  try {
    const {
      imei,
      name,
      purchasePrice,
      condition,
      roughness,
      faceId,
      idm,
      ibm,
      icm,
      touchId,
      fault,
    } = req.body;

    const item = new Inventory({
      imei,
      name,
      purchasePrice,
      condition,
      roughness,
      faceId,
      idm,
      ibm,
      icm,
      touchId,
      fault,
    });

    const createdItem = await item.save();
    res.status(201).json(createdItem);
  } catch (error) {
    res.status(500).json({message: 'Server Error'});
  }
};

export {getInventory, createInventory};
