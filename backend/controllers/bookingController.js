// controllers/bookingController.js
import { bookSlot, cancelBooking, getMyBooking } from '../services/bookingService.js';
import { broadcastSlotChange } from '../socket.js';
import { toPublicSlot } from '../utils/publicSlot.js';

export async function handleBookSlot(req, res) {
  try {
    const { slotId } = req.body;
    if (!slotId) return res.status(400).json({ error: 'slotId is required' });

    const slot = await bookSlot({ ownerId: req.admin.id, slotId });
    await broadcastSlotChange(slot); // everyone sees it turn "reserved" live
    res.status(201).json(toPublicSlot(slot));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleCancelBooking(req, res) {
  try {
    const slot = await cancelBooking({ ownerId: req.admin.id });
    await broadcastSlotChange(slot); // slot becomes available again live
    res.json(toPublicSlot(slot));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleMyBooking(req, res) {
  try {
    const slot = await getMyBooking({ ownerId: req.admin.id });
    res.json(slot ? toPublicSlot(slot) : null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}