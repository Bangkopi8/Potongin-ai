const { z } = require('zod');

const SaveHistoryItemRequestSchema = z.object({
  id: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1, 'title is required'),
  subtitle: z.string().trim().optional(),
  previewUrl: z.string().trim().optional(),
  previewCount: z
    .number({
      invalid_type_error: 'previewCount must be a number',
    })
    .int('previewCount must be an integer')
    .nonnegative('previewCount must be zero or greater'),
  savedAt: z.string().trim().optional(),
});

module.exports = {
  SaveHistoryItemRequestSchema,
};
