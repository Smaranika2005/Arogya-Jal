import { HierarchyRepository } from '../repositories/hierarchy.repository.mjs';
import { SummaryRepository } from '../repositories/summary.repository.mjs';
import { ReportRepository } from '../repositories/report.repository.mjs';
import { calculateWqi, calculateBoothScore, calculateAverageScore } from './wqi.service.mjs';
import { supabaseAdmin } from '../lib/supabase-admin.mjs';

const hierarchyRepo = new HierarchyRepository();
const summaryRepo = new SummaryRepository();
const reportRepo = new ReportRepository();

export async function calculateAndSaveWqi({ waterBodyId, boothId, tds, turbidity, priority, submittedBy }) {
  const summary = await summaryRepo.get(waterBodyId);
  const avgPh30Days = summary?.avg_ph_30_days;

  if (avgPh30Days == null) {
    const err = new Error('30-day average pH not available for this water body. Ensure pH sensor data exists.');
    err.status = 422;
    throw err;
  }

  const scores = calculateWqi({ avgPh30Days: Number(avgPh30Days), tds, turbidity });

  const report = await reportRepo.insertWaterQualityReport({
    boothId,
    waterBodyId,
    avgPhUsed: Number(avgPh30Days),
    tds,
    turbidity,
    phScore: scores.phScore,
    tdsScore: scores.tdsScore,
    turbidityScore: scores.turbidityScore,
    wqi: scores.wqi,
    priority,
    submittedBy,
  });

  return {
    report,
    scores,
    phSummary: {
      currentPh: summary?.current_ph,
      avgPh7Days: summary?.avg_ph_7_days,
      avgPh30Days: summary?.avg_ph_30_days,
    },
  };
}

export async function submitBoothReport({ boothId, entries, submittedBy }) {
  const count = entries.length;
  const reports = [];

  for (let i = 0; i < count; i++) {
    const entry = entries[i];
    const priority = count - i;
    const result = await calculateAndSaveWqi({
      waterBodyId: entry.waterBodyId,
      boothId,
      tds: entry.tds,
      turbidity: entry.turbidity,
      priority,
      submittedBy,
    });
    reports.push(result);
  }

  const wqiEntries = reports.map((r) => ({ wqi: r.scores.wqi }));
  const boothScore = calculateBoothScore(wqiEntries);

  if (boothScore == null) {
    const err = new Error('Unable to calculate booth score');
    err.status = 422;
    throw err;
  }

  const boothReport = await reportRepo.insertBoothReport({
    boothId,
    boothScore,
    generatedBy: submittedBy,
  });

  const booth = await hierarchyRepo.getBooth(boothId);
  const wardId = booth.ward_id;

  const { data: wardBooths } = await supabaseAdmin()
    .from('booths')
    .select('id')
    .eq('ward_id', wardId);

  const boothScores = await Promise.all(
    (wardBooths ?? []).map((b) => reportRepo.getLatestBoothScore(b.id))
  );
  const wardScore = calculateAverageScore(boothScores.map((r) => r?.booth_score));
  let wardReport = null;

  if (wardScore != null) {
    wardReport = await reportRepo.insertWardReport({ wardId, wardScore });

    const ward = await hierarchyRepo.getWard(wardId);
    const { data: municipalityWards } = await supabaseAdmin()
      .from('wards')
      .select('id')
      .eq('municipality_id', ward.municipality_id);

    const wardScoreList = await Promise.all(
      (municipalityWards ?? []).map((w) => reportRepo.getLatestWardScore(w.id))
    );
    const municipalityScore = calculateAverageScore(wardScoreList.map((r) => r?.ward_score));

    if (municipalityScore != null) {
      await reportRepo.insertMunicipalityReport({
        municipalityId: ward.municipality_id,
        municipalityScore,
      });
    }
  }

  return { reports, boothReport, wardReport, boothScore };
}

export async function getWaterBodyPhSummary(waterBodyId) {
  const summary = await summaryRepo.get(waterBodyId);
  return {
    waterBodyId,
    currentPh: summary?.current_ph ?? null,
    avgPh7Days: summary?.avg_ph_7_days ?? null,
    avgPh30Days: summary?.avg_ph_30_days ?? null,
    totalReadings: summary?.total_readings ?? 0,
    lastUpdated: summary?.last_updated ?? null,
  };
}
