import mongoose, {Schema, Document, Model} from 'mongoose';

interface ChangeValues {
  old: any;
  new: any;
}

interface TransformedChangeLog {
  id: string;
  inventoryId: string;
  modifiedBy: {
    id: string;
    username: string;
    email: string;
  };
  changes: Array<{
    field: string;
    previousValue: any;
    newValue: any;
  }>;
  modifiedAt: Date;
}

// Define interface for static methods
interface IInventoryChangeLogModel extends Model<IInventoryChangeLog> {
  transformLogs(logs: IInventoryChangeLog[]): TransformedChangeLog[];
}

// Define your existing InventoryChangeLog interface
export interface IInventoryChangeLog extends Document {
  inventory: mongoose.Types.ObjectId;
  // user: mongoose.Types.ObjectId;
  user:
    | {
        _id: mongoose.Types.ObjectId;
        name: string;
        email: string;
      }
    | mongoose.Types.ObjectId;
  changedBy: mongoose.Types.ObjectId;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  changesMade: Record<string, ChangeValues>;
  changeDate: Date;
  transform(): TransformedChangeLog;
}

const InventoryChangeLogSchema: Schema = new Schema(
  {
    inventory: {
      type: Schema.Types.ObjectId,
      ref: 'Inventory',
      required: [true, 'Inventory ID is required'],
      validate: {
        validator: function (v: any) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Invalid Inventory ID format',
      },
    },
    user: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: String,
      email: String,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ChangedBy User ID is required'],
      validate: {
        validator: function (v: any) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Invalid ChangedBy User ID format',
      },
    },
    changes: [
      {
        field: {
          type: String,
          required: [true, 'Field name is required'],
        },
        oldValue: {
          type: Schema.Types.Mixed,
          required: false,
        },
        newValue: {
          type: Schema.Types.Mixed,
          required: false,
        },
        _id: false, // Disable _id for subdocuments
      },
    ],
    changesMade: {
      type: Map,
      of: new Schema(
        {
          old: Schema.Types.Mixed,
          new: Schema.Types.Mixed,
        },
        {_id: false},
      ),
      required: [true, 'Changes made record is required'],
    },
    changeDate: {
      type: Date,
      default: Date.now,
      required: [true, 'Change date is required'],
    },
  },
  {
    timestamps: true,
    strict: false, // Allow mixed data in changesMade
  },
);

// Add middleware to validate ObjectIds before saving
// InventoryChangeLogSchema.pre(
//   'save',
//   function (this: IInventoryChangeLog, next) {
//     if (!mongoose.Types.ObjectId.isValid(this.inventory.toString())) {
//       next(new Error('Invalid inventory ID'));
//       return;
//     }
//     if (!mongoose.Types.ObjectId.isValid(this.user.toString())) {
//       next(new Error('Invalid user ID'));
//       return;
//     }
//     if (!mongoose.Types.ObjectId.isValid(this.changedBy.toString())) {
//       next(new Error('Invalid changedBy ID'));
//       return;
//     }
//     next();
//   },
// );
InventoryChangeLogSchema.pre(
  'save',
  function (this: IInventoryChangeLog, next) {
    if (!mongoose.Types.ObjectId.isValid(this.inventory.toString())) {
      next(new Error('Invalid inventory ID'));
      return;
    }

    // Check if user is an object with _id
    if (typeof this.user === 'object' && '_id' in this.user) {
      if (!mongoose.Types.ObjectId.isValid(this.user._id.toString())) {
        next(new Error('Invalid user ID'));
        return;
      }
    } else {
      next(new Error('Invalid user object structure'));
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(this.changedBy.toString())) {
      next(new Error('Invalid changedBy ID'));
      return;
    }
    next();
  },
);

// InventoryChangeLogSchema.methods.transform = function (): TransformedChangeLog {
//   const user = this.user as {
//     _id: mongoose.Types.ObjectId;
//     name: string;
//     email: string;
//   };
//   return {
//     id: this._id,
//     inventoryId: this.inventory,
//     modifiedBy: {
//       id: user._id,
//       username: user.name,
//       email: user.email,
//     },
//     // modifiedBy: {
//     //   id: this.user._id,
//     //   username: this.user.name,
//     //   email: this.user.email,
//     // },
//     changes: Object.entries(this.changesMade).map(([field, values]) => {
//       const {old, new: newValue} = values as {old: any; new: any}; // Explicitly type values
//       return {
//         field,
//         previousValue: old,
//         newValue: newValue,
//       };
//     }),
//     modifiedAt: this.changeDate,
//   };
// };

// Static method to transform multiple logs

InventoryChangeLogSchema.methods.transform = function (): TransformedChangeLog {
  if (!this.user || !('name' in this.user) || !('email' in this.user)) {
    throw new Error('User data not properly populated');
  }

  return {
    id: this._id.toString(),
    inventoryId: this.inventory.toString(),
    modifiedBy: {
      id: this.user._id.toString(),
      username: this.user.name,
      email: this.user.email,
    },
    changes: Object.entries(this.changesMade).map(([field, values]) => {
      const {old, new: newValue} = values as {old: any; new: any};
      return {
        field,
        previousValue: old,
        newValue: newValue,
      };
    }),
    modifiedAt: this.changeDate,
  };
};

InventoryChangeLogSchema.statics.transformLogs = function (
  logs: IInventoryChangeLog[],
): TransformedChangeLog[] {
  return logs.map(log => log.transform());
};

const InventoryChangeLog = mongoose.model<
  IInventoryChangeLog,
  IInventoryChangeLogModel
>('InventoryChangeLog', InventoryChangeLogSchema);
export default InventoryChangeLog;
