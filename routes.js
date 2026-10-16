const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const M = require('./models');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const today = () => new Date().toLocaleDateString('en-CA');
const timeOk = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t || '');
const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((e) => res.status(500).json({ error: e.message }));
const emit = (req) => req.app.get('io').emit('update'); // tells all clients to refresh

const auth = (...roles) => async (req, res, next) => {
  try {
    req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET);
    if (!(await M.User.exists({ _id: req.user.id }))) throw new Error('removed'); // removed users lose access at once
  } catch { return res.status(401).json({ error: 'Please log in' }); }
  if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: 'Not allowed' });
  next();
};
const sign = (u) => ({
  token: jwt.sign({ id: String(u._id), role: u.role, name: u.name }, SECRET, { expiresIn: '8h' }),
  user: { name: u.name, role: u.role }
});

/* ---------- Auth (self-registration creates tenants only) ---------- */
router.post('/auth/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'Name, email and a 6+ character password are required' });
  if (await M.User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email already registered' });
  const u = await M.User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'tenant' });
  res.json(sign(u));
}));

router.post('/auth/login', wrap(async (req, res) => {
  const u = await M.User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password)))
    return res.status(401).json({ error: 'Invalid email or password' });
  res.json(sign(u));
}));

/* ---------- Properties ---------- */
const rentedProps = async (uid) => (await M.Rental.find({ tenant: uid, status: 'Active' })).map((r) => r.property);

router.get('/properties', auth(), wrap(async (req, res) => {
  const q = req.user.role === 'tenant' ? { _id: { $in: await rentedProps(req.user.id) } } : {};
  res.json(await M.Property.find(q));
}));

router.post('/properties', auth('owner'), wrap(async (req, res) => {
  const { name, address } = req.body;
  if (!name || !address) return res.status(400).json({ error: 'Property name and address are required' });
  const p = await M.Property.create({ name, address, owner: req.user.id });
  emit(req); res.status(201).json(p);
}));

/* ---------- Maintenance ---------- */
router.get('/maintenance', auth(), wrap(async (req, res) => {
  const q = req.user.role === 'tenant' ? { createdBy: req.user.id } : {};
  res.json(await M.Maintenance.find(q).populate('property', 'name').populate('createdBy', 'name').sort('-createdAt'));
}));

router.post('/maintenance', auth(), wrap(async (req, res) => {
  const { propertyId, title, description, priority } = req.body;
  if (!propertyId || !title || !description) return res.status(400).json({ error: 'Property, title and description are required' });
  if (req.user.role === 'tenant' && !(await rentedProps(req.user.id)).some((p) => String(p) === propertyId))
    return res.status(403).json({ error: 'You can only report issues for a property you rent' });
  const r = await M.Maintenance.create({ property: propertyId, createdBy: req.user.id, title, description, priority });
  emit(req); res.status(201).json(r);
}));

router.patch('/maintenance/:id/status', auth('owner', 'staff'), wrap(async (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'In Progress', 'Completed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const r = await M.Maintenance.findByIdAndUpdate(req.params.id,
    { status, resolutionDate: status === 'Completed' ? new Date() : null }, { new: true });
  if (!r) return res.status(404).json({ error: 'Request not found' });
  emit(req); res.json(r);
}));

/* ---------- Amenities ---------- */
router.get('/amenities', auth(), wrap(async (req, res) => {
  const q = req.user.role === 'tenant' ? { property: { $in: await rentedProps(req.user.id) } } : {};
  res.json(await M.Amenity.find(q).populate('property', 'name'));
}));

router.patch('/amenities/:id', auth('owner'), wrap(async (req, res) => {
  const a = await M.Amenity.findByIdAndUpdate(req.params.id, { availabilityStatus: req.body.availabilityStatus }, { new: true });
  emit(req); res.json(a);
}));

router.post('/amenities', auth('owner'), wrap(async (req, res) => {
  const { propertyId, name, openTime, closeTime } = req.body;
  if (!propertyId || !name) return res.status(400).json({ error: 'Property and amenity name are required' });
  const open = openTime || '06:00', close = closeTime || '22:00';
  if (!timeOk(open) || !timeOk(close) || open >= close) return res.status(400).json({ error: 'Closing time must be after opening time' });
  if (!(await M.Property.exists({ _id: propertyId }))) return res.status(404).json({ error: 'Property not found' });
  if (await M.Amenity.findOne({ property: propertyId, name })) return res.status(409).json({ error: `${name} already exists at this property` });
  const a = await M.Amenity.create({ name, property: propertyId, openTime: open, closeTime: close });
  emit(req); res.status(201).json(a);
}));

router.delete('/amenities/:id', auth('owner'), wrap(async (req, res) => {
  const a = await M.Amenity.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Amenity not found' });
  await M.Booking.updateMany({ amenity: a._id, status: 'Booked' }, { status: 'Cancelled' });
  await M.Booking.updateMany({ amenity: a._id, status: 'Checked-In' }, { status: 'Checked-Out', checkOutAt: new Date() });
  await a.deleteOne(); emit(req); res.json({ ok: true });
}));

