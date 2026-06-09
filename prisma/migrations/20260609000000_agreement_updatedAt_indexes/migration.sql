-- Composite index: covers dashboard + agreement-list queries
-- WHERE userId = ? ORDER BY updatedAt DESC
CREATE INDEX IF NOT EXISTS "Agreement_userId_updatedAt_idx" ON "Agreement"("userId", "updatedAt" DESC);

-- Single-column index: covers admin/worker list
-- ORDER BY updatedAt DESC (no userId filter, full table ordered scan)
CREATE INDEX IF NOT EXISTS "Agreement_updatedAt_idx" ON "Agreement"("updatedAt" DESC);
