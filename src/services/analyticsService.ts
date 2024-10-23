import mongoose from 'mongoose';
import Inventory from '../models/Inventory'; // Ensure this path is correct

// Function to calculate total sales revenue
export const totalSalesRevenue = async (
  companyId: mongoose.Types.ObjectId,
): Promise<number> => {
  const result = await Inventory.aggregate([
    {$match: {company: companyId, status: 'Sold'}},
    {$group: {_id: null, totalRevenue: {$sum: '$sellingPrice'}}},
  ]);

  console.log(result);
  return result[0]?.totalRevenue || 0;
};

export const newTotalSalesRevenue = async (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) => {
  const result = await Inventory.aggregate([
    {
      $match: {
        company: companyId,
        status: 'Sold',
        salesDate: {$gte: startDate, $lt: endDate}, // Filter by date range
      },
    },
    {$group: {_id: null, totalRevenue: {$sum: '$sellingPrice'}}},
  ]);

  return result[0]?.totalRevenue || 0;
};

export const newTotalGadgetsSold = async (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) => {
  const result = await Inventory.countDocuments({
    company: companyId,
    status: 'Sold',
    salesDate: {$gte: startDate, $lt: endDate}, // Filter by date range
  });

  return result;
};

// export const totalSalesRevenue = async (
//   companyId: mongoose.Types.ObjectId,
// ): Promise<number> => {
//   console.log(companyId);
//   // Debug: Count total documents for the company
//   const countResult = await Inventory.aggregate([
//     {$match: {company: companyId.toString()}},
//     {$group: {_id: null, count: {$sum: 1}}},
//   ]);
//   console.log(`Total documents for company: ${countResult[0]?.count || 0}`);

//   // Debug: Log all documents for the company
//   const allDocs = await Inventory.find({company: companyId.toString()});
//   console.log(JSON.stringify(allDocs, null, 2));

//   // Main aggregation pipeline
//   const result = await Inventory.aggregate([
//     {$match: {company: companyId.toString()}}, // Convert ObjectId to string
//     {$group: {_id: null, totalRevenue: {$sum: '$sellingPrice'}}},
//   ]);

//   console.log('Aggregation result:', result);
//   return result[0]?.totalRevenue || 0;
// };

// export const totalSalesRevenue = async (

//   companyId: mongoose.Types.ObjectId,
// ): Promise<number> => {
//   console.log('Input companyId:', companyId);

//   // Debug: Log all documents for the company
//   const allDocs = await Inventory.find({company: companyId.toString()});
//   console.log('All documents:', JSON.stringify(allDocs, null, 2));

//   // Main aggregation pipeline
//   const result = await Inventory.aggregate([
//     {
//       $match: {
//         $expr: {
//           $eq: [{$toString: '$company'}, companyId.toString()],
//         },
//       },
//     },
//     {$group: {_id: null, totalRevenue: {$sum: '$sellingPrice'}}},
//   ]);

//   console.log('Aggregation result:', result);
//   return result[0]?.totalRevenue || 0;
// };

// Function to calculate average repair time
export const averageRepairTime = async (
  companyId: mongoose.Types.ObjectId,
): Promise<number> => {
  const result = await Inventory.aggregate([
    {$match: {company: companyId, repairHistory: {$exists: true}}},
    {$unwind: '$repairHistory'},
    {
      $group: {
        _id: null,
        averageTime: {
          $avg: {
            $subtract: ['$repairHistory.endDate', '$repairHistory.startDate'],
          },
        },
      },
    },
  ]);
  return result[0]?.averageTime || 0;
};

export const newAverageRepairTime = async (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) => {
  const result = await Inventory.aggregate([
    {
      $match: {
        company: companyId,
        repairHistory: {$exists: true, $ne: []},
        'repairHistory.date': {$gte: startDate, $lt: endDate}, // Filter by repair date range
      },
    },
    {$unwind: '$repairHistory'},
    {
      $group: {
        _id: null,
        avgRepairTime: {
          $avg: {
            $subtract: ['$repairHistory.endDate', '$repairHistory.startDate'],
          },
        },
      },
    },
  ]);

  return result[0]?.avgRepairTime || 0;
};

// export const totalNetProfit = async (
//   companyId: mongoose.Types.ObjectId,
// ): Promise<number> => {
//   const result = await Inventory.aggregate([
//     {$match: {company: companyId, status: 'Sold'}},
//     {
//       $group: {
//         _id: null,
//         totalRevenue: {$sum: '$sellingPrice'},
//         totalCost: {$sum: '$purchasePrice'},
//       },
//     },
//   ]);

//   console.log(result);
//   if (result.length > 0) {
//     const {totalRevenue, totalCost} = result[0];
//     return (totalRevenue || 0) - (totalCost || 0);
//   }
//   return 0;
// };

export const totalNetProfit = async (
  companyId: mongoose.Types.ObjectId,
): Promise<number> => {
  // Debug: Count total documents for the company
  const countResult = await Inventory.aggregate([
    {$match: {company: companyId}},
    {$group: {_id: null, count: {$sum: 1}}},
  ]);
  console.log(`Total documents for company: ${countResult[0]?.count || 0}`);

  // Debug: Log all documents for the company
  const allDocs = await Inventory.find({company: companyId});
  console.log(JSON.stringify(allDocs, null, 2));

  // Original aggregation pipeline
  const result = await Inventory.aggregate([
    {$match: {company: companyId, status: 'Sold'}},
    {
      $group: {
        _id: null,
        totalRevenue: {$sum: '$sellingPrice'},
        totalCost: {$sum: '$purchasePrice'},
      },
    },
  ]);

  console.log(result);
  if (result.length > 0) {
    const {totalRevenue, totalCost} = result[0];
    return (totalRevenue || 0) - (totalCost || 0);
  }
  return 0;
};

