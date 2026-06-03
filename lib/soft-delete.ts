/**
 * Soft delete helpers to exclude deleted records from queries.
 * When querying, add this filter: NOT_DELETED_FILTER[modelName]
 */

export const NOT_DELETED_FILTER = {
  // Usage: prisma.user.findMany({ where: { ...NOT_DELETED_FILTER.user } })
  user: { deletedAt: null },
  agreement: { deletedAt: null },
  payment: { deletedAt: null },
};

/**
 * Soft delete a user (does not cascade to agreements, they remain visible).
 * Call from admin/user management endpoints.
 */
export async function softDeleteUser(userId: string) {
  // Import inside to avoid circular dependency
  const { prisma } = await import("./db");
  return prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });
}

/**
 * Soft delete an agreement.
 */
export async function softDeleteAgreement(agreementId: string) {
  const { prisma } = await import("./db");
  return prisma.agreement.update({
    where: { id: agreementId },
    data: { deletedAt: new Date() },
  });
}
