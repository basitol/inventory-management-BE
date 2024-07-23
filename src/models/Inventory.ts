import mongoose, {Document, Schema} from 'mongoose';

interface IInventory extends Document {
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
}

const inventorySchema: Schema = new Schema(
  {
    imei: {type: String, required: true, unique: true},
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
  },
  {
    timestamps: true,
  },
);

const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);

export default Inventory;
