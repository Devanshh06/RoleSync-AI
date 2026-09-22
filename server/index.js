import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import taskRoutes from './routes/tasks.js';
import staffRoutes from './routes/staff.js';
import handoverRoutes from './routes/handovers.js';
import documentRoutes from './routes/documents.js';
import gmailRoutes from './routes/gmail.js';
import { syncAllUsers } from './routes/gmail.js';
import aiRoutes from './routes/ai.js';
import notificationRoutes from './routes/notifications.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`RoleSync server running on port ${PORT}`);

  // ─── Hourly Gmail Auto-Sync Cron ───────────────────────────
  // Runs at minute 0 of every hour (e.g., 1:00, 2:00, 3:00...)
  cron.schedule('0 * * * *', () => {
    console.log(`[Cron] Triggering hourly Gmail auto-sync at ${new Date().toISOString()}`);
    syncAllUsers();
  });
  console.log('[Cron] Hourly Gmail auto-sync scheduled (runs at :00 every hour).');
});
