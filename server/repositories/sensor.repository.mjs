import { supabaseAdmin } from '../lib/supabase-admin.mjs';

export class SensorRepository {
  async findByCode(sensorCode) {
    const { data, error } = await supabaseAdmin()
      .from('sensors')
      .select('*, water_bodies(id, booth_id, name)')
      .eq('sensor_code', sensorCode)
      .single();
    if (error) return null;
    return data;
  }

  async insertReading({ sensorId, rawAdcValue, voltage, sensorValue, recordedAt }) {
    const { data, error } = await supabaseAdmin()
      .from('sensor_readings')
      .insert({
        sensor_id: sensorId,
        raw_adc_value: rawAdcValue ?? null,
        voltage: voltage ?? null,
        sensor_value: sensorValue,
        recorded_at: recordedAt ?? new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getPhReadings(waterBodyId, since) {
    const { data: sensors } = await supabaseAdmin()
      .from('sensors')
      .select('id')
      .eq('water_body_id', waterBodyId)
      .eq('sensor_type', 'PH');

    if (!sensors?.length) return [];

    const sensorIds = sensors.map((s) => s.id);
    let query = supabaseAdmin()
      .from('sensor_readings')
      .select('sensor_value, recorded_at')
      .in('sensor_id', sensorIds)
      .order('recorded_at', { ascending: true });

    if (since) query = query.gte('recorded_at', since);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getTrendBySensorType(waterBodyId, sensorType, limit = 100) {
    const { data: sensors } = await supabaseAdmin()
      .from('sensors')
      .select('id')
      .eq('water_body_id', waterBodyId)
      .eq('sensor_type', sensorType);

    if (!sensors?.length) return [];

    const { data, error } = await supabaseAdmin()
      .from('sensor_readings')
      .select('sensor_value, recorded_at')
      .in('sensor_id', sensors.map((s) => s.id))
      .order('recorded_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
