import { HierarchyRepository } from '../repositories/hierarchy.repository.mjs';
import { getWaterBodyPhSummary, calculateAndSaveWqi, submitBoothReport } from '../services/scoring.service.mjs';
import { getMunicipalityDashboard, getWaterBodyDetails, getBoothTrends, getWardTrends, listAllMunicipalitiesWithScores } from '../services/dashboard.service.mjs';
import { ingestIotReading } from '../services/iot.service.mjs';
import { updateAllSummaries } from '../services/summary.service.mjs';
import { validate, iotReadingSchema, wqiCalculateSchema, boothSubmissionSchema } from '../dto/validation.mjs';

const hierarchyRepo = new HierarchyRepository();

export const hierarchyController = {
  async listMunicipalities(_req, res, next) {
    try {
      res.json(await hierarchyRepo.listMunicipalities());
    } catch (e) { next(e); }
  },

  async listWards(req, res, next) {
    try {
      res.json(await hierarchyRepo.listWards(Number(req.params.municipalityId)));
    } catch (e) { next(e); }
  },

  async listBooths(req, res, next) {
    try {
      res.json(await hierarchyRepo.listBooths(Number(req.params.wardId)));
    } catch (e) { next(e); }
  },

  async listWaterBodies(req, res, next) {
    try {
      res.json(await hierarchyRepo.listWaterBodies(Number(req.params.boothId)));
    } catch (e) { next(e); }
  },

  async getPhSummary(req, res, next) {
    try {
      res.json(await getWaterBodyPhSummary(Number(req.params.waterBodyId)));
    } catch (e) { next(e); }
  },
};

export const wqiController = {
  async calculate(req, res, next) {
    try {
      const body = validate(wqiCalculateSchema, req.body);
      const result = await calculateAndSaveWqi({
        ...body,
        waterBodyId: body.waterBodyId,
        boothId: body.boothId,
        submittedBy: req.user.id,
      });
      res.status(201).json(result);
    } catch (e) { next(e); }
  },

  async submitBooth(req, res, next) {
    try {
      const body = validate(boothSubmissionSchema, req.body);
      const result = await submitBoothReport({
        boothId: body.boothId,
        entries: body.entries,
        submittedBy: req.user.id,
      });
      res.status(201).json(result);
    } catch (e) { next(e); }
  },
};

export const iotController = {
  async ingest(req, res, next) {
    try {
      const body = validate(iotReadingSchema, req.body);
      const result = await ingestIotReading(body);
      res.status(201).json(result);
    } catch (e) { next(e); }
  },
};

export const dashboardController = {
  async municipality(req, res, next) {
    try {
      res.json(await getMunicipalityDashboard(Number(req.params.municipalityId)));
    } catch (e) { next(e); }
  },

  async waterBody(req, res, next) {
    try {
      res.json(await getWaterBodyDetails(Number(req.params.waterBodyId)));
    } catch (e) { next(e); }
  },

  async boothTrend(req, res, next) {
    try {
      res.json(await getBoothTrends(Number(req.params.boothId)));
    } catch (e) { next(e); }
  },

  async wardTrend(req, res, next) {
    try {
      res.json(await getWardTrends(Number(req.params.wardId)));
    } catch (e) { next(e); }
  },

  async municipalitiesOverview(_req, res, next) {
    try {
      res.json(await listAllMunicipalitiesWithScores());
    } catch (e) { next(e); }
  },
};

export const adminController = {
  async refreshSummaries(_req, res, next) {
    try {
      const results = await updateAllSummaries();
      res.json({ updated: results.length, results });
    } catch (e) { next(e); }
  },
};
