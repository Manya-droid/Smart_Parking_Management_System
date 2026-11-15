// routes/sessionRoutes.js
import express from 'express';
import { handleCheckIn, handleInitiateCheckout, handleConfirmPayment , handleActiveSessions , handleSessionHistory} from '../controllers/sessionController.js';
import { requireAdmin, requireStaffOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/check-in', requireStaffOrAdmin, handleCheckIn);
router.post('/initiate-checkout', requireStaffOrAdmin, handleInitiateCheckout);
router.post('/confirm-payment', requireStaffOrAdmin, handleConfirmPayment);
router.get('/active', requireAdmin, handleActiveSessions);
router.get('/history', requireAdmin, handleSessionHistory);

export default router;