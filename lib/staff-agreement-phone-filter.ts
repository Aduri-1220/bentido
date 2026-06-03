import type { Prisma } from "@prisma/client";

/**
 * Narrow agreements by customer mobile: exact match against `User.id` (phone-as-id)
 * or `User.phone`, or partial substring on `phone` only.
 */
export function staffAgreementsMobileWhere(
  digits: string | null,
): Prisma.AgreementWhereInput {
  if (!digits || digits.length < 4) return {};

  const isFullIndianMobile = /^[6-9]\d{9}$/.test(digits);
  if (isFullIndianMobile) {
    return {
      user: {
        OR: [{ id: digits }, { phone: digits }],
      },
    };
  }

  return {
    user: {
      phone: { contains: digits },
    },
  };
}
