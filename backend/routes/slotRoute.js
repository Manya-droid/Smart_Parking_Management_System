import express from 'express';
import { Slot } from '../models/Slot.js';
import { requireAdmin, requireStaffOrAdmin, requireAnyLogin } from '../middleware/authMiddleware.js';
import { toPublicSlot } from '../utils/publicSlot.js';
import { User } from '../models/User.js';
import { recommend } from '../services/recommendationService.js';
const router = express.Router();

router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const total = await Slot.countDocuments();
    const occupied = await Slot.countDocuments({ occupancy: 'OCCUPIED' });
    const free = total - occupied;
    res.json({ total, occupied, free });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Preview of what check-in will assign (same rules as checkInWalkIn)
router.get('/recommend', requireStaffOrAdmin, async (req, res) => {
  try {
    const { vehicleType, preferredZone, vehicleNumber } = req.query;
    if (!['car', 'bike', 'ev', 'disabled'].includes(vehicleType)) {
      return res.status(400).json({ error: 'Valid vehicleType is required' });
    }

    // 1. If this vehicle's owner holds a live booking, check-in will use that slot
    if (vehicleNumber) {
      const owner = await User.findOne({
        vehicleNumber: vehicleNumber.toUpperCase().replace(/\s/g, ''),
        role: 'vehicleOwner',
      });
      if (owner) {
        const booked = await Slot.findOne({
          'reservation.status': 'RESERVED',
          'reservation.reservedBy': owner._id,
          'reservation.reservedUntil': { $gte: new Date() },
        });
        if (booked) {
          return res.json({ booked: toPublicSlot(booked), best: null, alternatives: [], zones: [] });
        }
      }
    }

    // 2. Otherwise score the free, unreserved slots of this type
    const [freeSlots, zones] = await Promise.all([
      Slot.find({
        occupancy: 'FREE',
        type: vehicleType,
        'reservation.status': { $ne: 'RESERVED' },
      }),
      Slot.distinct('zone', { type: vehicleType }),
      
    ]);

    const ranked = recommend(freeSlots, { vehicleType, preferredZone: preferredZone || null });
    const shape = (r) => ({ slot: toPublicSlot(r.slot), score: r.score, reasons: r.reasons });

    res.json({
      booked: null,
      best: ranked[0] ? shape(ranked[0]) : null,
      alternatives: ranked.slice(1, 4).map(shape),
      zones: zones.sort(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', requireAnyLogin, async (req, res) => {
  try {
    const slots = await Slot.find().sort({ zone: 1, slotNumber: 1 });
    res.json(slots.map(toPublicSlot));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;