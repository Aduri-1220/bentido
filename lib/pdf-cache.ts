import { generateAgreementPdf } from "./agreement-pdf";

interface CachedPdf {
  base64: string;
  generatedAt: number;
}

const pdfCache = new Map<string, CachedPdf>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate or retrieve cached agreement PDF.
 * If the PDF was generated within the last 5 minutes, return the cached version.
 * Otherwise, regenerate it.
 */
export async function generateAgreementPdfCached(
  agreementId: string,
): Promise<string> {
  const cached = pdfCache.get(agreementId);
  const now = Date.now();

  if (cached && now - cached.generatedAt < CACHE_TTL_MS) {
    return cached.base64;
  }

  const pdf = await generateAgreementPdf(agreementId);
  pdfCache.set(agreementId, { base64: pdf, generatedAt: now });
  return pdf;
}

/**
 * Invalidate cached PDF (call when agreement data changes).
 */
export function invalidatePdfCache(agreementId: string) {
  pdfCache.delete(agreementId);
}

/**
 * Clear all cached PDFs (useful for testing or memory pressure).
 */
export function clearPdfCache() {
  pdfCache.clear();
}
