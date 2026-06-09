import Link from "next/link";
import { loadAgreement } from "@/lib/agreement";

export default async function ESignPage({
  params,
}: {
  params: { id: string };
}) {
  const { agreement } = await loadAgreement(params.id);

  return (
    <div className="container max-w-3xl py-10">
      <Link
        href={`/agreement/${agreement.id}`}
        className="text-sm text-slate-500 hover:text-brand-700"
      >
        ← Back to agreement
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        Aadhaar eSign
      </h1>
      <p className="mt-2 text-slate-600">
        Aadhaar eSign is being set up. You will receive signing instructions by
        email once your agreement is ready to sign.
      </p>
    </div>
  );
}
