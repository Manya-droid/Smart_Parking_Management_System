// services/sessionService.js
import { Slot } from '../models/Slot.js';
import { Session } from '../models/Session.js';
import { Rate } from '../models/Rate.js';
import { User } from '../models/User.js';
import { recommend } from './recommendationService.js';
import { calculateDurationMinutes, calculateFare } from './fareService.js';

// ---- Original manual check-in (slotId pehle se pata ho to) ----
export async function checkIn({ vehicleNumber, vehicleType, slotId }) {
  const slot = await Slot.findOneAndUpdate(
    { _id: slotId, occupancy: 'FREE' },
    { occupancy: 'OCCUPIED' },
    { new: true }
  );

  if (!slot) {
    throw new Error('Slot is not available (already occupied or does not exist)');
  }

  const session = await Session.create({
    vehicleNumber: vehicleNumber.toUpperCase(),
    vehicleType,
    slot: slot._id,
    slotNumber: slot.slotNumber,
    checkInTime: new Date(),
    status: 'ACTIVE',
  });

  slot.currentSession = session._id;
  await slot.save();

  return { session, slot };
}

// ---- Checkout — dono flows (manual aur walk-in) isi ko use karenge ----
export async function checkOut({ vehicleNumber }) {
  const session = await Session.findOne({
    vehicleNumber: vehicleNumber.toUpperCase(),
    status: 'ACTIVE',
  });

  if (!session) {
    throw new Error('No active session found for this vehicle');
  }

  const checkOutTime = new Date();
  const durationMinutes = calculateDurationMinutes(session.checkInTime, checkOutTime);

  const rate = await Rate.findOne({ vehicleType: session.vehicleType });
  if (!rate) {
    throw new Error(`No rate configured for vehicle type: ${session.vehicleType}`);
  }

  const fare = calculateFare(durationMinutes, rate);

  session.checkOutTime = checkOutTime;
  session.durationMinutes = durationMinutes;
  session.fare = fare;
  session.status = 'COMPLETED';
  await session.save();

  const slot = await Slot.findByIdAndUpdate(
    session.slot,
    { occupancy: 'FREE', currentSession: null },
    { new: true }
  );

  return { session, slot };
}
// purana checkOut tha, ab "initiateCheckout" — session ACTIVE hi rehta hai, sirf fare dikhata hai
export async function initiateCheckout({ vehicleNumber }) {
  const session = await Session.findOne({
    vehicleNumber: vehicleNumber.toUpperCase(),
    status: 'ACTIVE',
  });

  if (!session) {
    throw new Error('No active session found for this vehicle');
  }

  const checkOutTime = new Date();
  const durationMinutes = calculateDurationMinutes(session.checkInTime, checkOutTime);

  const rate = await Rate.findOne({ vehicleType: session.vehicleType });
  if (!rate) {
    throw new Error(`No rate configured for vehicle type: ${session.vehicleType}`);
  }

  const fare = calculateFare(durationMinutes, rate);

  // sirf fare/duration save karo, session abhi ACTIVE hi rahega
  session.durationMinutes = durationMinutes;
  session.fare = fare;
  await session.save();

  return { session };
}

