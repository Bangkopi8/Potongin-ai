const { z } = require('zod');

const GeneratePreviewRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, 'prompt must be at least 3 characters.')
    .max(200, 'prompt must be 200 characters or fewer.'),
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
  analysisId: z
    .string()
    .trim()
    .min(1, 'analysisId cannot be empty.')
    .optional(),
  photoSessionId: z
    .string()
    .trim()
    .min(1, 'photoSessionId cannot be empty.')
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
  selectedStyleName: z
    .string()
    .trim()
    .min(1, 'selectedStyleName cannot be empty.')
    .max(120, 'selectedStyleName must be 120 characters or fewer.')
    .optional(),
  selectedHairColor: z
    .string()
    .trim()
    .min(1, 'selectedHairColor cannot be empty.')
    .optional(),
  variations: z
    .number()
    .int('variations must be a whole number.')
    .min(1, 'variations must be at least 1.')
    .max(4, 'variations must be 4 or fewer.')
    .optional(),
});

module.exports = {
  GeneratePreviewRequestSchema,
};
