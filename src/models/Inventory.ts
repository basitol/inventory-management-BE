import mongoose, {Schema, Document} from 'mongoose';

export interface IInventory extends Document {
  imei: string;
  name: string;
  purchasePrice: number;
  condition: string;
  roughness?: string;
  faceId?: string;
  idm?: string;
  ibm?: string;
  icm?: string;
  touchId?: string;
  fault?: string;
  company: mongoose.Types.ObjectId;
}

const inventorySchema: Schema = new Schema(
  {
    imei: {type: String, required: true},
    name: {type: String, required: true},
    purchasePrice: {type: Number, required: true},
    condition: {type: String, required: true},
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

// Correct compound index on imei and company
inventorySchema.index({imei: 1, company: 1}, {unique: true});

const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);

export default Inventory;
