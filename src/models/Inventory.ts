import mongoose, {Schema, Document} from 'mongoose';
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
}

const inventorySchema: Schema<IInventory> = new Schema(
  {
    deviceType: {type: String, required: true},
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
      enum: ['Available', 'Sold', 'Under Repair'],
      default: 'Available',
    },
    repairStatus: {type: String, enum: ['In Progress', 'Completed']},
    repairHistory: [
      {
        date: {type: Date, default: Date.now},
        description: {type: String},
        technician: {
          _id: {type: Schema.Types.ObjectId, ref: 'User'},
          name: {type: String, required: true}, // Engineer's name
        },
        assignedBy: {
          _id: {type: Schema.Types.ObjectId, ref: 'User'},
          name: {type: String, required: true}, // Admin's name
        },
        repairCost: {type: Number}, // Cost of the repair
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
    storageCapacity: {type: String, required: false},
    roughness: {type: String},
    faceId: {type: Boolean}, // Updated to boolean
    idm: {type: Boolean}, // Updated to boolean
    ibm: {type: Boolean}, // Updated to boolean
    icm: {type: Boolean}, // Updated to boolean
    touchId: {type: Boolean}, // Updated to boolean
    fault: {type: String},
    specifications: {type: Schema.Types.Mixed},
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

// Ensure unique IMEI within each company
inventorySchema.index({imei: 1, company: 1}, {unique: true});

// Pre-update hook to log changes
inventorySchema.pre('findOneAndUpdate', async function (next) {
  try {
    // Find the document to be updated
    const docToUpdate = await this.model.findOne(this.getQuery());
    const update = this.getUpdate() as Record<string, any>;

    if (docToUpdate && update) {
      const changes: Array<{field: string; oldValue: any; newValue: any}> = [];

      // Track changes between old and new values
      for (const key in update.$set) {
        if (update.$set.hasOwnProperty(key)) {
          const oldValue = docToUpdate[key as keyof IInventory];
          const newValue = update.$set[key];
          if (oldValue !== newValue) {
            changes.push({field: key, oldValue, newValue});
          }
        }
      }

      // If there are changes, attach them for logging
      if (changes.length > 0) {
        (this as any)._changes = changes;
        (this as any)._user = update.$set._user; // Safely pass user data
        delete update.$set._user; // Remove _user from the update payload
      }
    }

    next();
  } catch (error) {
    next(
      error instanceof Error
        ? error
        : new Error('An unexpected error occurred in the pre-update hook.'),
    );
  }
});

// Post-update hook to save the change log
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

// Define and export the Inventory model
const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);

export default Inventory;
