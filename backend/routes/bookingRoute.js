// routes/bookingRoute.js
import express from 'express';
import { requireOwner } from '../middleware/authMiddleware.js';
import { handleBookSlot, handleCancelBooking, handleMyBooking } from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', requireOwner, handleBookSlot);
router.delete('/me', requireOwner, handleCancelBooking);
router.get('/me', requireOwner, handleMyBooking);

export default router;