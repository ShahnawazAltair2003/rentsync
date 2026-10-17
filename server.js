require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
app.set('io', new Server(server));

app.use(cors());
app.use(express.json());
app.use('/api', require('./routes'));
// Serve the React build when it exists, otherwise the original page in /public
const dist = path.join(__dirname, 'client', 'dist');
app.use(express.static(require('fs').existsSync(dist) ? dist : path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rental_platform')
  .then(() => server.listen(PORT, () => console.log(`✅ Running at http://localhost:${PORT}`)))
  .catch((e) => { console.error('❌ MongoDB connection failed:', e.message); process.exit(1); });
