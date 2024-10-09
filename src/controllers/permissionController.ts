// controllers/permissionController.ts
import {Request, Response} from 'express';
import {Permission} from '../models/Permission';

export const createPermission = async (req: Request, res: Response) => {
  try {
    const {name, description} = req.body;
    const newPermission = new Permission({name, description});
    await newPermission.save();
    res.status(201).json(newPermission);
  } catch (error: any) {
    res.status(500).json({message: error.message});
  }
};

export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await Permission.find();
    res.status(200).json(permissions);
  } catch (error: any) {
    res.status(500).json({message: error.message});
  }
};
