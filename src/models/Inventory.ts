// import mongoose, {Schema, Document, UpdateQuery} from 'mongoose';
// import InventoryChangeLog from './InventoryChangeLog'; // Ensure the path is correct

// export interface IInventory extends Document {
//   deviceType: string; // e.g., "Smartphone", "Laptop", "Speaker", "Headphone", "Tablet", "GameConsole"
//   brand: string;
//   modelName: string;
//   serialNumber: string; // More generic than IMEI, applicable to all devices
//   name: string;
//   purchasePrice: number;
//   sellingPrice?: number;
//   condition: string;
//   status: string; // e.g., "Available", "Sold", "Under Repair"
//   repairStatus?: string;
//   repairHistory?: {
//     date: Date;
//     description: string;
//     technician: {
//       _id: mongoose.Types.ObjectId;
//       name: string; // Engineer's name
//     };
//     assignedBy: {
//       _id: mongoose.Types.ObjectId;
//       name: string; // Admin's name
//     };
//     repairCost: number; // Cost of the repair
//   }[];
//   totalRepairCost?: number; // Total cost of all repairs
//   salesDate?: Date;
//   customerDetails?: {
//     name: string;
//     contact: string;
//   };
//   activities?: {
//     action: string;
//     user: mongoose.Types.ObjectId;
//     date: Date;
//     description: string;
//   }[];

//   // Generic specifications
//   specifications: {
//     [key: string]: any; // Allows for flexible specifications based on device type
//   };

//   roughness?: string;

//   // Iphones
//   faceId?: boolean; // Updated to boolean
//   idm?: boolean; // Updated to boolean
//   ibm?: boolean; // Updated to boolean
//   icm?: boolean; // Updated to boolean
//   touchId?: boolean; // Updated to boolean
//   fault?: string;

//   // Device-specific fields
//   // Smartphone & Tablet
//   storageCapacity?: string;
//   screenSize?: string;
//   // Laptop
//   processorType?: string;
//   ramSize?: string;
//   // Speaker & Headphone
//   bluetoothVersion?: string;
//   batteryLife?: string;
//   // Game Console
//   generation?: string;
//   storage?: string;

//   accessories?: string[]; // List of included accessories
//   notes?: string;
//   company: mongoose.Types.ObjectId;
//   statusLogs: {
//     status: string;
//     date: Date;
//     changedBy: mongoose.Types.ObjectId;
//   }[];
//   returns: mongoose.Types.ObjectId[];
//   calculateProfit(): Promise<number>;

//   collectedBy?: {
//     _id: mongoose.Types.ObjectId;
//     name: string;
//     contact: string;
//   };
//   paymentStatus: string; // e.g., "Not Paid", "Installment", "Paid"
//   paymentMethod?: string; // e.g., "Cash", "Transfer", "Card"
//   // bankDetails?: {
//   //   amount: number;
//   //   bankName: string;
//   //   accountNumber?: string; // Optional if needed
//   // }[];
//   bankDetails: [
//     {
//       amount: {type: Number; required: true}; // Amount paid for this method
//       paymentMethod: {
//         type: String;
//         enum: ['Cash', 'Transfer', 'Card'];
//         required: true;
//       }; // Method used
//       bankName: {type: String}; // Bank name for transfers or card payments
//       accountNumber: {type: String}; // Optional, only for transfers if needed
//       date: {type: Date; default: Date.now}; // Date of the payment
//     },
//   ];
//   installmentPayments?: {
//     amountPaid: number;
//     date: Date;
//     paymentMethod: string; // e.g., "Cash", "Transfer", "Card"
//     bankName?: string;
//     description?: string; // Additional details
//   }[];
//   totalAmountPaid?: number; // Total amount paid so far
//   trustedCollector?: boolean;
// }

// const deviceTypes = [
//   'Phone',
//   'Laptop',
//   'Speaker',
//   'Headphone',
//   'Tablet',
//   'GameConsole',
//   'Router',
// ];

