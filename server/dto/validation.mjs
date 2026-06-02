import { z } from 'zod';

export const iotReadingSchema = z.object({
  sensorCode: z.string().min(1).max(100),
  rawAdcValue: z.number().int().optional(),
  voltage: z.number().optional(),
  phValue: z.number().optional(),
  sensorValue: z.number().optional(),
  timestamp: z.string().optional(),
});

export const wqiCalculateSchema = z.object({
  waterBodyId: z.number().int().positive(),
  boothId: z.number().int().positive(),
  tds: z.number().min(0),
  turbidity: z.number().min(0),
  priority: z.number().int().positive().default(1),
});

export const boothSubmissionSchema = z.object({
  boothId: z.number().int().positive(),
  entries: z.array(
    z.object({
      waterBodyId: z.number().int().positive(),
      tds: z.number().min(0),
      turbidity: z.number().min(0),
    })
  ).min(1),
});

export const createSensorSchema = z.object({
  sensorCode: z.string().min(1).max(100),
  sensorType: z.enum(['PH', 'TDS', 'TURBIDITY', 'TEMPERATURE', 'DISSOLVED_OXYGEN']),
  waterBodyId: z.number().int().positive(),
  status: z.string().optional(),
});

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
  return result.data;
}
