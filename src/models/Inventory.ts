import mongoose, {Schema, Document} from 'mongoose';

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

// Extend the IInventory interface to include _user
interface IInventoryWithUser extends IInventory {
  _user?: {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
  };
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

const inventorySchema: Schema<IInventoryWithUser> = new Schema(
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
      date: {type: Date, default: Date.now()},
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
        // accountNumber: {type: String},
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

inventorySchema.pre('save', function (next) {
  if (this.isModified()) {
    // Get the modified fields
    const modifiedPaths = this.modifiedPaths();

    // Iterate through each modified field and store changes
    for (const field of modifiedPaths) {
      const oldValue = this.get(field, null, {getters: false});
      const newValue = this.get(field);

      // Push the change into the changeHistory
      if (oldValue !== newValue) {
        this.changeHistory.push({
          field,
          oldValue,
          newValue,
          changedBy: this._user || {
            _id: new mongoose.Types.ObjectId(),
            name: 'Unknown',
            email: 'unknown@example.com',
          },
          changeDate: new Date(),
        });
      }
    }
  }
  next();
});

inventorySchema.pre('findOneAndUpdate', async function (next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  const update = this.getUpdate() as any;

  if (docToUpdate && update.$set) {
    const changes: Array<{field: string; oldValue: any; newValue: any}> = [];

    // Iterate through update fields to log changes
    for (const [field, newValue] of Object.entries(update.$set)) {
      const oldValue = docToUpdate.get(field);
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({field, oldValue, newValue});
      }
    }

    // Store changes and user information in `update` object
    if (changes.length > 0) {
      update.$push = update.$push || {};
      update.$push.changeHistory = {
        $each: changes.map(change => ({
          ...change,
          changedBy: update.$set._user, // Pass user details from the update
          changeDate: new Date(),
        })),
        $position: 0, // Add new changes at the start
      };
    }

    // Remove _user field to avoid storing it in the document
    delete update.$set._user;
  }

  next();
});

inventorySchema.index({serialNumber: 1, company: 1}, {unique: true});

const Inventory = mongoose.model<IInventoryWithUser>(
  'Inventory',
  inventorySchema,
);
export default Inventory;
