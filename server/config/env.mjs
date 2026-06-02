import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || process.env.API_PORT || 8788),
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  iotApiKey: process.env.IOT_API_KEY || '',
  summaryJobCron: process.env.SUMMARY_JOB_CRON || '*/15 * * * *',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
