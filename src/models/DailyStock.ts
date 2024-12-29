import mongoose, { Document, Schema } from 'mongoose';

// Interface for inventory counts by status
interface StatusCounts {
    available: number;
    inRepair: number;
    reserved: number;
    damaged: number;
}

// Interface for daily transactions
interface DailyTransactions {
    newAdditions: number;
    sales: number;
    repairs: {
        sent: number;
        completed: number;
    };
    returns: number;
}

// Interface for cash flow
interface CashFlow {
    sales: number;
    repairs: number;
    total: number;
}

// Main DailyStock interface
export interface IDailyStock extends Document {
    date: Date;
    company: mongoose.Types.ObjectId;
    openingTime: Date;
    closingTime: Date;
    openingCount: {
        total: number;
        byStatus: StatusCounts;
    };
    closingCount: {
        total: number;
        byStatus: StatusCounts;
    };
    transactions: DailyTransactions;
    cashFlow: CashFlow;
    notes: string;
    reconciled: boolean;
    reconciledBy: mongoose.Types.ObjectId;
    discrepancies: {
        type: string;
        description: string;
        quantity: number;
        value: number;
    }[];
}

const DailyStockSchema = new Schema<IDailyStock>({
    date: {
        type: Date,
        required: true,
        index: true
    },
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    openingTime: {
        type: Date,
        required: true
    },
    closingTime: Date,
    openingCount: {
        total: { type: Number, required: true },
        byStatus: {
            available: { type: Number, required: true },
            inRepair: { type: Number, required: true },
            reserved: { type: Number, required: true },
            damaged: { type: Number, required: true }
        }
    },
    closingCount: {
        total: { type: Number },
        byStatus: {
            available: { type: Number },
            inRepair: { type: Number },
            reserved: { type: Number },
            damaged: { type: Number }
        }
    },
    transactions: {
        newAdditions: { type: Number, default: 0 },
        sales: { type: Number, default: 0 },
        repairs: {
            sent: { type: Number, default: 0 },
            completed: { type: Number, default: 0 }
        },
        returns: { type: Number, default: 0 }
    },
    cashFlow: {
        sales: { type: Number, default: 0 },
        repairs: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    notes: { type: String },
    reconciled: { type: Boolean, default: false },
    reconciledBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    discrepancies: [{
        type: { type: String },
        description: { type: String },
        quantity: { type: Number },
        value: { type: Number }
    }]
});

// Index for efficient querying
DailyStockSchema.index({ company: 1, date: -1 });

// Create the model
const DailyStock = mongoose.model<IDailyStock>('DailyStock', DailyStockSchema);

export default DailyStock;
