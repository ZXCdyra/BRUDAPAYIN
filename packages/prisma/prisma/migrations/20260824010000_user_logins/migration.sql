-- Logins instead of emails: users.login (required, unique), email becomes optional contact field.
ALTER TABLE "users" ADD COLUMN "login" TEXT;

WITH base AS (
  SELECT id,
    lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_.]+', '_', 'g')) AS candidate,
    row_number() OVER (
      PARTITION BY lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_.]+', '_', 'g'))
      ORDER BY "created_at" ASC, id ASC
    ) AS rn
  FROM "users"
)
UPDATE "users" u
SET "login" = CASE WHEN b.rn = 1 THEN b.candidate ELSE b.candidate || '_' || b.rn END
FROM base b WHERE u.id = b.id;

ALTER TABLE "users" ALTER COLUMN "login" SET NOT NULL;
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "invite_tokens" RENAME COLUMN "email" TO "login";
ALTER INDEX "invite_tokens_email_key" RENAME TO "invite_tokens_login_key";
