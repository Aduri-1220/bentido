-- Phase 1: move file blobs out of Postgres into Cloudflare R2 + add AuditLog.
-- Safe for environments with no production data; otherwise back up before running.

-- Drop blob columns and replace with R2 object keys.
ALTER TABLE "Agreement" DROP COLUMN IF EXISTS "sourceDraftBlob";
ALTER TABLE "Agreement" ADD COLUMN "sourceDraftR2Key" TEXT;

ALTER TABLE "Delivery" DROP COLUMN IF EXISTS "scannedCopyBlob";
ALTER TABLE "Delivery" ADD COLUMN "scannedCopyR2Key" TEXT;

-- Append-only audit trail.
CREATE TABLE "AuditLog" (
  "id"            TEXT NOT NULL,
  "actorType"     TEXT NOT NULL,
  "actorId"       TEXT NOT NULL,
  "action"        TEXT NOT NULL,
  "agreementId"   TEXT,
  "before"        TEXT,
  "after"         TEXT,
  "ip"            TEXT,
  "userAgent"     TEXT,
  "correlationId" TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_agreementId_idx" ON "AuditLog"("agreementId");
CREATE INDEX "AuditLog_actorId_idx"     ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_action_idx"      ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx"   ON "AuditLog"("createdAt");
