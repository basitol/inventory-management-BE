// import mongoose, {Schema, Document} from 'mongoose';
// import bcrypt from 'bcryptjs';

// export interface IUser extends Document {
//   userId: string;
//   email: string;
//   password: string;
//   permissions: mongoose.Types.ObjectId[]; // ObjectId array to reference permissions
//   company?: mongoose.Types.ObjectId;
//   isAdmin: boolean;
//   isSuperAdmin: boolean;
//   comparePassword: (candidatePassword: string) => Promise<boolean>;
// }

// const UserSchema = new Schema(
//   {
//     userId: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       lowercase: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       lowercase: true,
//     },
//     password: {
//       type: String,
//       required: true,
//       minlength: 8,
//       select: false,
//     },
//     permissions: [
//       {
//         type: Schema.Types.ObjectId,
//         ref: 'Permission',
//       },
//     ],
//     company: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Company',
//     },
//     isAdmin: {
//       type: Boolean,
//       default: false,
//     },
//     isSuperAdmin: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// UserSchema.pre<IUser>('save', async function (next) {
//   if (!this.isModified('password')) return next();

//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error: any) {
//     next(error);
//   }
// });

// UserSchema.methods.comparePassword = async function (
//   candidatePassword: string,
// ): Promise<boolean> {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// // Index for faster queries
// UserSchema.index({userId: 1});

// const User = mongoose.model<IUser>('User', UserSchema);

// async function hashExistingPasswords() {
//   const users = await User.find({}).select('+password');
//   for (let user of users) {
//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(user.password, salt);
//     await user.save();
//   }
//   console.log('All passwords have been hashed');
// }

// export {hashExistingPasswords};
// export default User;

import mongoose, {Schema, Document} from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the Permission enum
export enum Permission {
  CreateCompany = 'createCompany',
  ManageUsers = 'manageUsers',
  SetWarranty = 'setWarranty',
  ManageRoles = 'manageRoles',
  CreatePermission = 'createPermission',
  ViewPermissions = 'viewPermissions',
  ManageInventory = 'manageInventory',
  CreateAdmin = 'createAdmin',
  CreateStaff = 'createStaff',
  ViewInventory = 'viewInventory',
}

export interface IUser extends Document {
  userId: string;
  email: string;
  password: string;
  permissions: Permission[]; // Array of Permission enum values
  company?: mongoose.Types.ObjectId;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const UserSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    permissions: [
      {
        type: String,
        enum: Object.values(Permission),
      },
    ],
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for faster queries
UserSchema.index({userId: 1});

const User = mongoose.model<IUser>('User', UserSchema);

async function hashExistingPasswords() {
  const users = await User.find({}).select('+password');
  for (let user of users) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
  }
  console.log('All passwords have been hashed');
}

export {hashExistingPasswords};
export default User;
