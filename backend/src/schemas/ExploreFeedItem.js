const { z } = require('zod');

const ExploreFeedItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['barber', 'style']),
  title: z.string().min(1),
  subtitle: z.string().min(1),
});

module.exports = {
  ExploreFeedItemSchema,
};
