import { HierarchyRepository } from '../repositories/hierarchy.repository.mjs';
import { ReportRepository } from '../repositories/report.repository.mjs';
import { SummaryRepository } from '../repositories/summary.repository.mjs';
import { SensorRepository } from '../repositories/sensor.repository.mjs';
import { supabaseAdmin } from '../lib/supabase-admin.mjs';

const hierarchyRepo = new HierarchyRepository();
const reportRepo = new ReportRepository();
const summaryRepo = new SummaryRepository();
const sensorRepo = new SensorRepository();

export async function getMunicipalityDashboard(municipalityId) {
  const municipality = await hierarchyRepo.getMunicipality(municipalityId);
  const latestMuniScore = await reportRepo.getLatestMunicipalityScore(municipalityId);
  const muniTrend = await reportRepo.getMunicipalityScoreTrend(municipalityId);

  const wards = await hierarchyRepo.listWards(municipalityId);
  const wardCards = await Promise.all(
    wards.map(async (ward) => {
      const latestWardScore = await reportRepo.getLatestWardScore(ward.id);
      const booths = await hierarchyRepo.listBooths(ward.id);
      const boothCards = await Promise.all(
        booths.map(async (booth) => {
          const latestBoothScore = await reportRepo.getLatestBoothScore(booth.id);
          return {
            ...booth,
            boothScore: latestBoothScore?.booth_score ?? null,
            lastUpdated: latestBoothScore?.generated_at ?? null,
          };
        })
      );
      return {
        ...ward,
        wardScore: latestWardScore?.ward_score ?? null,
        lastUpdated: latestWardScore?.generated_at ?? null,
        booths: boothCards,
      };
    })
  );

  return {
    municipality,
    municipalityScore: latestMuniScore?.municipality_score ?? null,
    lastUpdated: latestMuniScore?.generated_at ?? null,
    wards: wardCards,
    trends: { municipalityScore: muniTrend },
  };
}

export async function getWaterBodyDetails(waterBodyId) {
  const waterBody = await hierarchyRepo.getWaterBody(waterBodyId);
  const summary = await summaryRepo.get(waterBodyId);
  const latestReport = await reportRepo.getLatestByWaterBody(waterBodyId);
  const phTrend = await sensorRepo.getTrendBySensorType(waterBodyId, 'PH', 100);
  const wqiTrend = await reportRepo.getWqiTrend(waterBodyId);

  return {
    waterBody,
    summary: {
      currentPh: summary?.current_ph,
      avgPh7Days: summary?.avg_ph_7_days,
      avgPh30Days: summary?.avg_ph_30_days,
      lastUpdated: summary?.last_updated,
    },
    latest: {
      tds: latestReport?.tds ?? null,
      turbidity: latestReport?.turbidity ?? null,
      wqi: latestReport?.wqi ?? null,
      reportDate: latestReport?.created_at ?? null,
    },
    trends: {
      ph: phTrend.map((r) => ({ value: r.sensor_value, date: r.recorded_at })),
      wqi: wqiTrend.map((r) => ({ value: r.wqi, date: r.created_at })),
    },
  };
}

export async function getBoothTrends(boothId) {
  return reportRepo.getBoothScoreTrend(boothId);
}

export async function getWardTrends(wardId) {
  return reportRepo.getWardScoreTrend(wardId);
}

export async function listAllMunicipalitiesWithScores() {
  const municipalities = await hierarchyRepo.listMunicipalities();
  return Promise.all(
    municipalities.map(async (m) => {
      const latest = await reportRepo.getLatestMunicipalityScore(m.id);
      return { ...m, municipalityScore: latest?.municipality_score ?? null };
    })
  );
}

export async function getPublicDashboard(municipalityId) {
  return getMunicipalityDashboard(municipalityId);
}