// naya function — payment confirm hone par slot free hoga
export async function confirmPayment({ vehicleNumber, paymentMethod }) {
  const session = await Session.findOne({
    vehicleNumber: vehicleNumber.toUpperCase(),
    status: 'ACTIVE',
  });

  if (!session) {
    throw new Error('No pending checkout found for this vehicle');
  }
  if (!session.fare) {
    throw new Error('Fare not calculated yet. Please initiate checkout first.');
  }

  session.checkOutTime = new Date();
  session.status = 'COMPLETED';
  session.paymentStatus = 'PAID';
  session.paymentMethod = paymentMethod;
  await session.save();

  const slot = await Slot.findByIdAndUpdate(
    session.slot,
    { occupancy: 'FREE', currentSession: null },
    { new: true }
  );

  return { session, slot };
}
// ---- Walk-in check-in: vehicle number se auto owner-lookup + auto slot assign ----
export async function checkInWalkIn({ name, phoneNumber, vehicleNumber, vehicleType, preferredZone = null })  {
  const upperVehicleNumber = vehicleNumber.toUpperCase();

  // Step 1: Owner dhundo, nahi mila to naya banao
  let owner = await User.findOne({ vehicleNumber: upperVehicleNumber, role: 'vehicleOwner' });
  if (!owner) {
    owner = await User.create({
      name,
      phoneNumber,
      vehicleNumber: upperVehicleNumber,
      vehicleType,
      role: 'vehicleOwner',
    });
  }

  // Step 2: Check karo ye vehicle already andar to nahi hai
  const activeSession = await Session.findOne({
    vehicleNumber: upperVehicleNumber,
    status: 'ACTIVE',
  });
  if (activeSession) {
    throw new Error('This vehicle is already checked in');
  }

    // Step 3: Does this owner hold a live booking?
  let claimedSlot = null;
  const booked = await Slot.findOne({
    'reservation.status': 'RESERVED',
    'reservation.reservedBy': owner._id,
    'reservation.reservedUntil': { $gte: new Date() },
  });

  if (booked) {
    // Use the booked slot and clear the booking in the same atomic update
    claimedSlot = await Slot.findOneAndUpdate(
      { _id: booked._id, occupancy: 'FREE', 'reservation.reservedBy': owner._id },
      {
        $set: {
          occupancy: 'OCCUPIED',
          'reservation.status': 'NONE',
          'reservation.reservedFrom': null,
          'reservation.reservedUntil': null,
          'reservation.reservedBy': null,
        },
      },
      { new: true }
    );
    if (!claimedSlot) {
      throw new Error('Your booked slot is no longer available, please try again');
    }
  } else {
    // No booking: pick the best slot, but never a reserved one
    const freeSlots = await Slot.find({
      occupancy: 'FREE',
      type: vehicleType,
      'reservation.status': { $ne: 'RESERVED' },
    });
    if (freeSlots.length === 0) {
      throw new Error('No free slots available for this vehicle type right now');
    }
    const ranked = recommend(freeSlots, { vehicleType, preferredZone });
    const bestSlot = ranked[0].slot;

    // Step 4: Atomic claim (race condition safe)
    claimedSlot = await Slot.findOneAndUpdate(
      { _id: bestSlot._id, occupancy: 'FREE', 'reservation.status': { $ne: 'RESERVED' } },
      { occupancy: 'OCCUPIED' },
      { new: true }
    );
    if (!claimedSlot) {
      throw new Error('Slot was just taken, please try again');
    }
  }

  // Step 5: Session banao — yahi checkInTime save hota hai
  const session = await Session.create({
    vehicleNumber: upperVehicleNumber,
    vehicleType,
    slot: claimedSlot._id,
    slotNumber: claimedSlot.slotNumber,
    checkInTime: new Date(),
    status: 'ACTIVE',
  });

  claimedSlot.currentSession = session._id;
  await claimedSlot.save();

  return {
  owner: { _id: owner._id, name: owner.name, vehicleNumber: owner.vehicleNumber, vehicleType: owner.vehicleType },
  session,
  slot: claimedSlot,
  };
}
// ---- Dashboard data (admin) ----
export async function getActiveSessions() {
  return Session.find({ status: 'ACTIVE' }).sort({ checkInTime: -1 });
}

export async function getSessionHistory(limit = 50) {
  return Session.find({ status: 'COMPLETED' }).sort({ checkOutTime: -1 }).limit(limit);
}
// ---- Owner view: my current session (fare so far is calculated, not saved) ----
export async function getMyCurrentSession(ownerId) {
  const owner = await User.findOne({ _id: ownerId, role: 'vehicleOwner' });
  if (!owner) throw new Error('Owner account not found');

  const session = await Session.findOne({ vehicleNumber: owner.vehicleNumber, status: 'ACTIVE' });
  if (!session) return null;

  const durationMinutes = calculateDurationMinutes(session.checkInTime, new Date());
  const rate = await Rate.findOne({ vehicleType: session.vehicleType });

  return {
    slotNumber: session.slotNumber,
    vehicleNumber: session.vehicleNumber,
    vehicleType: session.vehicleType,
    checkInTime: session.checkInTime,
    durationMinutes,
    fareSoFar: rate ? calculateFare(durationMinutes, rate) : null,
  };
}

// ---- Owner view: my past visits ----
export async function getMyHistory(ownerId, limit = 20) {
  const owner = await User.findOne({ _id: ownerId, role: 'vehicleOwner' });
  if (!owner) throw new Error('Owner account not found');

  return Session.find({ vehicleNumber: owner.vehicleNumber, status: 'COMPLETED' })
    .sort({ checkOutTime: -1 })
    .limit(limit)
    .select('slotNumber checkInTime checkOutTime durationMinutes fare paymentMethod');
}