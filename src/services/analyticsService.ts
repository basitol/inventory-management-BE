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