// const inventorySchema: Schema<IInventory> = new Schema(
//   {
//     deviceType: {
//       type: String,
//       required: true,
//       enum: deviceTypes,
//     },
//     brand: {type: String, required: true},
//     modelName: {type: String, required: true},
//     serialNumber: {type: String, required: true},
//     name: {type: String, required: true},
//     purchasePrice: {type: Number, required: true},
//     sellingPrice: {type: Number},
//     condition: {type: String, required: true},
//     status: {
//       type: String,
//       required: true,
//       enum: [
//         'Available',
//         'In Stock',
//         'Sold',
//         'Under Repair',
//         'Collected (Unpaid)',
//         'Returned', // Add Returned status
//       ],
//       default: 'Available',
//     },
//     repairStatus: {type: String, enum: ['In Progress', 'Completed']},
//     repairHistory: [
//       {
//         date: {type: Date, default: Date.now},
//         description: {type: String},
//         technician: {
//           name: {type: String, required: true},
//         },
//         assignedBy: {
//           _id: {type: Schema.Types.ObjectId, ref: 'User'},
//           name: {type: String, required: true},
//         },
//         repairCost: {type: Number},
//       },
//     ],
//     totalRepairCost: {type: Number, default: 0}, // Total cost of all repairs
//     salesDate: {type: Date},
//     customerDetails: {
//       name: {type: String},
//       contact: {type: String},
//     },
//     activities: [
//       {
//         action: {type: String},
//         user: {type: Schema.Types.ObjectId, ref: 'User'},
//         date: {type: Date, default: Date.now},
//         description: {type: String},
//       },
//     ],
//     specifications: {type: Schema.Types.Mixed},
//     storageCapacity: {type: String, required: false},
//     roughness: {type: String},
//     faceId: {type: Boolean}, // Updated to boolean
//     idm: {type: Boolean}, // Updated to boolean
//     ibm: {type: Boolean}, // Updated to boolean
//     icm: {type: Boolean}, // Updated to boolean
//     touchId: {type: Boolean}, // Updated to boolean
//     fault: {type: String},
//     screenSize: {type: String},
//     processorType: {type: String},
//     ramSize: {type: String},
//     bluetoothVersion: {type: String},
//     batteryLife: {type: String},
//     generation: {type: String},
//     storage: {type: String},
//     accessories: [{type: String}],
//     notes: {type: String},
//     company: {type: Schema.Types.ObjectId, ref: 'Company', required: true},
//     statusLogs: [
//       {
//         status: {type: String, required: true},
//         date: {type: Date, default: Date.now},
//         changedBy: {type: Schema.Types.ObjectId, ref: 'User', required: true},
//       },
//     ],
//     returns: [{type: Schema.Types.ObjectId, ref: 'Return'}],

//     collectedBy: {
//       name: {type: String},
//       contact: {type: String},
//     },
//     paymentStatus: {
//       type: String,
//       enum: ['Not Paid', 'Installment', 'Paid'],
//       default: 'Not Paid',
//     },
//     paymentMethod: {type: String, enum: ['Cash', 'Transfer', 'Card']},
//     bankDetails: [
//       {
//         amount: {type: Number, required: true},
//         bankName: {type: String, required: true},
//         accountNumber: {type: String},
//       },
//     ],
//     installmentPayments: [
//       {
//         amountPaid: {type: Number, required: true},
//         date: {type: Date, default: Date.now},
//         paymentMethod: {type: String, enum: ['Cash', 'Transfer', 'Card']},
//         bankName: {type: String},
//         description: {type: String},
//       },
//     ],
//     totalAmountPaid: {type: Number, default: 0},
//     trustedCollector: {type: Boolean, default: false},
//   },
//   {
//     timestamps: true,
//   },
// );

// // Calculate the total repair cost whenever the repairHistory array is updated
// inventorySchema.pre('save', function (next) {
//   this.totalRepairCost = this.repairHistory?.reduce((total, entry) => {
//     return total + (entry.repairCost || 0);
//   }, 0);
//   next();
// });

// // inventorySchema.methods.calculateProfit = async function (): Promise<number> {
// //   let profit = this.sellingPrice - this.purchasePrice;

// //   // Subtract repair costs
// //   profit -= this.totalRepairCost || 0;

// //   // Subtract refunds
// //   const returns = await mongoose.model('Return').find({inventory: this._id});
// //   for (const returnDoc of returns) {
// //     profit -= returnDoc.refundAmount;
// //   }

