const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const ref = (m) => ({ type: Schema.Types.ObjectId, ref: m });

const User = model('User', new Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: { type: String, enum: ['tenant', 'owner', 'staff'], default: 'tenant' }
}, { timestamps: true }));

const Property = model('Property', new Schema({ name: String, address: String, owner: ref('User') }));

const Maintenance = model('Maintenance', new Schema({
  property: ref('Property'), createdBy: ref('User'),
  title: String, description: String,
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  resolutionDate: Date
}, { timestamps: true }));

const Amenity = model('Amenity', new Schema({
  name: String, property: ref('Property'),
  openTime: { type: String, default: '06:00' }, closeTime: { type: String, default: '22:00' },
  availabilityStatus: { type: String, enum: ['Available', 'Unavailable'], default: 'Available' }
}));

const Booking = model('Booking', new Schema({
  amenity: ref('Amenity'), user: ref('User'),
  date: String, startTime: String, endTime: String, // "YYYY-MM-DD", "HH:MM"
  status: { type: String, enum: ['Booked', 'Checked-In', 'Checked-Out', 'Cancelled'], default: 'Booked' },
  checkInAt: Date, checkOutAt: Date
}, { timestamps: true }));

const Rental = model('Rental', new Schema({
  property: ref('Property'), tenant: ref('User'), unit: String, rentAmount: Number,
  startDate: String, endDate: String, // "YYYY-MM-DD"
  status: { type: String, enum: ['Active', 'Ended'], default: 'Active' }
}, { timestamps: true }));

const Unit = model('Unit', new Schema({
  property: ref('Property'), name: String, rentAmount: Number // a rentable flat/room inside a property
}));

module.exports = { User, Property, Maintenance, Amenity, Booking, Rental, Unit };
