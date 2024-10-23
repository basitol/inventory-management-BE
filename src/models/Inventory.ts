import mongoose, {Schema, Document, UpdateQuery} from 'mongoose';
import InventoryChangeLog from './InventoryChangeLog'; // Ensure the path is correct

export interface IInventory extends Document {
  deviceType: string; // e.g., "Smartphone", "Laptop", "Speaker", "Headphone", "Tablet", "GameConsole"
  brand: string;
  modelName: string;
  serialNumber: string; // More generic than IMEI, applicable to all devices
  name: string;
  purchasePrice: number;
  sellingPrice?: number;
  condition: string;
  status: string; // e.g., "Available", "Sold", "Under Repair"
  repairStatus?: string;
  repairHistory?: {
    date: Date;
    description: string;
    technician: {
      _id: mongoose.Types.ObjectId;
      name: string; // Engineer's name
    };
    assignedBy: {
      _id: mongoose.Types.ObjectId;
      name: string; // Admin's name
    };
    repairCost: number; // Cost of the repair
  }[];
  totalRepairCost?: number; // Total cost of all repairs
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

  // Generic specifications
  specifications: {
    [key: string]: any; // Allows for flexible specifications based on device type
  };

  roughness?: string;

  // Iphones
  faceId?: boolean; // Updated to boolean
  idm?: boolean; // Updated to boolean
  ibm?: boolean; // Updated to boolean
  icm?: boolean; // Updated to boolean
  touchId?: boolean; // Updated to boolean
  fault?: string;

  // Device-specific fields
  // Smartphone & Tablet
  storageCapacity?: string;
  screenSize?: string;
  // Laptop
  processorType?: string;
  ramSize?: string;
  // Speaker & Headphone
  bluetoothVersion?: string;
  batteryLife?: string;
  // Game Console
  generation?: string;
  storage?: string;

  accessories?: string[]; // List of included accessories
  notes?: string;
  company: mongoose.Types.ObjectId;
  statusLogs: {
    status: string;
    date: Date;
    changedBy: mongoose.Types.ObjectId;
  }[];
  returns: mongoose.Types.ObjectId[];
  calculateProfit(): Promise<number>;
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
    purchasePrice: {type: Number, required: true},
    sellingPrice: {type: Number},
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
    totalRepairCost: {type: Number, default: 0}, // Total cost of all repairs
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
    storageCapacity: {type: String, required: false},
    roughness: {type: String},
    faceId: {type: Boolean}, // Updated to boolean
    idm: {type: Boolean}, // Updated to boolean
    ibm: {type: Boolean}, // Updated to boolean
    icm: {type: Boolean}, // Updated to boolean
    touchId: {type: Boolean}, // Updated to boolean
    fault: {type: String},
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
  },
  {
    timestamps: true,
  },
);

// Calculate the total repair cost whenever the repairHistory array is updated
inventorySchema.pre('save', function (next) {
  this.totalRepairCost = this.repairHistory?.reduce((total, entry) => {
    return total + (entry.repairCost || 0);
  }, 0);
  next();
});

// inventorySchema.methods.calculateProfit = async function (): Promise<number> {
//   let profit = this.sellingPrice - this.purchasePrice;

//   // Subtract repair costs
//   profit -= this.totalRepairCost || 0;

//   // Subtract refunds
//   const returns = await mongoose.model('Return').find({inventory: this._id});
//   for (const returnDoc of returns) {
//     profit -= returnDoc.refundAmount;
//   }

//   return profit;
// };

inventorySchema.methods.calculateProfit = async function (): Promise<number> {
  // Start with zero profit
  let profit = 0;

  // Check if the item is sold and not returned
  if (this.status === 'Sold') {
    profit =
      (this.sellingPrice || 0) -
      (this.purchasePrice || 0) -
      (this.totalRepairCost || 0);
  }

  // If the item was sold and then returned with a full refund
  if (this.status === 'Returned') {
    // No profit or loss is recognized at this point
    profit = 0;
  }

  // For partial refunds or items not fully returned
  const returns = await mongoose.model('Return').find({inventory: this._id});
  if (returns.length > 0) {
    for (const returnDoc of returns) {
      if (returnDoc.refundType === 'Partial') {
        // Adjust profit for partial refund
        profit -= returnDoc.refundAmount;
      }
      // For full refund, profit is already set to zero
    }
  }

  return profit;
};

// Ensure unique IMEI within each company
inventorySchema.index({serialNumber: 1, company: 1}, {unique: true});

inventorySchema.pre('findOneAndUpdate', async function (next) {
  console.log('Pre-update hook triggered');
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

// Modify the post-update hook
inventorySchema.post('findOneAndUpdate', async function (doc) {
  console.log('Post-update hook triggered');
  const changes = (this as any)._changes;
  const user = (this as any)._user;

  console.log('Changes:', changes);
  console.log('User:', user);

  if (changes && changes.length > 0 && user) {
    try {
      await InventoryChangeLog.create({
        inventory: doc._id,
        user: user,
        changes: changes,
      });
      console.log('Inventory changelog created successfully');
    } catch (error) {
      console.error('Error logging inventory changes:', error);
    }
  } else {
    console.log('No changes to log or missing user information');
  }
});

// Define and export the Inventory model
const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);

export default Inventory;
