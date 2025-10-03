-- Ensure the User table has the new authentication columns expected by the application
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "username" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordHash" TEXT,
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill username with a sensible default when migrating from the legacy schema
UPDATE "User"
SET "username" = COALESCE("username", NULLIF("email", '')), -- prefer email when present
    "updatedAt" = NOW()
WHERE "username" IS NULL;

-- Avoid empty usernames after backfill
UPDATE "User"
SET "username" = CONCAT('user_', "id")
WHERE "username" IS NULL OR LENGTH(TRIM("username")) = 0;

-- Provide a placeholder password hash for legacy rows so authentication logic keeps working
UPDATE "User"
SET "passwordHash" = COALESCE(
  NULLIF("passwordHash", ''),
  '$2b$10$QwT/lwWODmnyjUXtwJOwJ.B/.AJ8/DxX/er.bbQJtL4WahOWA1GRu' -- bcrypt hash for the string "changeme"
)
WHERE "passwordHash" IS NULL OR LENGTH(TRIM("passwordHash")) = 0;

-- Enforce constraints expected by Prisma after the backfill
ALTER TABLE "User"
  ALTER COLUMN "username" SET NOT NULL,
  ALTER COLUMN "passwordHash" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- Ensure the GlobalSetting table exists for background configuration
CREATE TABLE IF NOT EXISTS "GlobalSetting" (
  "id" INTEGER PRIMARY KEY,
  "backgroundUrl" TEXT
);
