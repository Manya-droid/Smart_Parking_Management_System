// routes/vehicleOwnerRoutes.js
import express from 'express';
import { requireStaffOrAdmin } from '../middleware/authMiddleware.js';
import { handleVehicleOwnerRegister, handleFindVehicleOwner } from '../controllers/vehicleOwnerController.js';

const router = express.Router();

router.post('/register', requireStaffOrAdmin, handleVehicleOwnerRegister);
router.get('/:vehicleNumber', requireStaffOrAdmin, handleFindVehicleOwner);

export default router;