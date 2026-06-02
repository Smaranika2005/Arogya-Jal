import { PH_WEIGHT, TDS_WEIGHT, TURBIDITY_WEIGHT } from '../domain/constants.mjs';

export function calculatePhScore(ph) {
  if (ph >= 6.5 && ph <= 8.5) return 100;
  if ((ph >= 6.0 && ph < 6.5) || (ph > 8.5 && ph <= 9.0)) return 80;
  if ((ph >= 5.5 && ph < 6.0) || (ph > 9.0 && ph <= 9.5)) return 60;
  return 40;
}

export function calculateTdsScore(tds) {
  if (tds <= 300) return 100;
  if (tds <= 500) return 80;
  if (tds <= 1000) return 60;
  return 40;
}

export function calculateTurbidityScore(turbidity) {
  if (turbidity <= 5) return 100;
  if (turbidity <= 10) return 80;
  if (turbidity <= 20) return 60;
  return 40;
}

export function calculateWqi({ avgPh30Days, tds, turbidity }) {
  const phScore = calculatePhScore(avgPh30Days);
  const tdsScore = calculateTdsScore(tds);
  const turbidityScore = calculateTurbidityScore(turbidity);

  const wqi =
    phScore * PH_WEIGHT +
    tdsScore * TDS_WEIGHT +
    turbidityScore * TURBIDITY_WEIGHT;

  return {
    phScore,
    tdsScore,
    turbidityScore,
    wqi: Math.round(wqi * 100) / 100,
  };
}

export function calculateBoothScore(reportsWithWqi) {
  if (!reportsWithWqi.length) return null;

  const count = reportsWithWqi.length;
  let weightedSum = 0;
  let weightTotal = 0;

  reportsWithWqi.forEach((entry, index) => {
    const weight = count - index;
    weightedSum += entry.wqi * weight;
    weightTotal += weight;
  });

  if (weightTotal === 0) return null;
  return Math.round((weightedSum / weightTotal) * 100) / 100;
}

export function calculateAverageScore(scores) {
  const valid = scores.filter((s) => s != null && !Number.isNaN(s));
  if (!valid.length) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.round(avg * 100) / 100;
}
