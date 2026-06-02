import { Router } from 'express';
import {
  hierarchyController,
  wqiController,
  iotController,
  dashboardController,
  adminController,
} from '../controllers/index.mjs';
import {
  authenticate,
  requireAsha,
  requireGov,
  requirePublicOrGov,
  validateIotKey,
} from '../middleware/auth.mjs';

export function createApiRouter() {
  const router = Router();

  // IoT (ESP32) - no user auth, optional API key
  router.post('/iot/readings', validateIotKey, iotController.ingest);

  // Hierarchy (authenticated)
  router.get('/municipalities', authenticate, hierarchyController.listMunicipalities);
  router.get('/municipalities/:municipalityId/wards', authenticate, hierarchyController.listWards);
  router.get('/wards/:wardId/booths', authenticate, hierarchyController.listBooths);
  router.get('/booths/:boothId/water-bodies', authenticate, hierarchyController.listWaterBodies);
  router.get('/water-bodies/:waterBodyId/ph-summary', authenticate, hierarchyController.getPhSummary);

  // WQI & booth submission (ASHA workers)
  router.post('/wqi/calculate', authenticate, requireAsha, wqiController.calculate);
  router.post('/booths/submit-report', authenticate, requireAsha, wqiController.submitBooth);

  // Dashboard
  router.get('/dashboard/municipalities', authenticate, requirePublicOrGov, dashboardController.municipalitiesOverview);
  router.get('/dashboard/municipalities/:municipalityId', authenticate, requirePublicOrGov, dashboardController.municipality);
  router.get('/dashboard/water-bodies/:waterBodyId', authenticate, requirePublicOrGov, dashboardController.waterBody);
  router.get('/dashboard/booths/:boothId/trends', authenticate, requirePublicOrGov, dashboardController.boothTrend);
  router.get('/dashboard/wards/:wardId/trends', authenticate, requirePublicOrGov, dashboardController.wardTrend);

  // Admin / scheduled job trigger
  router.post('/admin/summaries/refresh', authenticate, requireGov, adminController.refreshSummaries);

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'arogya-jal-api', version: '1.0.0' });
  });

  return router;
}
