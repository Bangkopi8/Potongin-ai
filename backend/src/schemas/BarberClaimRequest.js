const { z } = require('zod');

const BarberClaimRequestSchema = z.object({
  barberId: z.string().trim().min(1, 'barberId is required.'),
  contactName: z
    .string()
    .trim()
    .min(2, 'contactName must be at least 2 characters.')
    .max(80, 'contactName must be 80 characters or fewer.'),
  phoneNumber: z
    .string()
    .trim()
    .min(7, 'phoneNumber must be at least 7 characters.')
    .max(20, 'phoneNumber must be 20 characters or fewer.'),
  proofUrl: z
    .string()
    .trim()
    .url('proofUrl must be a valid URL.')
    .optional(),
  notes: z
    .string()
    .trim()
    .max(500, 'notes must be 500 characters or fewer.')
    .optional(),
});

module.exports = {
  BarberClaimRequestSchema,
};
