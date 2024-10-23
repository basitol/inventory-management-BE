// CycleCount.ts
import mongoose, {Document, Schema} from 'mongoose';

export interface ICycleCount extends Document {
  inventoryItem: mongoose.Types.ObjectId;
  countedQuantity: number;
  discrepancy: number;
  countedBy: mongoose.Types.ObjectId;
  countDate: Date;
}

const CycleCountSchema: Schema = new Schema({
  inventoryItem: {
    type: mongoose.Types.ObjectId,
    ref: 'Inventory',
    required: true,
  },
  countedQuantity: {type: Number, required: true},
  discrepancy: {type: Number, required: true},
  countedBy: {type: mongoose.Types.ObjectId, ref: 'User', required: true},
  countDate: {type: Date, default: Date.now},
});

export default mongoose.model<ICycleCount>('CycleCount', CycleCountSchema);
