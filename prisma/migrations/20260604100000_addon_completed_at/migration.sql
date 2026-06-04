-- AddOn.completedAt: admin marks when off-platform fulfilment (notary visit,
-- extra copy print) is done. Nullable so existing rows are untouched and
-- "not yet completed" means NULL.
ALTER TABLE "AddOn" ADD COLUMN "completedAt" TIMESTAMP(3);
