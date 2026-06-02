import { verifyUserToken, getUserProfile } from '../lib/supabase-admin.mjs';
import { ROLES } from '../domain/constants.mjs';

export async function authenticate(req, res, next) {
  try {
    const user = await verifyUserToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const profile = await getUserProfile(user.id);
    req.user = user;
    req.profile = profile;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

export const requireAsha = requireRoles(ROLES.ASHA_WORKER);
export const requireGov = requireRoles(ROLES.GOVERNMENT);
export const requirePublicOrGov = requireRoles(ROLES.PUBLIC_USER, ROLES.GOVERNMENT);

export function validateIotKey(req, res, next) {
  const { config } = req.app.locals;
  if (!config.iotApiKey) return next();
  const key = req.headers['x-iot-api-key'];
  if (key !== config.iotApiKey) {
    return res.status(401).json({ error: 'Invalid IoT API key' });
  }
  next();
}

export function errorHandler(err, req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
}
