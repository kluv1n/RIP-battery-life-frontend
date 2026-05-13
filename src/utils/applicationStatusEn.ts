/** English labels for `battery_life.status` only (API values stay lowercase). */
export function applicationStatusLabelEn(status: string | undefined): string {
  const m: Record<string, string> = {
    draft: "Draft",
    deleted: "Deleted",
    formed: "Formed",
    completed: "Completed",
    rejected: "Rejected",
  };
  if (status == null || status === "") return "—";
  const k = status.trim().toLowerCase();
  return m[k] ?? status;
}