// Time slots already taken for an amenity on a date (no personal info)
router.get('/amenities/:id/slots', auth(), wrap(async (req, res) => {
  res.json(await M.Booking.find({ amenity: req.params.id, date: req.query.date, status: { $in: ['Booked', 'Checked-In'] } })
    .select('startTime endTime status').sort('startTime'));
}));

/* ---------- Bookings ---------- */
router.get('/bookings', auth(), wrap(async (req, res) => {
  const q = req.user.role === 'tenant' ? { user: req.user.id } : {};
  res.json(await M.Booking.find(q).populate('amenity', 'name').populate('user', 'name').sort('-date -startTime').limit(100));
}));

router.post('/bookings', auth(), wrap(async (req, res) => {
  const { amenityId, date, startTime, endTime } = req.body;
  const a = await M.Amenity.findById(amenityId);
  if (!a) return res.status(404).json({ error: 'Amenity not found' });
  if (a.availabilityStatus !== 'Available') return res.status(400).json({ error: 'Amenity is currently unavailable' });
  if (req.user.role === 'tenant' && !(await rentedProps(req.user.id)).some((p) => String(p) === String(a.property)))
    return res.status(403).json({ error: 'You can only book amenities at a property you rent' });
  if (!date || !timeOk(startTime) || !timeOk(endTime)) return res.status(400).json({ error: 'Valid date, start and end time required' });
  if (date < today()) return res.status(400).json({ error: 'Cannot book a past date' });
  if (startTime >= endTime) return res.status(400).json({ error: 'End time must be after start time' });
  if (startTime < a.openTime || endTime > a.closeTime)
    return res.status(400).json({ error: `${a.name} is open ${a.openTime}–${a.closeTime}` });
  // Conflict prevention: any active booking that overlaps [startTime, endTime)
  const clash = await M.Booking.findOne({ amenity: a._id, date, status: { $in: ['Booked', 'Checked-In'] },
    startTime: { $lt: endTime }, endTime: { $gt: startTime } });
  if (clash) return res.status(409).json({ error: `Slot conflicts with an existing booking (${clash.startTime}–${clash.endTime})` });
  const b = await M.Booking.create({ amenity: a._id, user: req.user.id, date, startTime, endTime });
  emit(req); res.status(201).json(b);
}));

const transition = (action, from, to, stamp) => router.post(`/bookings/:id/${action}`, auth(), wrap(async (req, res) => {
  const b = await M.Booking.findById(req.params.id);
  if (!b) return res.status(404).json({ error: 'Booking not found' });
  if (req.user.role === 'tenant' && String(b.user) !== req.user.id) return res.status(403).json({ error: 'Not your booking' });
  if (b.status !== from) return res.status(400).json({ error: `Booking is already ${b.status}` });
  b.status = to; if (stamp) b[stamp] = new Date();
  await b.save(); emit(req); res.json(b);
}));
transition('checkin', 'Booked', 'Checked-In', 'checkInAt');
transition('checkout', 'Checked-In', 'Checked-Out', 'checkOutAt');
transition('cancel', 'Booked', 'Cancelled');

/* ---------- User management (owner only) ---------- */
router.get('/users', auth('owner'), wrap(async (req, res) =>
  res.json(await M.User.find({ role: { $ne: 'owner' } }).select('name email role createdAt').sort('role name'))));

router.post('/users', auth('owner'), wrap(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || password.length < 6 || !['tenant', 'staff'].includes(role))
    return res.status(400).json({ error: 'Name, email, 6+ character password and a role (tenant/staff) are required' });
  if (await M.User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email already registered' });
  const u = await M.User.create({ name, email, password: await bcrypt.hash(password, 10), role });
  emit(req); res.status(201).json({ _id: u._id, name: u.name, email: u.email, role: u.role });
}));

