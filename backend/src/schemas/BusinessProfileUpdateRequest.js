const { z } = require('zod');

const BusinessProfileUpdateRequestSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'displayName must be at least 2 characters.')
      .max(80, 'displayName must be 80 characters or fewer.')
      .optional(),
    tagline: z
      .string()
      .trim()
      .max(120, 'tagline must be 120 characters or fewer.')
      .optional(),
    address: z
      .string()
      .trim()
      .min(5, 'address must be at least 5 characters.')
      .max(200, 'address must be 200 characters or fewer.')
      .optional(),
    phone: z
      .string()
      .trim()
      .min(7, 'phone must be at least 7 characters.')
      .max(20, 'phone must be 20 characters or fewer.')
      .optional(),
  })
  .refine(
    (data) =>
      Object.values(data).some(
        (value) => typeof value === 'string' && value.trim().length > 0
      ),
    {
      message:
        'At least one of displayName, tagline, address, or phone is required.',
    }
  );

module.exports = {
  BusinessProfileUpdateRequestSchema,
};
