const { env } = require('../config/env');
const { sendError } = require('../utils/apiResponse');
const { attachMockCurrentUser } = require('./mockCurrentUser');

function attachCurrentUser(req, res, next) {
  // TODO: Replace mock fallback with Supabase JWT verification and current-user lookup.
  return attachMockCurrentUser(req, res, next);
}

function requireCurrentUser(req, res, next) {
  if (req.currentUser) {
    return next();
  }

  return sendError(res, 401, 'UNAUTHENTICATED', 'User context is required.');
}

module.exports = {
  attachCurrentUser,
  requireCurrentUser,
};
