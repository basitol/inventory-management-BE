import {Request, Response, NextFunction} from 'express';
import Company from '../models/Company';

// Create a new company with a default subscription
export const createCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {name, address, subscriptionType = 'free'} = req.body;
    const company = new Company({
      name,
      address,
      subscriptionType, // Default to 'free' if not provided
      subscriptionStartDate: new Date(), // Set to current date
    });

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

// Get a company by ID
export const getCompanyById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({message: 'Company not found'});
    }
    res.status(200).json(company);
  } catch (error: any) {
    res.status(500).json({error: error.message});
    next(error);
  }
};

// Update a company by ID
export const updateCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new: true, runValidators: true},
    );
    if (!updatedCompany) {
      return res.status(404).json({message: 'Company not found'});
    }
    res.status(200).json(updatedCompany);
  } catch (error: any) {
    res.status(500).json({error: error.message});
    next(error);
  }
};

// Delete a company by ID
export const deleteCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const deletedCompany = await Company.findByIdAndDelete(req.params.id);
    if (!deletedCompany) {
      return res.status(404).json({message: 'Company not found'});
    }
    res.status(200).json({message: 'Company deleted successfully'});
  } catch (error: any) {
    res.status(500).json({error: error.message});
    next(error);
  }
};
