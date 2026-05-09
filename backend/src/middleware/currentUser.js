const { env } = require('../config/env');
const { sendError } = require('../utils/apiResponse');
const { attachMockCurrentUser } = require('./mockCurrentUser');

function attachCurrentUser(req, res, next) {
  if (!env.USE_SUPABASE) {
    return attachMockCurrentUser(req, res, next);
  }

  req.currentUser = null;
  req.authBoundary = {
    mode: 'supabase-todo',
    isAuthenticated: false,
  };

  // TODO: Replace this stub with Supabase JWT verification and current-user lookup.
  next();
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
