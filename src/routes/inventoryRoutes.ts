import express from 'express';
import {
  getInventory,
  createInventory,
} from '../controllers/inventoryController';
const router = express.Router();

router.route('/').get(getInventory).post(createInventory);

export default router;
