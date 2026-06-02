import { SensorRepository } from '../repositories/sensor.repository.mjs';
import { SummaryRepository } from '../repositories/summary.repository.mjs';
import { supabaseAdmin } from '../lib/supabase-admin.mjs';

const sensorRepo = new SensorRepository();
const summaryRepo = new SummaryRepository();

function avg(values) {
  const nums = values.filter((v) => v != null && !Number.isNaN(Number(v)));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + Number(b), 0) / nums.length) * 100) / 100;
}

export async function updateWaterBodySummary(waterBodyId) {
  const now = new Date();
  const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const readings7 = await sensorRepo.getPhReadings(waterBodyId, since7);
  const readings30 = await sensorRepo.getPhReadings(waterBodyId, since30);
  const allReadings = await sensorRepo.getPhReadings(waterBodyId);

  const latest = allReadings.length ? allReadings[allReadings.length - 1] : null;

  return summaryRepo.upsert(waterBodyId, {
    currentPh: latest ? Number(latest.sensor_value) : null,
    avgPh7Days: avg(readings7.map((r) => r.sensor_value)),
    avgPh30Days: avg(readings30.map((r) => r.sensor_value)),
    totalReadings: allReadings.length,
  });
}

export async function updateAllSummaries() {
  const { data: waterBodies, error } = await supabaseAdmin()
    .from('water_bodies')
    .select('id');

  if (error) throw error;

  const results = [];
  for (const wb of waterBodies ?? []) {
    try {
      const summary = await updateWaterBodySummary(wb.id);
      results.push({ waterBodyId: wb.id, success: true, summary });
    } catch (e) {
      results.push({ waterBodyId: wb.id, success: false, error: e.message });
    }
  }
  return results;
}

export async function queueSummaryUpdate(waterBodyId) {
  setImmediate(async () => {
    try {
      await updateWaterBodySummary(waterBodyId);
    } catch (err) {
      console.error(`Summary update failed for water body ${waterBodyId}:`, err.message);
    }
  });
}
