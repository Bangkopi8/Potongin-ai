const { z } = require('zod');

const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }),
});

module.exports = {
  ApiErrorResponseSchema,
};
