// seed.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { Slot } from './models/Slot.js';
import { Rate } from './models/Rate.js';

const ZONES = ['A', 'B', 'C', 'D', 'E'];
const SLOTS_PER_ZONE = 100;

// har 100 slots me: 60 car, 25 bike, 10 ev, 5 disabled
function typeFor(i) {
  if (i <= 60) return 'car';
  if (i <= 85) return 'bike';
  if (i <= 95) return 'ev';
  return 'disabled';
}

const slotsData = ZONES.flatMap((zone, zIdx) =>
  Array.from({ length: SLOTS_PER_ZONE }, (_, k) => {
    const i = k + 1;
    return {
      slotNumber: `${zone}-${i}`,
      zone,
      type: typeFor(i),
      distanceFromEntry: zIdx * 50 + Math.ceil(i / 4) * 3, // door zone se door, entry se zyada distance
    };
  })
);

const ratesData = [
  { vehicleType: 'car', firstHourRate: 20, additionalHourRate: 10 },
  { vehicleType: 'bike', firstHourRate: 10, additionalHourRate: 5 },
  { vehicleType: 'ev', firstHourRate: 25, additionalHourRate: 12 },
  { vehicleType: 'disabled', firstHourRate: 15, additionalHourRate: 8 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Slot.deleteMany({});
  await Rate.deleteMany({});
  console.log('Old slots & rates cleared');

  await Slot.insertMany(slotsData);
  await Rate.insertMany(ratesData);
  console.log('Seeded', slotsData.length, 'slots and', ratesData.length, 'rates');

  await mongoose.disconnect();
  console.log('Done, disconnected');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
