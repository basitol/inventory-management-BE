import mongoose, {Schema, Document} from 'mongoose';

export interface IPermission extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
}

const PermissionSchema = new Schema({
  name: {type: String, required: true, unique: true},
  description: {type: String, required: true},
});

export const Permission = mongoose.model<IPermission>(
  'Permission',
  PermissionSchema,
);
