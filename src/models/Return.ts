import mongoose, {Schema, Document} from 'mongoose';

export interface IReturn extends Document {
  inventory: mongoose.Types.ObjectId;
  returnDate: Date;
  refundAmount: number;
  refundType: 'Full' | 'Partial';
  damage: string;
  notes: string;
  company: mongoose.Types.ObjectId;
}

const returnSchema: Schema<IReturn> = new Schema({
  inventory: {type: Schema.Types.ObjectId, ref: 'Inventory', required: true},
  returnDate: {type: Date, default: Date.now},
  refundAmount: {type: Number, required: true},
  refundType: {type: String, enum: ['Full', 'Partial'], required: true},
  damage: String,
  notes: String,
  company: {type: Schema.Types.ObjectId, ref: 'Company', required: true},
});

const Return = mongoose.model<IReturn>('Return', returnSchema);

export default Return;
