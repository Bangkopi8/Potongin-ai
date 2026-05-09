const { z } = require('zod');

const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  message: z.string().min(1).optional(),
});

module.exports = {
  ApiSuccessResponseSchema,
};
