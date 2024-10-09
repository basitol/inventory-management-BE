import mongoose, {Schema, Document} from 'mongoose';

export interface IInventoryChangeLog extends Document {
  inventory: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  changeDate: Date;
}

const InventoryChangeLogSchema: Schema = new Schema({
  inventory: {type: Schema.Types.ObjectId, ref: 'Inventory', required: true},
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  changes: [
    {
      field: {type: String, required: true},
      oldValue: {type: Schema.Types.Mixed},
      newValue: {type: Schema.Types.Mixed},
    },
  ],
  changeDate: {type: Date, default: Date.now},
});

const InventoryChangeLog = mongoose.model<IInventoryChangeLog>(
  'InventoryChangeLog',
  InventoryChangeLogSchema,
);

export default InventoryChangeLog;
