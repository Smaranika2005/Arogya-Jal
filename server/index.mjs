import express from 'express';
import cors from 'cors';
import { config } from './config/env.mjs';
import { createApiRouter } from './routes/api.mjs';
import { errorHandler } from './middleware/auth.mjs';
import { startScheduledJobs } from './jobs/summary-updater.mjs';

const app = express();
app.locals.config = config;

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/api', createApiRouter());
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Arogya Jal API running on http://localhost:${config.port}`);
  startScheduledJobs();
});
