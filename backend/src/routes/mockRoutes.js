const express = require('express');

const { attachCurrentUser, requireCurrentUser } = require('../middleware/currentUser');
const { validateRequest } = require('../middleware/validateRequest');
const { AnalyzePhotoRequestSchema } = require('../schemas/AnalyzePhotoRequest');
const { BarberClaimRequestSchema } = require('../schemas/BarberClaimRequest');
const {
  BusinessProfileUpdateRequestSchema,
} = require('../schemas/BusinessProfileUpdateRequest');
const { GeneratePreviewRequestSchema } = require('../schemas/GeneratePreviewRequest');
const { SaveHistoryItemRequestSchema } = require('../schemas/SaveHistoryItemRequest');
const {
  generateRealAnalyzeResult,
  generateRealPreviewResult,
  resolveAiMode,
} = require('../lib/openaiTryOn');
const { getRepositories } = require('../repositories/getRepositories');
const { sendError, sendSuccess } = require('../utils/apiResponse');

function createMockRoutes({ repositories = getRepositories() } = {}) {
  const router = express.Router();

  router.get('/health', (_req, res) => {
    sendSuccess(
      res,
      {
        status: 'ok',
        service: 'potongin-ai-backend',
        timestamp: new Date().toISOString(),
      },
      'Backend health check passed.'
    );
  });

  router.post(
    '/api/ai/analyze',
    attachCurrentUser,
    requireCurrentUser,
    validateRequest(AnalyzePhotoRequestSchema),
    async (req, res) => {
      let data;

      try {
        if (resolveAiMode() === 'real') {
          data = await generateRealAnalyzeResult(req.validatedBody);
        } else {
          data = await repositories.aiGenerations.createAnalyzeResult(
            req.validatedBody,
            req.currentUser
          );
        }
      } catch (caughtError) {
        if (caughtError?.code === 'AI_REAL_MODE_UNAVAILABLE') {
          return sendError(res, 503, 'AI_REAL_MODE_UNAVAILABLE', caughtError.message);
        }

        if (caughtError?.code === 'IMAGE_INPUT_INVALID') {
          return sendError(res, 400, 'IMAGE_INPUT_INVALID', caughtError.message);
        }

        if (caughtError?.code === 'IMAGE_PREPROCESS_FAILED') {
          return sendError(res, 400, 'IMAGE_PREPROCESS_FAILED', caughtError.message);
        }

        if (caughtError?.code === 'AI_ANALYSIS_FAILED') {
          return sendError(res, 502, 'AI_ANALYSIS_FAILED', caughtError.message);
        }

        throw caughtError;
      }

      sendSuccess(
        res,
        data,
        data?.modeUsed === 'real' ? 'AI analysis completed.' : 'Mock AI analyze response generated.'
      );
    }
  );

  router.post(
    '/api/ai/generate',
    attachCurrentUser,
    requireCurrentUser,
    validateRequest(GeneratePreviewRequestSchema),
    async (req, res) => {
      let data;

      try {
        if (resolveAiMode() === 'real') {
          data = await generateRealPreviewResult(req.validatedBody);
        } else {
          data = await repositories.aiGenerations.createGenerateResult(
            req.validatedBody,
            req.currentUser
          );
        }
      } catch (caughtError) {
        if (caughtError?.code === 'AI_REAL_MODE_UNAVAILABLE') {
          return sendError(res, 503, 'AI_REAL_MODE_UNAVAILABLE', caughtError.message);
        }

        if (caughtError?.code === 'IMAGE_INPUT_INVALID') {
          return sendError(res, 400, 'IMAGE_INPUT_INVALID', caughtError.message);
        }

        if (caughtError?.code === 'IMAGE_PREPROCESS_FAILED') {
          return sendError(res, 400, 'IMAGE_PREPROCESS_FAILED', caughtError.message);
        }

        if (caughtError?.code === 'IMAGE_MODEL_UNSUPPORTED') {
          return sendError(res, 503, 'IMAGE_MODEL_UNSUPPORTED', caughtError.message);
        }

        if (caughtError?.code === 'IMAGE_REQUEST_FAILED') {
          return sendError(res, 502, 'IMAGE_REQUEST_FAILED', caughtError.message);
        }

        if (caughtError?.code === 'IMAGE_RESPONSE_EMPTY') {
          return sendError(res, 502, 'IMAGE_RESPONSE_EMPTY', caughtError.message);
        }

        throw caughtError;
      }

      sendSuccess(
        res,
        data,
        data?.modeUsed === 'real' ? 'AI preview generated.' : 'Mock AI generate response generated.'
      );
    }
  );

  router.get('/api/explore/feed', async (_req, res) => {
    try {
      const data = await repositories.exploreCollections.listActiveExploreCollections();

      sendSuccess(
        res,
        data,
        'Mock explore feed loaded.'
      );
    } catch {
      sendError(res, 500, 'EXPLORE_FEED_READ_FAILED', 'Unable to load explore feed.');
    }
  });

  router.get('/api/profile/me', attachCurrentUser, requireCurrentUser, async (req, res) => {
    const profile = await repositories.profiles.getProfileById(req.currentUser.id);

    sendSuccess(
      res,
      {
        profile: {
          id: profile?.id || req.currentUser.id,
          name: profile?.name || profile?.displayName || 'Demo User',
          credits: typeof profile?.credits === 'number' ? profile.credits : 2,
          plan: profile?.plan || 'beta',
          role: profile?.role || req.currentUser.role || 'regular',
          beta: profile?.beta ?? true,
          updatedAt: profile?.updatedAt || profile?.createdAt || new Date().toISOString(),
          apiBaseUrl: `${req.protocol}://${req.get('host')}`,
        },
      },
      'Profile loaded.'
    );
  });

  router.get('/api/history', attachCurrentUser, requireCurrentUser, async (req, res) => {
    const history = await repositories.aiGenerations.listHistoryByUserId(req.currentUser);

    sendSuccess(res, { history }, 'History loaded.');
  });

  router.post(
    '/api/history',
    attachCurrentUser,
    requireCurrentUser,
    validateRequest(SaveHistoryItemRequestSchema),
    async (req, res) => {
      const savedLook = await repositories.aiGenerations.saveHistoryItem(
        req.validatedBody,
        req.currentUser
      );

      sendSuccess(res, { savedLook }, 'Look saved.');
    }
  );

  router.post(
    '/api/barbers/claim',
    attachCurrentUser,
    requireCurrentUser,
    validateRequest(BarberClaimRequestSchema),
    async (req, res) => {
      const data = await repositories.barbershops.createBarbershopClaim(
        req.validatedBody,
        req.currentUser
      );

      sendSuccess(
        res,
        data,
        'Mock barber claim submitted.'
      );
    }
  );

  router.get('/api/business/profile', attachCurrentUser, requireCurrentUser, async (req, res) => {
    try {
      const data = await repositories.barbershops.getBusinessProfile(req.currentUser);

      sendSuccess(res, data, 'Mock business profile loaded.');
    } catch {
      sendError(res, 500, 'BUSINESS_PROFILE_READ_FAILED', 'Unable to load business profile.');
    }
  });

  router.put(
    '/api/business/profile',
    attachCurrentUser,
    requireCurrentUser,
    validateRequest(BusinessProfileUpdateRequestSchema),
    async (req, res) => {
      const data = await repositories.barbershops.updateBusinessProfile(
        req.validatedBody,
        req.currentUser
      );

      sendSuccess(
        res,
        data,
        'Mock business profile updated.'
      );
    }
  );

  router.delete('/api/history/:id', attachCurrentUser, requireCurrentUser, async (req, res) => {
    const data = await repositories.aiGenerations.deleteHistoryItem(req.params.id, req.currentUser);

    if (!data) {
      return sendError(res, 404, 'HISTORY_ITEM_NOT_FOUND', 'History item not found.');
    }

    sendSuccess(
      res,
      data,
      'History item deleted.'
    );
  });

  return router;
}

const router = createMockRoutes();

module.exports = router;
module.exports.createMockRoutes = createMockRoutes;
