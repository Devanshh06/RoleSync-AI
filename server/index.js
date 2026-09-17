import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/tasks.js';
import staffRoutes from './routes/staff.js';
import handoverRoutes from './routes/handovers.js';
import documentRoutes from './routes/documents.js';
import gmailRoutes from './routes/gmail.js';
import aiRoutes from './routes/ai.js';

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

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`RoleSync server running on port ${PORT}`));
