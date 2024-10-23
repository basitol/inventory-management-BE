import mongoose, {Schema, Document} from 'mongoose';

export interface IStockLog extends Document {
  date: Date;
  stockSummary: any; // You can structure this based on your needs
  company: mongoose.Types.ObjectId;
  postClosingUpdates: {
    timestamp: Date;
    action: string;
    itemId: mongoose.Types.ObjectId;
    details: any;
  }[];
  closed: boolean;
}

const stockLogSchema: Schema<IStockLog> = new Schema({
  date: {type: Date, required: true, default: Date.now},
  stockSummary: {type: Schema.Types.Mixed, required: true},
  company: {type: Schema.Types.ObjectId, ref: 'Company', required: true},
  postClosingUpdates: [
    {
      timestamp: {type: Date, default: Date.now},
      action: String,
      itemId: {type: Schema.Types.ObjectId, ref: 'Inventory'},
      details: Schema.Types.Mixed,
    },
  ],
  closed: {type: Boolean, default: false},
});

const StockLog = mongoose.model<IStockLog>('StockLog', stockLogSchema);

export default StockLog;