// //   return profit;
// // };

// inventorySchema.methods.calculateProfit = async function (): Promise<number> {
//   // Start with zero profit
//   let profit = 0;

//   // Check if the item is sold and not returned
//   if (this.status === 'Sold') {
//     profit =
//       (this.sellingPrice || 0) -
//       (this.purchasePrice || 0) -
//       (this.totalRepairCost || 0);
//   }

//   // If the item was sold and then returned with a full refund
//   if (this.status === 'Returned') {
//     // No profit or loss is recognized at this point
//     profit = 0;
//   }

//   // For partial refunds or items not fully returned
//   const returns = await mongoose.model('Return').find({inventory: this._id});
//   if (returns.length > 0) {
//     for (const returnDoc of returns) {
//       if (returnDoc.refundType === 'Partial') {
//         // Adjust profit for partial refund
//         profit -= returnDoc.refundAmount;
//       }
//       // For full refund, profit is already set to zero
//     }
//   }

//   return profit;
// };

// inventorySchema.methods.handleReturn = async function (returnData: {
//   refundType: 'Full' | 'Partial';
//   refundAmount: number;
//   shouldRestock: boolean;
// }): Promise<void> {
//   // Update status to 'Returned'
//   this.status = 'Returned';

//   // Recalculate profit based on refund type
//   if (returnData.refundType === 'Partial') {
//     // Adjust profit by subtracting the partial refund amount
//     await this.calculateProfit();
//   } else if (returnData.refundType === 'Full') {
//     // Set profit to zero for a full refund
//     this.sellingPrice = 0;
//   }

//   // Restock the item if needed
//   if (returnData.shouldRestock) {
//     this.status = 'Available';
//   }

//   // Save the updated inventory item
//   await this.save();
// };

// // Ensure unique IMEI within each company
// inventorySchema.index({serialNumber: 1, company: 1}, {unique: true});

// inventorySchema.pre('findOneAndUpdate', async function (next) {
//   console.log('Pre-update hook triggered');
//   const docToUpdate = await this.model.findOne(this.getQuery());
//   const update = this.getUpdate() as any;

//   if (docToUpdate && update.$set) {
//     const changes: Array<{field: string; oldValue: any; newValue: any}> = [];

//     for (const [key, newValue] of Object.entries(update.$set)) {
//       const oldValue = docToUpdate.get(key);
//       if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
//         changes.push({field: key, oldValue, newValue});
//       }
//     }

//     if (changes.length > 0) {
//       (this as any)._changes = changes;
//       (this as any)._user = update.$set._user;
//       delete update.$set._user;
//     }
//   }

//   next();
// });

// // Modify the post-update hook
// inventorySchema.post('findOneAndUpdate', async function (doc) {
//   console.log('Post-update hook triggered');
//   const changes = (this as any)._changes;
//   const user = (this as any)._user;

//   console.log('Changes:', changes);
//   console.log('User:', user);

//   if (changes && changes.length > 0 && user) {
//     try {
//       await InventoryChangeLog.create({
//         inventory: doc._id,
//         user: user,
//         changes: changes,
//       });
//       console.log('Inventory changelog created successfully');
//     } catch (error) {
//       console.error('Error logging inventory changes:', error);
//     }
//   } else {
//     console.log('No changes to log or missing user information');
//   }
// });

// // Define and export the Inventory model
// const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);

// export default Inventory;

import mongoose, {Schema, Document} from 'mongoose';
import InventoryChangeLog from './InventoryChangeLog';

