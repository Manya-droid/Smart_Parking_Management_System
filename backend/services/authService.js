
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '8h'; // admin will have to login after 8 hours of inactivity

export async function registerAdmin({ name, email, password }) {
  const existing = await User.findOne({ email, role: 'admin' });
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({
    name,
    email,
    passwordHash,
    role: 'admin',
  });
   return { id: admin._id, name: admin.name, email: admin.email };

}
export async function loginAdmin({ email, password }) {
  const admin = await User.findOne({
    email: (email || '').toLowerCase().trim(),
    role: { $in: ['admin', 'staff'] },
  });
  if (!admin) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password || '', admin.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { id: admin._id, role: admin.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  return {
    token,
    admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  };
}
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerOwner({ name, email, password, phoneNumber, vehicleNumber, vehicleType }) {
  if (!name?.trim()) throw new Error('Name is required');
  if (!EMAIL_REGEX.test(email || '')) throw new Error('Enter a valid email');
  if (!password || password.length < 8) throw new Error('Password must be at least 8 characters');
  if (!phoneNumber || !vehicleNumber || !vehicleType) {
    throw new Error('Phone number, vehicle number and vehicle type are required');
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanVehicle = vehicleNumber.toUpperCase().replace(/\s/g, '');

  if (await User.findOne({ email: cleanEmail })) {
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ vehicleNumber: cleanVehicle, role: 'vehicleOwner' });

  let owner;
  if (existing) {
    if (existing.passwordHash) throw new Error('This vehicle already has an account');
    // staff ne pehle register kiya tha: usi record me login details jod do
    existing.name = name.trim();
    existing.phoneNumber = phoneNumber.trim();
    existing.vehicleType = vehicleType;
    existing.email = cleanEmail;
    existing.passwordHash = passwordHash;
    owner = await existing.save();
  } else {
    owner = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      phoneNumber: phoneNumber.trim(),
      vehicleNumber: cleanVehicle,
      vehicleType,
      role: 'vehicleOwner',
    });
  }
  return { id: owner._id, name: owner.name, email: owner.email };
}

export async function loginOwner({ email, password }) {
  const owner = await User.findOne({
    email: (email || '').toLowerCase().trim(),
    role: 'vehicleOwner',
  });
  if (!owner || !owner.passwordHash) throw new Error('Invalid email or password');

  const isMatch = await bcrypt.compare(password || '', owner.passwordHash);
  if (!isMatch) throw new Error('Invalid email or password');

  const token = jwt.sign({ id: owner._id, role: owner.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  return {
    token,
    owner: {
      id: owner._id,
      name: owner.name,
      email: owner.email,
      phoneNumber: owner.phoneNumber,
      vehicleNumber: owner.vehicleNumber,
      vehicleType: owner.vehicleType,
    },
  };
}
export async function registerStaff({ name, email, password }) {
  if (!name?.trim()) throw new Error('Name is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) throw new Error('Enter a valid email');
  if (!password || password.length < 8) throw new Error('Password must be at least 8 characters');

  const cleanEmail = email.toLowerCase().trim();
  if (await User.findOne({ email: cleanEmail })) {
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const staff = await User.create({
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    role: 'staff',
  });
  return { id: staff._id, name: staff.name, email: staff.email, role: staff.role };
}
