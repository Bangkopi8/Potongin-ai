const MOCK_CURRENT_USER = Object.freeze({
  id: 'mock-user-001',
  email: 'demo@potongin.ai',
  role: 'regular',
});

function buildMockCurrentUser() {
  return {
    ...MOCK_CURRENT_USER,
  };
}

function attachMockCurrentUser(req, _res, next) {
  req.currentUser = buildMockCurrentUser();
  req.authBoundary = {
    mode: 'mock',
    isAuthenticated: true,
  };

  next();
}

module.exports = {
  MOCK_CURRENT_USER,
  attachMockCurrentUser,
  buildMockCurrentUser,
};
