import mongoose, {Schema, Document} from 'mongoose';
import InventoryChangeLog from './InventoryChangeLog'; // Ensure the path is correct

export interface IInventory extends Document {
  imei: string;
  name: string;
  purchasePrice: number;
  sellingPrice?: number;
  condition: string;
  status: string; // e.g., "Available", "Sold", "Under Repair"
  repairStatus?: string;
  repairHistory?: {
    date: Date;
    description: string;
    technician: mongoose.Types.ObjectId;
  }[];
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
  modelName: string;
  brand: string;
  storageCapacity: string;
  roughness?: string;
  faceId?: string;
  idm?: string;
  ibm?: string;
  icm?: string;
  touchId?: string;
  fault?: string;
  company: mongoose.Types.ObjectId;
}

const inventorySchema: Schema<IInventory> = new Schema(
  {
    imei: {type: String, required: true},
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
        technician: {type: Schema.Types.ObjectId, ref: 'User'},
      },
    ],
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
    modelName: {type: String, required: true},
    brand: {type: String, required: true},
    storageCapacity: {type: String, required: true},
    roughness: {type: String},
    faceId: {type: String},
    idm: {type: String},
    ibm: {type: String},
    icm: {type: String},
    touchId: {type: String},
    fault: {type: String},
    company: {type: Schema.Types.ObjectId, ref: 'Company', required: true},
  },
  {
    timestamps: true,
  },
);

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
