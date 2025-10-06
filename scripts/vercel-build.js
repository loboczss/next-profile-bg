const { execSync } = require('node:child_process');

function run(command) {
  execSync(command, { stdio: 'inherit', env: process.env });
}

const hasDatabaseUrl = typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.trim().length > 0;

try {
  run('prisma generate');
} catch (error) {
  console.error('Failed to run "prisma generate".', error);
  process.exit(error.status ?? 1);
}

if (hasDatabaseUrl) {
  try {
    run('prisma migrate deploy');
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
