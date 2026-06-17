-- Soft delete: User/Agreement/Payment.deletedAt was added to schema.prisma
-- but the migration was never generated, leaving prod without these columns.
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Agreement" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "deletedAt" TIMESTAMP(3);
