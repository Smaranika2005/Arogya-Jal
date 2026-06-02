import { SensorRepository } from '../repositories/sensor.repository.mjs';
import { queueSummaryUpdate } from './summary.service.mjs';

const sensorRepo = new SensorRepository();

export async function ingestIotReading(payload) {
  const sensor = await sensorRepo.findByCode(payload.sensorCode);
  if (!sensor) {
    const err = new Error(`Unknown sensor: ${payload.sensorCode}`);
    err.status = 404;
    throw err;
  }

  const sensorValue = payload.phValue ?? payload.sensorValue;
  if (sensorValue == null) {
    const err = new Error('sensorValue or phValue is required');
    err.status = 400;
    throw err;
  }

  const reading = await sensorRepo.insertReading({
    sensorId: sensor.id,
    rawAdcValue: payload.rawAdcValue,
    voltage: payload.voltage,
    sensorValue,
    recordedAt: payload.timestamp,
  });

  const waterBodyId = sensor.water_body_id ?? sensor.water_bodies?.id;
  if (waterBodyId) {
    queueSummaryUpdate(waterBodyId);
  }

  return {
    reading,
    sensor: { id: sensor.id, code: sensor.sensor_code, type: sensor.sensor_type },
    waterBodyId,
  };
}
