const { execSync } = require('node:child_process');

function run(command, options = {}) {
  const { env, ...execOptions } = options;
  const mergedEnv = env ? { ...process.env, ...env } : process.env;

  execSync(command, {
    stdio: 'inherit',
    ...execOptions,
    env: mergedEnv,
  });
}

const hasDatabaseUrl = typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.trim().length > 0;

try {
  run('prisma generate');
} catch (error) {
  console.error('Failed to run "prisma generate".', error);
  process.exit(error.status ?? 1);
}

if (hasDatabaseUrl) {
  const directDatabaseUrl = [
    process.env.DIRECT_DATABASE_URL,
    process.env.DIRECT_URL,
    process.env.SHADOW_DATABASE_URL,
  ].find((value) => typeof value === 'string' && value.trim().length > 0);

  const migrateEnvOverrides = {};

  if (directDatabaseUrl) {
    migrateEnvOverrides.DATABASE_URL = directDatabaseUrl;
    console.log('Using direct database connection string for migrations.');
  }

  try {
    run('prisma migrate deploy', { env: migrateEnvOverrides });
  } catch (error) {
    console.error('Failed to run "prisma migrate deploy".', error);
    process.exit(error.status ?? 1);
  }
} else {
  console.warn('Skipping "prisma migrate deploy" because DATABASE_URL is not defined.');
}

try {
  run('next build');
} catch (error) {
  console.error('Failed to run "next build".', error);
  process.exit(error.status ?? 1);
}