export interface IInventory extends Document {
  deviceType: string; // e.g., "Smartphone", "Laptop", etc.
  brand: string;
  modelName: string;
  serialNumber: string; // Generic serial number
  name: string;
  color: string;
  purchasePrice: number;
  sellingPrice?: number;
  condition: string;
  status: string; // e.g., "Available", "Sold", etc.
  repairStatus?: string;
  repairHistory?: {
    date: Date;
    description: string;
    technician: {
      _id: mongoose.Types.ObjectId;
      name: string;
    };
    assignedBy: {
      _id: mongoose.Types.ObjectId;
      name: string;
    };
    repairCost: number;
  }[];
  totalRepairCost?: number;
  salesDate?: Date;
  customerDetails?: {
    name: string;
    contact: string;
  };
  activities?: {
    action: string;
    user: mongoose.Types.ObjectId;
    date: Date;
    description: string;
  }[];
  specifications: {[key: string]: any};
  roughness?: string;
  faceId?: boolean;
  idm?: boolean;
  ibm?: boolean;
  icm?: boolean;
  touchId?: boolean;
  fault?: string;
  storageCapacity?: string;
  screenSize?: string;
  processorType?: string;
  ramSize?: string;
  bluetoothVersion?: string;
  batteryLife?: string;
  generation?: string;
  storage?: string;
  accessories?: string[];
  notes?: string;
  company: mongoose.Types.ObjectId;
  statusLogs: {
    status: string;
    date: Date;
    changedBy: mongoose.Types.ObjectId;
  }[];
  returns: mongoose.Types.ObjectId[];
  collectedBy?: {
    _id: mongoose.Types.ObjectId;
    name: string;
    contact: string;
  };
  paymentStatus: string; // e.g., "Not Paid", "Installment", "Paid"
  bankDetails?: {
    amount: number;
    paymentMethod: string; // "Cash", "Transfer", "Card"
    bankName?: string;
    accountNumber?: string;
    date: Date;
  }[];
  installmentPayments?: {
    amountPaid: number;
    date: Date;
    paymentMethod: string; // "Cash", "Transfer", "Card"
    bankName?: string;
    description?: string;
  }[];
  totalAmountPaid?: number;
  trustedCollector?: boolean;
  calculateProfit(): Promise<number>;
  sellingDate: Date;
}

const deviceTypes = [
  'Phone',
  'Laptop',
  'Speaker',
  'Headphone',
  'Tablet',
  'GameConsole',
  'Router',
];

const inventorySchema: Schema<IInventory> = new Schema(
  {
    deviceType: {
      type: String,
      required: true,
      enum: deviceTypes,
    },
    brand: {type: String, required: true},
    modelName: {type: String, required: true},
    serialNumber: {type: String, required: true},
    name: {type: String, required: true},
    color: {type: String, required: true},
    purchasePrice: {type: Number, required: true},
    sellingPrice: {type: Number},
    sellingDate: {type: Date},
    condition: {type: String, required: true},
    status: {
      type: String,
      required: true,
      enum: [
        'Available',
        'In Stock',
        'Sold',
        'Under Repair',
        'Collected (Unpaid)',
        'Returned',
      ],
      default: 'Available',
    },
    repairStatus: {type: String, enum: ['In Progress', 'Completed']},
    repairHistory: [
      {
        date: {type: Date, default: Date.now},
        description: {type: String},
        technician: {
          name: {type: String, required: true},
        },
        assignedBy: {
          _id: {type: Schema.Types.ObjectId, ref: 'User'},
          name: {type: String, required: true},
        },
        repairCost: {type: Number},
      },
    ],
    totalRepairCost: {type: Number, default: 0},
    salesDate: {type: Date},
    customerDetails: {
      name: {type: String},
      contact: {type: String},
    },
    activities: [
      {
        action: {type: String},
        user: {type: Schema.Types.ObjectId, ref: 'User'},
        date: {type: Date, default: Date.now},
        description: {type: String},
      },
    ],
    specifications: {type: Schema.Types.Mixed},
    roughness: {type: String},
    faceId: {type: Boolean},
    idm: {type: Boolean},
    ibm: {type: Boolean},
    icm: {type: Boolean},
    touchId: {type: Boolean},
    fault: {type: String},
    storageCapacity: {type: String},
    screenSize: {type: String},
    processorType: {type: String},
    ramSize: {type: String},
    bluetoothVersion: {type: String},
    batteryLife: {type: String},
    generation: {type: String},
    storage: {type: String},
    accessories: [{type: String}],
    notes: {type: String},
    company: {type: Schema.Types.ObjectId, ref: 'Company', required: true},
    statusLogs: [
      {
        status: {type: String, required: true},
        date: {type: Date, default: Date.now},
        changedBy: {type: Schema.Types.ObjectId, ref: 'User', required: true},
      },
    ],
    returns: [{type: Schema.Types.ObjectId, ref: 'Return'}],
    collectedBy: {
      name: {type: String},
      contact: {type: String},
    },
    paymentStatus: {
      type: String,
      enum: ['Not Paid', 'Installment', 'Paid'],
      default: 'Not Paid',
    },
    bankDetails: [
      {
        amount: {type: Number, required: true},
        paymentMethod: {
          type: String,
          enum: ['Cash', 'Transfer', 'Card'],
          required: true,
        },
        bankName: {type: String},
        accountNumber: {type: String},
        date: {type: Date, default: Date.now},
      },
    ],
    installmentPayments: [
      {
        amountPaid: {type: Number, required: true},
        date: {type: Date, default: Date.now},
        paymentMethod: {type: String, enum: ['Cash', 'Transfer', 'Card']},
        bankName: {type: String},
        description: {type: String},
      },
    ],
    totalAmountPaid: {type: Number, default: 0},
    trustedCollector: {type: Boolean, default: false},
  },
  {timestamps: true},
);

