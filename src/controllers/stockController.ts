import {Response} from 'express';
import {AuthRequest} from 'middleware/authenticate';
import Inventory from '../models/Inventory';
import StockLog from '../models/StockLog';

export const logDailyStock = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.company?._id;

    // Gather stock summary
    const availableItems = await Inventory.find({
      status: 'Available',
      company: companyId,
    });
    const soldItems = await Inventory.find({
      status: 'Sold',
      company: companyId,
    });
    const underRepairItems = await Inventory.find({
      status: 'Under Repair',
      company: companyId,
    });
    const collectedUnpaidItems = await Inventory.find({
      status: 'Collected (Unpaid)',
      company: companyId,
    });

    const stockSummary = {
      totalAvailable: availableItems.length,
      totalSold: soldItems.length,
      totalUnderRepair: underRepairItems.length,
      totalCollectedUnpaid: collectedUnpaidItems.length,
    };

    // Create stock log entry
    const stockLog = new StockLog({
      date: new Date(),
      stockSummary,
      company: companyId,
    });

    await stockLog.save();

    res
      .status(200)
      .json({message: 'Daily stock logged successfully', stockLog});
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

export const getStockLogs = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.company?._id;

    const stockLogs = await StockLog.find({company: companyId}).sort({
      date: -1,
    });

    if (stockLogs.length === 0) {
      return res
        .status(404)
        .json({message: 'No stock logs found for this company.'});
    }

    res.status(200).json(stockLogs);
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};

export const closeStockLog = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.company?._id;
    const date = new Date(req.body.date); // Assuming the date is sent in the request body

    const stockLog = await StockLog.findOne({
      company: companyId,
      date: {$gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)},
    });

    if (!stockLog) {
      return res
        .status(404)
        .json({message: 'Stock log not found for the given date.'});
    }

    stockLog.closed = true;
    await stockLog.save();

    res.status(200).json({message: 'Stock log closed successfully', stockLog});
  } catch (error) {
    res
      .status(500)
      .json({message: 'Server Error', error: (error as Error).message});
  }
};
