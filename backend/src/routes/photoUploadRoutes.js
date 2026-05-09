const express = require('express');

const { attachCurrentUser, requireCurrentUser } = require('../middleware/currentUser');
const {
  hasValidPhotoMetadata,
  createPhotoUploadInvalidError,
  normalizePhotoPayload,
  normalizePhotoUploadError,
  photoUpload,
} = require('../lib/photoUpload');
const { confirmPhotoUpload } = require('../lib/photoStorage');
const { sendError, sendSuccess } = require('../utils/apiResponse');

function handleMockPhotoConfirmUpload(req, res) {
  photoUpload.single('photo')(req, res, async (error) => {
    const uploadError = normalizePhotoUploadError(error);
    const normalizedPayload = normalizePhotoPayload(req.body);

    if (uploadError) {
      sendError(res, 400, 'PHOTO_UPLOAD_INVALID', uploadError.message);
      return;
    }

    if (!req.file && !hasValidPhotoMetadata(normalizedPayload)) {
      const missingFileError = createPhotoUploadInvalidError(
        'Photo confirmation requires localUri, source, width, and height.'
      );
      sendError(res, 400, 'PHOTO_UPLOAD_INVALID', missingFileError.message);
      return;
    }

    try {
      const data = await confirmPhotoUpload({
        currentUser: req.currentUser,
        file: req.file,
        payload: normalizedPayload,
      });

      sendSuccess(res, data, 'Photo upload confirmed.');
    } catch (caughtError) {
      if (caughtError?.code === 'PHOTO_UPLOAD_INVALID') {
        sendError(res, 400, 'PHOTO_UPLOAD_INVALID', caughtError.message);
        return;
      }

      if (caughtError?.code === 'PHOTO_STORAGE_UNAVAILABLE') {
        sendError(res, 503, 'PHOTO_STORAGE_UNAVAILABLE', caughtError.message);
        return;
      }

      sendError(res, 500, 'PHOTO_UPLOAD_FAILED', 'Unable to confirm photo upload.');
    }
  });
}

function createPhotoUploadRoutes() {
  const router = express.Router();

  router.post(
    ['/api/photos/confirm-upload', '/photos/confirm-upload'],
    attachCurrentUser,
    requireCurrentUser,
    handleMockPhotoConfirmUpload
  );

  return router;
}

module.exports = createPhotoUploadRoutes();
module.exports.createPhotoUploadRoutes = createPhotoUploadRoutes;
