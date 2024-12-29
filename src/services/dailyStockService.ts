import nodemailer from 'nodemailer';
import DailyStock from '../models/DailyStock';
import { IDailyStock } from '../models/DailyStock';

// Configure nodemailer (you'll need to add your email credentials)
const transporter = nodemailer.createTransport({
    // Add your email service configuration here
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const generateDailyReport = async (dailyStock: IDailyStock) => {
    const {
        date,
        openingCount,
        closingCount,
        transactions,
        cashFlow,
        discrepancies
    } = dailyStock;

    // Calculate key metrics
    const netInventoryChange = closingCount.total - openingCount.total;
    const totalTransactions = transactions.sales + transactions.repairs.sent + transactions.returns;
    
    // Generate HTML report
    const reportHtml = `
        <h2>Daily Stock Report - ${new Date(date).toLocaleDateString()}</h2>
        
        <h3>Inventory Summary</h3>
        <ul>
            <li>Opening Stock: ${openingCount.total}</li>
            <li>Closing Stock: ${closingCount.total}</li>
            <li>Net Change: ${netInventoryChange}</li>
        </ul>

        <h3>Transactions</h3>
        <ul>
            <li>Sales: ${transactions.sales}</li>
            <li>Repairs Sent: ${transactions.repairs.sent}</li>
            <li>Repairs Completed: ${transactions.repairs.completed}</li>
            <li>Returns: ${transactions.returns}</li>
            <li>New Additions: ${transactions.newAdditions}</li>
        </ul>

        <h3>Financial Summary</h3>
        <ul>
            <li>Total Sales Revenue: $${cashFlow.sales}</li>
            <li>Repair Revenue: $${cashFlow.repairs}</li>
            <li>Total Revenue: $${cashFlow.total}</li>
        </ul>

        ${discrepancies.length > 0 ? `
            <h3>Discrepancies</h3>
            <ul>
                ${discrepancies.map(d => `
                    <li>${d.description} (${d.type})</li>
                `).join('')}
            </ul>
        ` : ''}
    `;

    return reportHtml;
};

export const sendDiscrepancyAlert = async (
    dailyStock: IDailyStock,
    recipientEmail: string
) => {
    if (dailyStock.discrepancies.length === 0) return;

    const discrepancyHtml = `
        <h2>Stock Discrepancy Alert - ${new Date(dailyStock.date).toLocaleDateString()}</h2>
        
        <h3>Detected Discrepancies:</h3>
        <ul>
            ${dailyStock.discrepancies.map(d => `
                <li>${d.description} (${d.type})</li>
            `).join('')}
        </ul>

        <p>Please investigate these discrepancies and take necessary action.</p>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `Stock Discrepancy Alert - ${new Date(dailyStock.date).toLocaleDateString()}`,
            html: discrepancyHtml
        });
    } catch (error) {
        console.error('Error sending discrepancy alert:', error);
        throw error;
    }
};

export const sendDailyReport = async (
    dailyStock: IDailyStock,
    recipientEmail: string
) => {
    try {
        const reportHtml = await generateDailyReport(dailyStock);
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `Daily Stock Report - ${new Date(dailyStock.date).toLocaleDateString()}`,
            html: reportHtml
        });
    } catch (error) {
        console.error('Error sending daily report:', error);
        throw error;
    }
};
