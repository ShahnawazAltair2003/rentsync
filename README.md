# RentSync – Real-Time Property Rental, Maintenance & Amenity Management

Stack: Node.js + Express, MongoDB (Mongoose), Socket.IO (real-time), JWT auth, Tailwind + vanilla JS frontend.

## Run locally
1. Install Node.js 18+ and MongoDB (or create a free MongoDB Atlas cluster).
2. `npm install`
3. Edit `.env` (set `MONGO_URI` if not using local MongoDB, and a strong `JWT_SECRET`).
4. `npm run seed`  (loads demo users, properties, amenities)
5. `npm start` → open http://localhost:3000


Demo logins (password `password123`): tenant@demo.com, staff@demo.com, owner@demo.com

## Public home page
Visitors who are not logged in see a Home page (Home / Rentals tabs, Login button, and a Contact dropdown with an enquiry email template). Edit the `CONTACT` constant in `public/index.html` to set your real email and phone.

## Roles
- Tenant: sees only the property they rent; creates requests, books amenities, checks in/out
- Staff: updates maintenance status, sees all requests and bookings
- Owner: everything above, plus add properties, create/end rentals, add/remove staff and tenants,
  and mark amenities available/unavailable
- Properties contain rentable units (with a monthly rent). Units without an active rental show as "Available to rent" in the Rentals tab for everyone.
- Removing a user ends their active rentals, cancels upcoming bookings and blocks their login immediately.

## Project layout
- `server.js` – app + Socket.IO + DB connection
- `models.js` – User, Property, Maintenance, Amenity, Booking
- `routes.js` – REST API (auth, maintenance, amenities, bookings, dashboard)
- `seed.js` – demo data
- `public/index.html` – responsive UI


##Live Link
 Live rendered URL > https://rentsync-215u.onrender.com/
