const { z } = require('zod');

const AnalyzePhotoRequestSchema = z
  .object({
    photoSessionId: z
      .string()
      .trim()
      .min(1, 'photoSessionId is required.'),
    imageBase64: z
      .string()
      .trim()
      .min(1, 'imageBase64 cannot be empty.')
      .max(8_500_000, 'imageBase64 payload is too large.')
      .optional(),
    mimeType: z
      .string()
      .trim()
      .min(1, 'mimeType cannot be empty.')
      .max(64, 'mimeType must be 64 characters or fewer.')
      .optional(),
    width: z
      .number()
      .positive('width must be positive.')
      .optional(),
    height: z
      .number()
      .positive('height must be positive.')
      .optional(),
    source: z
      .string()
      .trim()
      .min(1, 'source cannot be empty.')
      .max(64, 'source must be 64 characters or fewer.')
      .optional(),
    selectedStyleId: z
      .string()
      .trim()
      .min(1, 'selectedStyleId cannot be empty.')
      .optional(),
    selectedHairColor: z
      .string()
      .trim()
      .min(1, 'selectedHairColor cannot be empty.')
      .optional(),
    notes: z
      .string()
      .trim()
      .max(500, 'notes must be 500 characters or fewer.')
      .optional(),
  });

module.exports = {
  AnalyzePhotoRequestSchema,
};
