// import mongoose, {Schema, Document} from 'mongoose';

// export interface ICompany extends Document {
//   name: string;
//   address: string;
// }

// const CompanySchema = new Schema({
//   name: {type: String, required: true},
//   address: {type: String, required: true},
//   company: {
//     type: Schema.Types.ObjectId,
//     ref: 'Company',
//   },
// });

// const Company = mongoose.model<ICompany>('Company', CompanySchema);
// export default Company;

import mongoose, {Schema, Document} from 'mongoose';

export interface ICompany extends Document {
  name: string;
  address: string;
  subscriptionType: 'yearly' | '6 months' | 'monthly' | 'free';
  subscriptionStartDate: Date;
  hasAccess(): boolean;
}

const CompanySchema = new Schema({
  name: {type: String, required: true},
  address: {type: String, required: true},
  subscriptionType: {
    type: String,
    enum: ['yearly', '6 months', 'monthly', 'free'],
    required: true,
    default: 'free',
  },
  subscriptionStartDate: {type: Date, default: Date.now},
});

// Method to determine if the company still has access
CompanySchema.methods.hasAccess = function (): boolean {
  const currentDate = new Date();
  let expirationDate: Date;

  switch (this.subscriptionType) {
    case 'yearly':
      expirationDate = new Date(this.subscriptionStartDate);
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      break;
    case '6 months':
      expirationDate = new Date(this.subscriptionStartDate);
      expirationDate.setMonth(expirationDate.getMonth() + 6);
      break;
    case 'monthly':
      expirationDate = new Date(this.subscriptionStartDate);
      expirationDate.setMonth(expirationDate.getMonth() + 1);
      break;
    case 'free':
      expirationDate = new Date(this.subscriptionStartDate);
      expirationDate.setDate(expirationDate.getDate() + 14); // 2 weeks
      break;
    default:
      return false;
  }

  // Check if the current date is before the expiration date
  return currentDate < expirationDate;
};

const Company = mongoose.model<ICompany>('Company', CompanySchema);
export default Company;
