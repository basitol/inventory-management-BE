import User, {hashExistingPasswords} from '../models/User';

// After connecting to the database
hashExistingPasswords().catch(console.error);
