import mongoose, {Schema, Document} from 'mongoose';

export interface ICompany extends Document {
  name: string;
  address: string;
}

const CompanySchema = new Schema({
  name: {type: String, required: true},
  address: {type: String, required: true},
});

const Company = mongoose.model<ICompany>('Company', CompanySchema);
export default Company;