router.delete('/users/:id', auth('owner'), wrap(async (req, res) => {
  const u = await M.User.findById(req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (u.role === 'owner') return res.status(400).json({ error: 'Owner accounts cannot be removed' });
  // Tidy up so nothing is left dangling
  await M.Rental.updateMany({ tenant: u._id, status: 'Active' }, { status: 'Ended', endDate: today() });
  await M.Booking.updateMany({ user: u._id, status: 'Booked' }, { status: 'Cancelled' });
  await M.Booking.updateMany({ user: u._id, status: 'Checked-In' }, { status: 'Checked-Out', checkOutAt: new Date() });
  await u.deleteOne();
  emit(req); res.json({ ok: true });
}));

/* ---------- Rental management ---------- */
router.get('/rentals', auth(), wrap(async (req, res) => {
  const q = req.user.role === 'tenant' ? { tenant: req.user.id } : {};
  res.json(await M.Rental.find(q).populate('property', 'name address').populate('tenant', 'name email').sort('status -startDate'));
}));

router.post('/rentals', auth('owner'), wrap(async (req, res) => {
  const { propertyId, tenantId, unit, rentAmount, startDate, endDate } = req.body;
  if (!propertyId || !tenantId || !unit || !startDate)
    return res.status(400).json({ error: 'Property, tenant, unit and start date are required' });
  const unitDoc = await M.Unit.findOne({ property: propertyId, name: unit });
  if (!unitDoc) return res.status(404).json({ error: 'Unit not found for this property. Add it first.' });
  if (endDate && endDate < startDate) return res.status(400).json({ error: 'End date must be after start date' });
  if (!(await M.User.findOne({ _id: tenantId, role: 'tenant' }))) return res.status(404).json({ error: 'Tenant not found' });
  if (await M.Rental.findOne({ property: propertyId, unit, status: 'Active' }))
    return res.status(409).json({ error: `Unit ${unit} is already rented` });
  const r = await M.Rental.create({ property: propertyId, tenant: tenantId, unit, rentAmount: rentAmount > 0 ? rentAmount : unitDoc.rentAmount, startDate, endDate });
  emit(req); res.status(201).json(r);
}));

router.post('/rentals/:id/end', auth('owner'), wrap(async (req, res) => {
  const r = await M.Rental.findById(req.params.id);
  if (!r) return res.status(404).json({ error: 'Rental not found' });
  if (r.status !== 'Active') return res.status(400).json({ error: 'Rental already ended' });
  r.status = 'Ended'; r.endDate = today(); await r.save();
  emit(req); res.json(r);
}));

/* ---------- Units (rentable flats/rooms inside a property) ---------- */
// Vacant = a unit with no active rental. Visible to everyone, so tenants can browse what is available.
const vacantUnits = async () => {
  const [units, rented] = await Promise.all([
    M.Unit.find().populate('property', 'name address').sort('name'),
    M.Rental.find({ status: 'Active' }).select('property unit')]);
  const taken = new Set(rented.map((r) => `${r.property}|${r.unit}`));
  return units.filter((u) => u.property && !taken.has(`${u.property._id}|${u.name}`));
};
router.get('/units/available', auth(), wrap(async (req, res) => res.json(await vacantUnits())));

// Public listing for visitors who are not logged in (no ids, no personal data)
router.get('/public/units', wrap(async (req, res) =>
  res.json((await vacantUnits()).map((u) => ({ property: u.property.name, address: u.property.address, unit: u.name, rentAmount: u.rentAmount })))));

router.post('/units', auth('owner'), wrap(async (req, res) => {
  const { propertyId, name, rentAmount } = req.body;
  if (!propertyId || !name || !(rentAmount > 0)) return res.status(400).json({ error: 'Property, unit name and monthly rent are required' });
  if (!(await M.Property.exists({ _id: propertyId }))) return res.status(404).json({ error: 'Property not found' });
  if (await M.Unit.findOne({ property: propertyId, name })) return res.status(409).json({ error: `Unit ${name} already exists` });
  const u = await M.Unit.create({ property: propertyId, name, rentAmount });
  emit(req); res.status(201).json(u);
}));

router.delete('/units/:id', auth('owner'), wrap(async (req, res) => {
  const u = await M.Unit.findById(req.params.id);
  if (!u) return res.status(404).json({ error: 'Unit not found' });
  if (await M.Rental.findOne({ property: u.property, unit: u.name, status: 'Active' })) return res.status(400).json({ error: 'Unit is currently rented' });
  await u.deleteOne(); emit(req); res.json({ ok: true });
}));

/* ---------- Dashboard ---------- */
router.get('/dashboard', auth(), wrap(async (req, res) => {
  const maintenance = { Pending: 0, 'In Progress': 0, Completed: 0 };
  (await M.Maintenance.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }])).forEach((x) => (maintenance[x._id] = x.n));
  const total = Object.values(maintenance).reduce((a, b) => a + b, 0);
  const done = await M.Maintenance.find({ status: 'Completed', resolutionDate: { $ne: null } }).select('createdAt resolutionDate');
  const avg = done.length ? done.reduce((s, r) => s + (r.resolutionDate - r.createdAt) / 36e5, 0) / done.length : 0;
  const usage = await M.Booking.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: '$amenity', n: { $sum: 1 } } },
    { $lookup: { from: 'amenities', localField: '_id', foreignField: '_id', as: 'a' } },
    { $project: { name: { $arrayElemAt: ['$a.name', 0] }, n: 1 } }, { $match: { name: { $ne: null } } }, { $sort: { n: -1 } }]);
  const rent = await M.Rental.aggregate([{ $match: { status: 'Active' } }, { $group: { _id: null, total: { $sum: '$rentAmount' }, n: { $sum: 1 } } }]);
  res.json({
    maintenance, total, avgResolutionHours: +avg.toFixed(1),
    completionRate: total ? Math.round((maintenance.Completed / total) * 100) : 0,
    amenitiesTotal: await M.Amenity.countDocuments(),
    amenitiesAvailable: await M.Amenity.countDocuments({ availabilityStatus: 'Available' }),
    bookingsToday: await M.Booking.countDocuments({ date: today(), status: { $ne: 'Cancelled' } }),
    inUseNow: await M.Booking.countDocuments({ status: 'Checked-In' }),
    activeRentals: rent[0]?.n || 0,
    monthlyRent: req.user.role === 'tenant' ? null : rent[0]?.total || 0,
    usage
  });
}));

module.exports = router;
