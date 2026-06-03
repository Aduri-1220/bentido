import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StaffAgreementsMobileFilter({
  actionPath,
  defaultDigits,
}: {
  actionPath: "/admin" | "/worker";
  defaultDigits: string;
}) {
  const hasFilter = defaultDigits.trim().length > 0;

  return (
    <form
      method="get"
      action={actionPath}
      className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
      role="search"
    >
      <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          name="phone"
          placeholder="Mobile (10 digits or partial)"
          defaultValue={defaultDigits}
          className="pl-9"
          inputMode="numeric"
          autoComplete="off"
          aria-label="Filter by customer mobile"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary">
          Filter by mobile
        </Button>
        {hasFilter ? (
          <Button type="button" variant="outline" asChild>
            <Link href={actionPath}>Clear</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
