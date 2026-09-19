import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

export const DEFAULT_JWT_SECRET = 'prms_super_secret_jwt_access_key_2026_change_in_production';
export const DEFAULT_JWT_REFRESH_SECRET = 'prms_super_secret_jwt_refresh_key_2026_change_in_production';

const INSECURE_SECRETS = new Set([
  DEFAULT_JWT_SECRET.toLowerCase(),
  DEFAULT_JWT_REFRESH_SECRET.toLowerCase(),
  'secret',
  'jwtsecret',
  'jwt_secret',
  'changeme',
  'change_me',
  'password',
  '1234567890',
  'prms_secret',
]);

const envSchema = z.object({
  PORT: z.string().default('3000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/prms'),
  JWT_SECRET: z.string().min(16).default(DEFAULT_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16).default(DEFAULT_JWT_REFRESH_SECRET),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX: z.string().default('10000').transform((val) => parseInt(val, 10)),
  ENABLE_DEMO_MODE: z.string().default('true'),
});

export const validateAuthEnvironment = (config: z.infer<typeof envSchema>): void => {
  const isStrictProduction = config.NODE_ENV === 'production' || config.ENABLE_DEMO_MODE === 'false';

  if (!isStrictProduction) {
    // In development / demo mode, fallback default secrets are allowed for zero-friction local and demo execution
    return;
  }

  const errors: string[] = [];

  // 1. Validate JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    errors.push('JWT_SECRET must be explicitly configured in environment variables.');
  } else if (jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long for production cryptographic strength.');
  } else if (INSECURE_SECRETS.has(jwtSecret.toLowerCase())) {
    errors.push('JWT_SECRET cannot use insecure default placeholder values in production.');
  }

  // 2. Validate JWT_REFRESH_SECRET
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET?.trim();
  if (!jwtRefreshSecret) {
    errors.push('JWT_REFRESH_SECRET must be explicitly configured in environment variables.');
  } else if (jwtRefreshSecret.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters long for production cryptographic strength.');
  } else if (INSECURE_SECRETS.has(jwtRefreshSecret.toLowerCase())) {
    errors.push('JWT_REFRESH_SECRET cannot use insecure default placeholder values in production.');
  }

  // 3. Enforce distinct access and refresh secrets
  if (jwtSecret && jwtRefreshSecret && jwtSecret === jwtRefreshSecret) {
    errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be distinct secrets to prevent cross-token privilege escalation.');
  }

  if (errors.length > 0) {
    console.error('❌ PRMS Production Security Startup Validation Failed:');
    errors.forEach((err) => console.error(`  • ${err}`));
    throw new Error(`Authentication environment validation failed: ${errors.join('; ')}`);
  }
};

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment Variable Validation Error:');
    console.error(result.error.format());
    throw new Error('Invalid environment variables configured.');
  }

  validateAuthEnvironment(result.data);
  return result.data;
};

export const env = parseEnv();
export type EnvConfig = z.infer<typeof envSchema>;

