import { supabaseAdmin } from '../lib/supabase-admin.mjs';

export class SummaryRepository {
  async get(waterBodyId) {
    const { data, error } = await supabaseAdmin()
      .from('water_body_summary')
      .select('*')
      .eq('water_body_id', waterBodyId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async upsert(waterBodyId, stats) {
    const { data, error } = await supabaseAdmin()
      .from('water_body_summary')
      .upsert({
        water_body_id: waterBodyId,
        current_ph: stats.currentPh,
        avg_ph_7_days: stats.avgPh7Days,
        avg_ph_30_days: stats.avgPh30Days,
        total_readings: stats.totalReadings,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async ensureExists(waterBodyId) {
    const existing = await this.get(waterBodyId);
    if (existing) return existing;
    return this.upsert(waterBodyId, {
      currentPh: null,
      avgPh7Days: null,
      avgPh30Days: null,
      totalReadings: 0,
    });
  }
}
