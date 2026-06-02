/** @typedef {Object} Municipality
 * @property {number} id
 * @property {string} name
 * @property {string} created_at
 */

/** @typedef {Object} Ward
 * @property {number} id
 * @property {number} municipality_id
 * @property {string|null} ward_number
 * @property {string|null} ward_name
 */

/** @typedef {Object} Booth
 * @property {number} id
 * @property {number} ward_id
 * @property {string|null} booth_number
 * @property {string|null} booth_name
 */

/** @typedef {Object} WaterBody
 * @property {number} id
 * @property {number} booth_id
 * @property {string} name
 * @property {string|null} description
 * @property {number|null} latitude
 * @property {number|null} longitude
 */

/** @typedef {Object} Sensor
 * @property {number} id
 * @property {string} sensor_code
 * @property {string} sensor_type
 * @property {number} water_body_id
 * @property {string|null} status
 */

/** @typedef {Object} SensorReading
 * @property {number} id
 * @property {number} sensor_id
 * @property {number|null} raw_adc_value
 * @property {number|null} voltage
 * @property {number} sensor_value
 * @property {string} recorded_at
 */

/** @typedef {Object} WaterBodySummary
 * @property {number} water_body_id
 * @property {number|null} current_ph
 * @property {number|null} avg_ph_7_days
 * @property {number|null} avg_ph_30_days
 * @property {number} total_readings
 * @property {string|null} last_updated
 */

/** @typedef {Object} WaterQualityReport
 * @property {number} id
 * @property {number} booth_id
 * @property {number} water_body_id
 * @property {number} avg_ph_used
 * @property {number} tds
 * @property {number} turbidity
 * @property {number} ph_score
 * @property {number} tds_score
 * @property {number} turbidity_score
 * @property {number} wqi
 * @property {number} water_body_priority
 * @property {string|null} submitted_by
 * @property {string} created_at
 */

export {};
