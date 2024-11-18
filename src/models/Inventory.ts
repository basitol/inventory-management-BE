import mongoose, {Schema, Document} from 'mongoose';
import InventoryChangeLog from './InventoryChangeLog';

// Define interface for User data
interface UserData {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
}

interface ChangeEntry {
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
  };
  changeDate: Date;
}

export interface IInventory extends Document {
  deviceType: string; // e.g., "Smartphone", "Laptop", etc.
  brand: string;
  modelName: string;
  serialNumber: string; // Generic serial number
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
  lockStatus?: string;
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
  connectivity?: string;
  trustedCollector?: boolean;
  calculateProfit(): Promise<number>;
  sellingDate: Date;
  changeHistory: ChangeEntry[];
}

const deviceTypes = [
  'Phone',
  'Laptop',
  'Speaker',
  'Headphone',
  'Tablet',
  'SmartWatch',
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
    color: {type: String, required: true},
    purchasePrice: {type: Number, required: false},
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
    lockStatus: {type: String},
    fault: {type: String},
    storageCapacity: {type: String},
    screenSize: {type: String},
    processorType: {type: String},
    ramSize: {type: String},
    connectivity: {type: String},
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
    changeHistory: [
      {
        field: String,
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
        changedBy: {
          _id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
          },
          name: String,
          email: String,
        },
        changeDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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

// inventorySchema.pre('findOneAndUpdate', async function (next) {
//   const update = this.getUpdate() as any;
//   const options = this.getOptions();

//   try {
//     const doc = await this.model.findOne(this.getQuery());
//     if (!doc || !update.$set) return next();

//     const changes: ChangeEntry[] = [];
//     const user = options._user; // Get user from options

//     // Compare fields and track changes
//     Object.keys(update.$set).forEach(field => {
//       if (['updatedAt', 'createdAt', '_user'].includes(field)) return;

//       const oldValue = doc.get(field);
//       const newValue = update.$set[field];

//       if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
//         changes.push({
//           field,
//           oldValue,
//           newValue,
//           changedBy: {
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//           },
//           changeDate: new Date(),
//         });
//       }
//     });

//     // If there are changes, add them to the changeHistory array
//     if (changes.length > 0) {
//       update.$push = update.$push || {};
//       update.$push.changeHistory = {
//         $each: changes,
//         $position: 0, // Add new changes at the beginning of the array
//       };
//     }

//     next();
//   } catch (error) {
//     next(error as Error);
//   }
// });

// function validateChangeLogData(doc: any, changes: any[], user: any): boolean {
//   if (!doc?._id) return false;
//   if (!Array.isArray(changes) || changes.length === 0) return false;
//   if (!user) return false;

//   return changes.every(
//     change => 'field' in change && 'oldValue' in change && 'newValue' in change,
//   );
// }

// Pre-update hook
// inventorySchema.pre('findOneAndUpdate', async function (next) {
//   try {
//     const docToUpdate = await this.model.findOne(this.getQuery());
//     const update = this.getUpdate() as any;
//     const options = this.getOptions();

//     console.log('Pre-update hook received update:', update);
//     console.log('Pre-update hook options:', options);

//     if (docToUpdate && update.$set) {
//       // Track changes
//       const changes: Array<{field: string; oldValue: any; newValue: any}> = [];

//       for (const [key, newValue] of Object.entries(update.$set)) {
//         // Skip system fields
//         if (['updatedAt', 'createdAt'].includes(key)) continue;

//         const oldValue = docToUpdate.get(key);
//         if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
//           if (key !== '_user') {
//             changes.push({field: key, oldValue, newValue});
//           }
//         }
//       }

//       // Store the changes if there are any
//       if (changes.length > 0) {
//         options._changes = changes;
//       }

//       // Store the user ID from either the update or options
//       const userId = update.$set._user || options._userId;
//       if (userId) {
//         options._user = userId;
//         // Remove _user from $set after storing it
//         delete update.$set._user;
//       }

//       this.setOptions(options);
//     }

//     next();
//   } catch (error) {
//     console.error('Error in pre-update hook:', error);
//     next(error as Error);
//   }
// });

// Post-update hook to create change log

// inventorySchema.post('findOneAndUpdate', async function (doc) {
//   try {
//     if (!doc) {
//       console.error('Post-update hook: No document found');
//       return;
//     }

//     const options = this.getOptions();
//     const changes = options._changes;
//     const userId = options._user;

//     if (!changes || changes.length === 0) {
//       return;
//     }

//     // Validate the data before creating changelog
//     if (!validateChangeLogData(doc, changes, userId)) {
//       console.error('Invalid changelog data');
//       return;
//     }

//     // Get user data with proper typing
//     const User = mongoose.model('User');
//     const userData = await User.findById(userId)
//       .select('name email')
//       .lean<UserData>();

//     if (!userData) {
//       console.error('User not found:', userId);
//       return;
//     }

//     // Create the changelog with complete user information
//     await InventoryChangeLog.create({
//       inventory: doc._id,
//       user: {
//         _id: userId,
//         name: userData.name,
//         email: userData.email,
//       },
//       changedBy: userId,
//       changes,
//       changesMade: changes.reduce(
//         (
//           acc: Record<string, {old: any; new: any}>,
//           change: {field: string; oldValue: any; newValue: any},
//         ) => {
//           acc[change.field] = {
//             old: change.oldValue,
//             new: change.newValue,
//           };
//           return acc;
//         },
//         {},
//       ),
//       changeDate: new Date(),
//     });

//     console.log('Successfully created changelog for document:', doc._id);
//   } catch (error) {
//     console.error('Failed to create changelog:', error);
//   }
// });

inventorySchema.index({serialNumber: 1, company: 1}, {unique: true});

const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);
export default Inventory;

// Hook to log changes and track user
// inventorySchema.pre('findOneAndUpdate', async function (next) {
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
// inventorySchema.pre('findOneAndUpdate', async function (next) {
//   try {
//     const docToUpdate = await this.model.findOne(this.getQuery());
//     const update = this.getUpdate() as any;

//     if (docToUpdate && update.$set) {
//       const changes: Array<{field: string; oldValue: any; newValue: any}> = [];
//       for (const [key, newValue] of Object.entries(update.$set)) {
//         const oldValue = docToUpdate.get(key);
//         if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
//           changes.push({field: key, oldValue, newValue});
//         }
//       }

//       if (changes.length > 0) {
//         // Attach changes and user for the post hook
//         (this as any)._changes = changes;
//         (this as any)._user = update.$set._user; // Ensure `_user` is set in the update
//         delete update.$set._user;
//       }
//     }

//     next();
//   } catch (error) {
//     console.error('Error in pre-update hook:', error);
//     next(error as Error);
//   }
// });

// inventorySchema.pre('findOneAndUpdate', async function (next) {
//   try {
//     const docToUpdate = await this.model.findOne(this.getQuery());
//     const update = this.getUpdate() as any;

//     if (docToUpdate && update.$set) {
//       const changes: never[] = []; // your existing changes logic
//       const options = this.getOptions();
//       options._changes = changes;
//       options._user = update.$set._user;
//       this.setOptions(options);
//     }
//     next();
//   } catch (error) {
//     next(error as Error);
//   }
// });

// // Modify the post-update hook
// // inventorySchema.post('findOneAndUpdate', async function (doc) {
// //   console.log('Post-update hook triggered');
// //   const changes = (this as any)._changes;
// //   const user = (this as any)._user;

// //   console.log('Changes:', changes);
// //   console.log('User:', user);

// //   if (changes && changes.length > 0 && user) {
// //     try {
// //       await InventoryChangeLog.create({
// //         inventory: doc._id,
// //         user: user,
// //         changes: changes,
// //       });
// //       console.log('Inventory changelog created successfully');
// //     } catch (error) {
// //       console.error('Error logging inventory changes:', error);
// //     }
// //   } else {
// //     console.log('No changes to log or missing user information');
// //   }
// // });

// function validateChangeLogData(doc: any, changes: any[], user: any): boolean {
//   if (!doc?._id) return false;
//   if (!Array.isArray(changes) || changes.length === 0) return false;
//   if (!user) return false;

//   return changes.every(
//     change => 'field' in change && 'oldValue' in change && 'newValue' in change,
//   );
// }

// inventorySchema.post('findOneAndUpdate', async function (doc) {
//   try {
//     const options = this.getOptions();
//     const changes = options._changes;
//     const user = options._user;

//     if (!doc || !changes || !user) {
//       console.error('Missing required data for changelog:', {
//         hasDoc: !!doc,
//         hasChanges: !!changes,
//         hasUser: !!user,
//       });
//       return;
//     }

//     await InventoryChangeLog.create({
//       inventory: doc._id,
//       user,
//       changedBy: user,
//       changes,
//       changesMade: changes.reduce(
//         (
//           acc: Record<string, {old: any; new: any}>,
//           change: {field: string; oldValue: any; newValue: any},
//         ) => {
//           acc[change.field] = {old: change.oldValue, new: change.newValue};
//           return acc;
//         },
//         {},
//       ),
//       changeDate: new Date(),
//     });
//   } catch (error) {
//     console.error('Failed to create changelog:', error);
//     // Implement retry mechanism or error notification system
//   }
// });
// // inventorySchema.post('findOneAndUpdate', async function (doc) {
// //   try {
// //     const changes = (this as any)._changes;
// //     const user = (this as any)._user;

// //     if (!doc) {
// //       console.error('Post-update hook: No document found to log');
// //       return;
// //     }

// //     if (changes && changes.length > 0 && user) {
// //       await InventoryChangeLog.create({
// //         inventory: doc._id,
// //         user,
// //         changedBy: user,
// //         changes,
// //         changesMade: changes.reduce(
// //           (
// //             acc: Record<string, {old: any; new: any}>,
// //             change: {field: string; oldValue: any; newValue: any},
// //           ) => {
// //             acc[change.field] = {old: change.oldValue, new: change.newValue};
// //             return acc;
// //           },
// //           {},
// //         ),
// //         changeDate: new Date(),
// //       });

// //       console.log('Inventory changelog created successfully');
// //     } else {
// //       console.log('Post-update hook: No changes detected or missing user');
// //     }
// //   } catch (error) {
// //     console.error('Error logging inventory changes:', error);
// //   }
// // });

// // inventorySchema.post('findOneAndUpdate', async function (doc) {
// //   const changes = (this as any)._changes;
// //   const user = (this as any)._user;
// //   if (changes && user) {
// //     try {
// //       await InventoryChangeLog.create({
// //         inventory: doc._id,
// //         user: user,
// //         changes: changes,
// //       });
// //     } catch (error) {
// //       console.error('Error logging inventory changes:', error);
// //     }
// //   }
// // });

// inventorySchema.index({serialNumber: 1, company: 1}, {unique: true});

// const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);
// export default Inventory;

// ... [Keep all your existing schema definition until the hooks]

// // Pre-update hook to handle selling date and track changes
// inventorySchema.pre('findOneAndUpdate', async function (next) {
//   try {
//     const docToUpdate = await this.model.findOne(this.getQuery());
//     const update = this.getUpdate() as any;

//     if (docToUpdate && update.$set) {
//       // Handle selling date logic
//       if (
//         update.$set.status === 'Sold' &&
//         (!docToUpdate.sellingDate || !update.$set.sellingDate)
//       ) {
//         update.$set.sellingDate = new Date();
//       }

//       // Track changes
//       const changes: Array<{field: string; oldValue: any; newValue: any}> = [];
//       for (const [key, newValue] of Object.entries(update.$set)) {
//         if (key === '_user') continue; // Skip tracking changes to the _user field
//         const oldValue = docToUpdate.get(key);
//         if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
//           changes.push({field: key, oldValue, newValue});
//         }
//       }

//       if (changes.length > 0) {
//         // Store changes and user in options for the post hook
//         const options = this.getOptions();
//         options._changes = changes;
//         options._user = update.$set._user;
//         this.setOptions(options);

//         // Remove _user from the update after storing it
//         delete update.$set._user;
//       }
//     }

//     next();
//   } catch (error) {
//     console.error('Error in pre-update hook:', error);
//     next(error as Error);
//   }
// });

// Post-update hook to create change log
// inventorySchema.post('findOneAndUpdate', async function (doc) {
//   try {
//     if (!doc) {
//       console.error('Post-update hook: No document found');
//       return;
//     }

//     const options = this.getOptions();
//     const changes = options._changes;
//     const user = options._user;

//     // Validate the data before creating changelog
//     if (!validateChangeLogData(doc, changes, user)) {
//       console.error('Invalid changelog data:', {
//         hasDoc: !!doc,
//         hasChanges: !!changes,
//         hasUser: !!user,
//         changes,
//       });
//       return;
//     }

//     // Create the changelog
//     await InventoryChangeLog.create({
//       inventory: doc._id,
//       user,
//       changedBy: user,
//       changes,
//       changesMade: changes.reduce(
//         (
//           acc: Record<string, {old: any; new: any}>,
//           change: {field: string; oldValue: any; newValue: any},
//         ) => {
//           acc[change.field] = {
//             old: change.oldValue,
//             new: change.newValue,
//           };
//           return acc;
//         },
//         {},
//       ),
//       changeDate: new Date(),
//     });

//     console.log('Successfully created changelog for document:', doc._id);
//   } catch (error) {
//     console.error('Failed to create changelog:', error);
//     // Here you could implement a retry mechanism or notification system
//   }
// });

// inventorySchema.post('findOneAndUpdate', async function (doc) {
//   try {
//     if (!doc) {
//       console.error('Post-update hook: No document found');
//       return;
//     }

//     const options = this.getOptions();
//     console.log('options', options);
//     const changes = options._changes;
//     const user = options._id;

//     // Skip logging if there are only system field changes
//     if (!changes || changes.length === 0) {
//       return;
//     }

//     // Log detailed information about the state
//     console.log('Change logging state:', {
//       documentId: doc._id,
//       hasChanges: !!changes,
//       changeCount: changes?.length,
//       hasUser: !!user,
//       userId: user,
//       changes,
//     });

//     // Validate the data before creating changelog
//     if (!validateChangeLogData(doc, changes, user)) {
//       console.error('Invalid changelog data:', {
//         hasDoc: !!doc,
//         hasChanges: !!changes,
//         hasUser: !!user,
//         changes,
//         user,
//       });
//       return;
//     }

//     // Create the changelog
//     await InventoryChangeLog.create({
//       inventory: doc._id,
//       user,
//       changedBy: user,
//       changes,
//       changesMade: changes.reduce(
//         (
//           acc: Record<string, {old: any; new: any}>,
//           change: {field: string; oldValue: any; newValue: any},
//         ) => {
//           acc[change.field] = {
//             old: change.oldValue,
//             new: change.newValue,
//           };
//           return acc;
//         },
//         {},
//       ),
//       changeDate: new Date(),
//     });

//     console.log('Successfully created changelog for document:', doc._id);
//   } catch (error) {
//     console.error('Failed to create changelog:', error);
//   }
// });

// Pre-update hook to handle selling date and track changes
// inventorySchema.pre('findOneAndUpdate', async function (next) {
//   try {
//     const docToUpdate = await this.model.findOne(this.getQuery());
//     const update = this.getUpdate() as any;

//     if (docToUpdate && update.$set) {
//       // Handle selling date logic
//       if (
//         update.$set.status === 'Sold' &&
//         (!docToUpdate.sellingDate || !update.$set.sellingDate)
//       ) {
//         update.$set.sellingDate = new Date();
//       }

//       // Track changes
//       const changes: Array<{field: string; oldValue: any; newValue: any}> = [];
//       for (const [key, newValue] of Object.entries(update.$set)) {
//         // Skip system fields and _user field
//         if (['_user', 'updatedAt', 'createdAt'].includes(key)) continue;

//         const oldValue = docToUpdate.get(key);
//         if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
//           changes.push({field: key, oldValue, newValue});
//         }
//       }

//       if (changes.length > 0) {
//         const options = this.getOptions();
//         options._changes = changes;
//         options._user = update.$set._user;
//         this.setOptions(options);
//       }
//     }

//     next();
//   } catch (error) {
//     console.error('Error in pre-update hook:', error);
//     next(error as Error);
//   }
// });

// // Post-update hook to create change log
// inventorySchema.post('findOneAndUpdate', async function (doc) {
//   try {
//     if (!doc) {
//       console.error('Post-update hook: No document found');
//       return;
//     }

//     const options = this.getOptions();
//     console.log('options', options);
//     const changes = options._changes;
//     const user = options._user; // Fixed: was using _id instead of _user

//     // Skip logging if there are only system field changes
//     if (!changes || changes.length === 0) {
//       return;
//     }

//     // Log detailed information about the state
//     console.log('Change logging state:', {
//       documentId: doc._id,
//       hasChanges: !!changes,
//       changeCount: changes?.length,
//       hasUser: !!user,
//       userId: user,
//       changes,
//     });

//     // Validate the data before creating changelog
//     if (!validateChangeLogData(doc, changes, user)) {
//       console.error('Invalid changelog data:', {
//         hasDoc: !!doc,
//         hasChanges: !!changes,
//         hasUser: !!user,
//         changes,
//         user,
//       });
//       return;
//     }

//     // Create the changelog
//     await InventoryChangeLog.create({
//       inventory: doc._id,
//       user,
//       changedBy: user,
//       changes,
//       changesMade: changes.reduce(
//         (
//           acc: Record<string, {old: any; new: any}>,
//           change: {field: string; oldValue: any; newValue: any},
//         ) => {
//           acc[change.field] = {
//             old: change.oldValue,
//             new: change.newValue,
//           };
//           return acc;
//         },
//         {},
//       ),
//       changeDate: new Date(),
//     });

//     console.log('Successfully created changelog for document:', doc._id);
//   } catch (error) {
//     console.error('Failed to create changelog:', error);
//   }
// });
