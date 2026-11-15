import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import slotRoutes from './routes/slotRoute.js';
import { initSocket , broadcastSlotChange } from './socket.js';
import { releaseExpiredBookings } from './services/bookingService.js';
import sessionRoutes from './routes/sessionRoute.js';
import authRoutes from './routes/authRoute.js';
import vehicleOwnerRoutes from './routes/vehicleOwnerRoute.js';
import bookingRoutes from './routes/bookingRoute.js';

const app = express();

const server = http.createServer(app);
initSocket(server);

app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/vehicle-owners', vehicleOwnerRoutes);
app.use('/api/sessions', sessionRoutes);

app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});


const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        // every minute: free slots whose booking hold has expired
    setInterval(async () => {
      try {
        const released = await releaseExpiredBookings();
        for (const slot of released) await broadcastSlotChange(slot);
        if (released.length) {
          console.log('Released expired bookings:', released.map((s) => s.slotNumber).join(', '));
        }
      } catch (err) {
        console.error('Expiry sweep failed:', err.message);
      }
    }, 60 * 1000);
  })
  .catch((err) => console.error('Mongo connection error:', err));