require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const M = require('./models');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rental_platform');
  await Promise.all(Object.values(M).map((m) => m.deleteMany({})));
  const pw = await bcrypt.hash('password123', 10);
  const [owner, staff, tenant, tenant2] = await M.User.create([
    { name: 'Olivia Owner', email: 'owner@demo.com', password: pw, role: 'owner' },
    { name: 'Sam Staff', email: 'staff@demo.com', password: pw, role: 'staff' },
    { name: 'Tina Tenant', email: 'tenant@demo.com', password: pw, role: 'tenant' },
    { name: 'Raj Tenant', email: 'tenant2@demo.com', password: pw, role: 'tenant' }
  ]);
  const [p1, p2] = await M.Property.create([
    { name: 'Sunrise Apartments', address: 'Andheri West, Mumbai', owner: owner._id },
    { name: 'Lakeview Residency', address: 'Powai, Mumbai', owner: owner._id }
  ]);
  await M.Amenity.create([
    { name: 'Gym', property: p1._id, openTime: '06:00', closeTime: '22:00' },
    { name: 'Swimming Pool', property: p1._id, openTime: '07:00', closeTime: '20:00' },
    { name: 'Party Hall', property: p2._id, openTime: '09:00', closeTime: '23:00' },
    { name: 'Tennis Court', property: p2._id, openTime: '06:00', closeTime: '21:00', availabilityStatus: 'Unavailable' }
  ]);
  await M.Maintenance.create([
    { property: p1._id, createdBy: tenant._id, title: 'Leaking kitchen tap', description: 'Tap drips constantly.', priority: 'Medium' },
    { property: p1._id, createdBy: tenant._id, title: 'Broken hallway light', description: 'Bulb and socket need replacing.', priority: 'Low', status: 'In Progress' }
  ]);
  await M.Unit.create([
    { property: p1._id, name: 'A-101', rentAmount: 25000 }, { property: p1._id, name: 'A-102', rentAmount: 27000 }, { property: p1._id, name: 'A-201', rentAmount: 30000 },
    { property: p2._id, name: 'B-201', rentAmount: 30000 }, { property: p2._id, name: 'B-202', rentAmount: 32000 }, { property: p2._id, name: 'B-301', rentAmount: 35000 }
  ]);
  await M.Rental.create([
    { property: p1._id, tenant: tenant._id, unit: 'A-101', rentAmount: 25000, startDate: '2026-01-01' },
    { property: p2._id, tenant: tenant2._id, unit: 'B-202', rentAmount: 32000, startDate: '2026-02-01' }
  ]);
  console.log('🌱 Seeded. Logins (password: password123): owner@demo.com, staff@demo.com, tenant@demo.com, tenant2@demo.com');
  process.exit(0);
})();
