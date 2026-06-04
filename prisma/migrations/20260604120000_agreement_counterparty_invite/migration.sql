-- Two-party invite + counterparty review
ALTER TABLE "Agreement"
  ADD COLUMN "counterpartyApprovalStatus"  TEXT,
  ADD COLUMN "counterpartyInviteTokenHash" TEXT,
  ADD COLUMN "counterpartyInviteSentAt"    TIMESTAMP(3),
  ADD COLUMN "counterpartyInviteExpiresAt" TIMESTAMP(3),
  ADD COLUMN "counterpartyChangesComment"  TEXT,
  ADD COLUMN "counterpartyRespondedAt"     TIMESTAMP(3);

CREATE UNIQUE INDEX "Agreement_counterpartyInviteTokenHash_key"
  ON "Agreement" ("counterpartyInviteTokenHash");
