const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ quiet: true });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AI_MODE: z.enum(['mock', 'real']).optional().default('mock'),
  OPENAI_API_KEY: z.string().optional().default(''),
  AI_API_KEY: z.string().optional().default(''),
  OPENAI_ANALYZE_MODEL: z.string().optional().default('gpt-4.1-mini'),
  OPENAI_IMAGE_MODEL: z.string().optional().default('gpt-image-1'),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  SUPABASE_STORAGE_ORIGINAL_TEMP_BUCKET: z.string().optional().default('original-temp'),
  USE_SUPABASE: z
    .string()
    .optional()
    .default('false')
    .transform((value) => /^true$/i.test(value.trim())),
  PHOTO_STORAGE_MODE: z.string().optional().default('mock'),
});

function parseEnv(source = process.env) {
  const parsedEnv = envSchema.safeParse(source);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid environment configuration: ${parsedEnv.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')}`
    );
  }

  return parsedEnv.data;
}

function getMissingSupabaseEnvKeysFromEnv(currentEnv) {
  return ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((key) => !currentEnv[key]);
}

function validateSupabaseEnv(currentEnv) {
  if (currentEnv.USE_SUPABASE) {
    const missingKeys = getMissingSupabaseEnvKeysFromEnv(currentEnv);

    if (missingKeys.length > 0) {
      throw new Error(
        `Missing required Supabase environment variables when USE_SUPABASE=true: ${missingKeys.join(
          ', '
        )}`
      );
    }
  }

  return currentEnv;
}

const env = validateSupabaseEnv(parseEnv());

function getMissingSupabaseEnvKeys() {
  return getMissingSupabaseEnvKeysFromEnv(env);
}

function getOpenAiApiKey(currentEnv = env) {
  if (typeof currentEnv.OPENAI_API_KEY === 'string' && currentEnv.OPENAI_API_KEY.trim().length > 0) {
    return currentEnv.OPENAI_API_KEY.trim();
  }

  if (typeof currentEnv.AI_API_KEY === 'string' && currentEnv.AI_API_KEY.trim().length > 0) {
    return currentEnv.AI_API_KEY.trim();
  }

  return '';
}

module.exports = {
  env,
  getOpenAiApiKey,
  getMissingSupabaseEnvKeys,
  getMissingSupabaseEnvKeysFromEnv,
  parseEnv,
  validateSupabaseEnv,
};
