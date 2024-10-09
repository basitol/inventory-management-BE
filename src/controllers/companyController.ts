import {Request, Response, NextFunction} from 'express';
import Company from '../models/Company';

// Create a new company
export const createCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {name, address} = req.body;
    const company = new Company({name, address});
    await company.save();
    res.status(201).json(company);
  } catch (error: any) {
    res.status(500).json({error: error.message});
    next(error);
  }
};

// Get all companies
export const getAllCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companies = await Company.find();
    res.status(200).json(companies);
  } catch (error: any) {
    res.status(500).json({error: error.message});
    next(error);
  }
};
