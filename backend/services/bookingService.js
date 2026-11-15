// services/bookingService.js
import { Slot } from '../models/Slot.js';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';

export const HOLD_MINUTES = 30; // change this one number to change the hold time

// ---- Book a slot (Option A: held from now for HOLD_MINUTES) ----
export async function bookSlot({ ownerId, slotId }) {
  const owner = await User.findOne({ _id: ownerId, role: 'vehicleOwner' });
  if (!owner) throw new Error('Owner account not found');

  // 1. Already parked? Then there is nothing to book.
  const activeSession = await Session.findOne({
    vehicleNumber: owner.vehicleNumber,
    status: 'ACTIVE',
  });
  if (activeSession) throw new Error('Your vehicle is already parked');

  // 2. One booking per owner at a time
  const existing = await Slot.findOne({
    'reservation.status': 'RESERVED',
    'reservation.reservedBy': owner._id,
  });
  if (existing) {
    throw new Error(`You already have a booking (slot ${existing.slotNumber}). Cancel it first.`);
  }

  // 3. Atomic claim: only succeeds if the slot is still free, unreserved
  //    and matches the owner's vehicle type. Two owners can never both win.
  const now = new Date();
  const until = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

  const slot = await Slot.findOneAndUpdate(
    {
      _id: slotId,
      occupancy: 'FREE',
      type: owner.vehicleType,
      'reservation.status': { $ne: 'RESERVED' },
    },
    {
      $set: {
        'reservation.status': 'RESERVED',
        'reservation.reservedFrom': now,
        'reservation.reservedUntil': until,
        'reservation.reservedBy': owner._id,
      },
    },
    { new: true }
  );

  if (!slot) {
    throw new Error('Slot is not available for booking (taken, already reserved, or not suitable for your vehicle)');
  }
  return slot;
}

// ---- Cancel my booking ----
export async function cancelBooking({ ownerId }) {
  const slot = await Slot.findOneAndUpdate(
    { 'reservation.status': 'RESERVED', 'reservation.reservedBy': ownerId },
    {
      $set: {
        'reservation.status': 'NONE',
        'reservation.reservedFrom': null,
        'reservation.reservedUntil': null,
        'reservation.reservedBy': null,
      },
    },
    { new: true }
  );
  if (!slot) throw new Error('You have no active booking');
  return slot;
}

// ---- My current booking (or null) ----
export async function getMyBooking({ ownerId }) {
  const slot = await Slot.findOne({
    'reservation.status': 'RESERVED',
    'reservation.reservedBy': ownerId,
  });
  if (!slot) return null;

  // Expired but not yet released (Step 4 will release these automatically)
  if (slot.reservation.reservedUntil && slot.reservation.reservedUntil < new Date()) {
    return null;
  }
  return slot;
}
// ---- Release bookings whose hold time has passed (no-shows) ----
export async function releaseExpiredBookings() {
  const now = new Date();
  const expired = await Slot.find({
    'reservation.status': 'RESERVED',
    'reservation.reservedUntil': { $lt: now },
  });

  const released = [];
  for (const s of expired) {
    // re-check inside the update, so a booking cancelled or checked in meanwhile is untouched
    const slot = await Slot.findOneAndUpdate(
      {
        _id: s._id,
        'reservation.status': 'RESERVED',
        'reservation.reservedUntil': { $lt: now },
      },
      {
        $set: {
          'reservation.status': 'NONE',
          'reservation.reservedFrom': null,
          'reservation.reservedUntil': null,
          'reservation.reservedBy': null,
        },
      },
      { new: true }
    );
    if (slot) released.push(slot);
  }
  return released;
}