export const newTotalNetProfit = async (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) => {
  // Calculate total revenue (sum of all selling prices of sold items within the date range)
  const revenueResult = await Inventory.aggregate([
    {
      $match: {
        company: companyId,
        status: 'Sold',
        salesDate: {$gte: startDate, $lt: endDate}, // Filter by date range
      },
    },
    {$group: {_id: null, totalRevenue: {$sum: '$sellingPrice'}}},
  ]);
  const totalRevenue = revenueResult[0]?.totalRevenue || 0;

  // Calculate COGS (sum of all purchase prices of sold items within the date range)
  const cogsResult = await Inventory.aggregate([
    {
      $match: {
        company: companyId,
        status: 'Sold',
        salesDate: {$gte: startDate, $lt: endDate}, // Filter by date range
      },
    },
    {$group: {_id: null, totalCOGS: {$sum: '$purchasePrice'}}},
  ]);
  const totalCOGS = cogsResult[0]?.totalCOGS || 0;

  // Calculate total repair costs within the date range
  const repairCostResult = await Inventory.aggregate([
    {
      $match: {
        company: companyId,
        repairHistory: {$exists: true, $ne: []}, // Devices with repairs
        'repairHistory.date': {$gte: startDate, $lt: endDate}, // Filter repairs by date range
      },
    },
    {$unwind: '$repairHistory'}, // Unwind the repairHistory array to sum repair costs
    {
      $group: {
        _id: null,
        totalRepairCosts: {$sum: '$repairHistory.repairCost'},
      },
    },
  ]);
  const totalRepairCosts = repairCostResult[0]?.totalRepairCosts || 0;

  // Calculate net profit
  const netProfit = totalRevenue - totalCOGS - totalRepairCosts;

  return netProfit;
};

// export const totalNetProfit = async (
//   companyId: mongoose.Types.ObjectId,
// ): Promise<number> => {
//   const result = await Inventory.aggregate([
//     {$match: {company: companyId}}, // Remove the status filter
//     {
//       $group: {
//         _id: null,
//         totalRevenue: {$sum: '$sellingPrice'},
//         totalCost: {$sum: '$purchasePrice'},
//       },
//     },
//   ]);

//   //   console.log(result);
//   if (result.length > 0) {
//     const {totalRevenue, totalCost} = result[0];
//     return (totalRevenue || 0) - (totalCost || 0);
//   }
//   return 0;
// };

export const revenueInDateRange = async (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
): Promise<number> => {
  const result = await Inventory.aggregate([
    {
      $match: {
        company: companyId,
        status: 'Sold',
        salesDate: {$gte: startDate, $lte: endDate},
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {$sum: '$sellingPrice'},
      },
    },
  ]);

  console.log(result);
  return result[0]?.totalRevenue || 0;
};

export const totalGadgetsSold = async (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) => {
  const result = await Inventory.countDocuments({
    company: companyId,
    status: 'Sold',
    salesDate: {$gte: startDate, $lt: endDate}, // Filter by date range
  });

  return result;
};

export const averageSellingPrice = async (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) => {
  const result = await Inventory.aggregate([
    {
      $match: {
        company: companyId,
        status: 'Sold',
        salesDate: {$gte: startDate, $lt: endDate}, // Filter by date range
      },
    },
    {$group: {_id: null, avgSellingPrice: {$avg: '$sellingPrice'}}},
  ]);

  return result[0]?.avgSellingPrice || 0;
};

export const totalRepairs = async (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) => {
  const result = await Inventory.countDocuments({
    company: companyId,
    status: 'Under Repair',
    'repairHistory.date': {$gte: startDate, $lt: endDate}, // Filter repair history by date
  });

  return result;
};

export const newTotalRepairCosts = async (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) => {
  const result = await Inventory.aggregate([
    {
      $match: {
        company: companyId,
        repairHistory: {$exists: true, $ne: []},
        'repairHistory.date': {$gte: startDate, $lt: endDate}, // Filter by repair date range
      },
    },
    {$unwind: '$repairHistory'},
    {
      $group: {
        _id: null,
        totalRepairCosts: {$sum: '$repairHistory.repairCost'},
      },
    },
  ]);

  return result[0]?.totalRepairCosts || 0;
};

export const totalInventoryCount = async (
  companyId: mongoose.Types.ObjectId,
) => {
  const result = await Inventory.countDocuments({
    company: companyId,
  });

  return result;
};

export const totalAvailableDevices = async (
  companyId: mongoose.Types.ObjectId,
) => {
  const result = await Inventory.countDocuments({
    company: companyId,
    status: 'Available',
  });

  return result;
};

export const totalRepairCosts = async (companyId: mongoose.Types.ObjectId) => {
  const result = await Inventory.aggregate([
    {$match: {company: companyId, repairHistory: {$exists: true, $ne: []}}},
    {$unwind: '$repairHistory'},
    {
      $group: {
        _id: null,
        totalRepairCosts: {$sum: '$repairHistory.repairCost'},
      },
    },
  ]);

  return result[0]?.totalRepairCosts || 0;
};

// analyticsService.ts
// export const generateDailyReport = async (companyId: mongoose.Types.ObjectId) => {
//   // ... logic to generate report
//   return report;
// };

const calculateTotalProfitForDay = async (
  companyId: mongoose.Types.ObjectId,
  date: Date,
) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  // Fetch all sold items for the day
  const soldItems = await Inventory.find({
    company: companyId,
    salesDate: {$gte: dayStart, $lte: dayEnd},
  });

  let totalProfit = 0;

  for (const item of soldItems) {
    // Recalculate profit per item
    const profit = await item.calculateProfit();
    totalProfit += profit;
  }

  return totalProfit;
};
