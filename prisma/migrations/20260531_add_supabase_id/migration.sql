ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "supabaseId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_supabaseId_key"
ON "users"("supabaseId");