// routes/authRoutes.js
import { requireAdmin } from '../middleware/authMiddleware.js';
import express from 'express';
import { handleAdminRegister, handleAdminLogin, handleOwnerRegister, handleOwnerLogin,handleStaffRegister} from '../controllers/authController.js';

const router = express.Router();

router.post('/admin/register', requireAdmin, handleAdminRegister); // now admin-only: closes the open hole
router.post('/admin/login', handleAdminLogin);
router.post('/owner/register', handleOwnerRegister);
router.post('/owner/login', handleOwnerLogin)
router.post('/staff/register', requireAdmin, handleStaffRegister);

export default router;