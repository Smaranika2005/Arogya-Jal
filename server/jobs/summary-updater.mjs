import cron from 'node-cron';
import { updateAllSummaries } from '../services/summary.service.mjs';
import { config } from '../config/env.mjs';

export function startScheduledJobs() {
  if (!cron.validate(config.summaryJobCron)) {
    console.warn(`Invalid SUMMARY_JOB_CRON: ${config.summaryJobCron}`);
    return;
  }

  cron.schedule(config.summaryJobCron, async () => {
    console.log('[job] Updating water body summaries...');
    try {
      const results = await updateAllSummaries();
      const ok = results.filter((r) => r.success).length;
      console.log(`[job] Updated ${ok}/${results.length} water body summaries`);
    } catch (err) {
      console.error('[job] Summary update failed:', err.message);
    }
  });

  console.log(`Scheduled summary job: ${config.summaryJobCron}`);
}
