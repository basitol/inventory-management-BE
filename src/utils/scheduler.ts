// scheduler.ts
import cron from 'node-cron';
import {generateAndSendDailyReport} from '../controllers/inventoryController';

cron.schedule('0 18 * * *', async () => {
  // Runs every day at 6 PM
  // Create a mock request and response or refactor the controller for direct invocation
  // Alternatively, extract report generation logic into a service
});
