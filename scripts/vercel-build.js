/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('node:child_process');

function run(command, options = {}) {
  const { env, captureOutput = false, ...execOptions } = options;
  const mergedEnv = env ? { ...process.env, ...env } : process.env;

  try {
    const stdout = execSync(command, {
      stdio: captureOutput ? 'pipe' : 'inherit',
      ...execOptions,
      env: mergedEnv,
    });

    if (captureOutput && stdout) {
      process.stdout.write(stdout);
    }

    return { stdout };
  } catch (error) {
    if (captureOutput) {
      if (error.stdout) {
        process.stdout.write(error.stdout);
      }

      if (error.stderr) {
        process.stderr.write(error.stderr);
      }
    }

    throw error;
  }
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
    run('prisma migrate deploy', { env: migrateEnvOverrides, captureOutput: true });
  } catch (error) {
    const output = [error.stderr, error.stdout]
      .flat()
      .filter(Boolean)
      .map((value) => (Buffer.isBuffer(value) ? value.toString('utf8') : String(value)))
      .join('\n');
    const normalizedOutput = output.toLowerCase();
    const normalizedMessage = typeof error.message === 'string' ? error.message.toLowerCase() : '';

    if (normalizedOutput.includes('p1001') || normalizedMessage.includes('p1001')) {
      console.warn(
        'Skipping "prisma migrate deploy" because the database server is unreachable (Prisma error P1001).',
      );
    } else {
      console.error('Failed to run "prisma migrate deploy".', error);
      process.exit(error.status ?? 1);
    }
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