inventorySchema.pre('save', function (next) {
  // Calculate total repair cost
  this.totalRepairCost = this.repairHistory?.reduce((total, entry) => {
    return total + (entry.repairCost || 0);
  }, 0);

  // Set sellingDate if the status is "Sold" and sellingDate is not already set
  if (this.status === 'Sold' && !this.sellingDate) {
    this.sellingDate = new Date();
  }

  next();
});

// Method to calculate profit
inventorySchema.methods.calculateProfit = async function (): Promise<number> {
  let profit = 0;
  if (this.status === 'Sold') {
    profit =
      (this.sellingPrice || 0) -
      (this.purchasePrice || 0) -
      (this.totalRepairCost || 0);
  }
  if (this.status === 'Returned') {
    profit = 0;
  }

  const returns = await mongoose.model('Return').find({inventory: this._id});
  for (const returnDoc of returns) {
    if (returnDoc.refundType === 'Partial') {
      profit -= returnDoc.refundAmount;
    }
  }

  return profit;
};

// Pre-update hook to handle sellingDate when status is updated to "Sold"
inventorySchema.pre('findOneAndUpdate', async function (next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  const update = this.getUpdate() as any;

  if (docToUpdate && update.$set) {
    // Check if status is being updated to "Sold" and sellingDate is not set
    if (
      update.$set.status === 'Sold' &&
      (!docToUpdate.sellingDate || !update.$set.sellingDate)
    ) {
      update.$set.sellingDate = new Date();
    }

    // Log changes if necessary
    const changes: Array<{field: string; oldValue: any; newValue: any}> = [];
    for (const [key, newValue] of Object.entries(update.$set)) {
      const oldValue = docToUpdate.get(key);
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({field: key, oldValue, newValue});
      }
    }
    if (changes.length > 0) {
      (this as any)._changes = changes;
      (this as any)._user = update.$set._user;
      delete update.$set._user;
    }
  }

  next();
});

// Hook to log changes and track user
inventorySchema.pre('findOneAndUpdate', async function (next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  const update = this.getUpdate() as any;

  if (docToUpdate && update.$set) {
    const changes: Array<{field: string; oldValue: any; newValue: any}> = [];
    for (const [key, newValue] of Object.entries(update.$set)) {
      const oldValue = docToUpdate.get(key);
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({field: key, oldValue, newValue});
      }
    }
    if (changes.length > 0) {
      (this as any)._changes = changes;
      (this as any)._user = update.$set._user;
      delete update.$set._user;
    }
  }

  next();
});

inventorySchema.post('findOneAndUpdate', async function (doc) {
  const changes = (this as any)._changes;
  const user = (this as any)._user;
  if (changes && user) {
    try {
      await InventoryChangeLog.create({
        inventory: doc._id,
        user: user,
        changes: changes,
      });
    } catch (error) {
      console.error('Error logging inventory changes:', error);
    }
  }
});

inventorySchema.index({serialNumber: 1, company: 1}, {unique: true});

const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);
export default Inventory;
