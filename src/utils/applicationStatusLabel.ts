/** Подписи статуса заявки (значения API — lowercase). */
export function applicationStatusLabel(status: string | undefined): string {
  const m: Record<string, string> = {
    draft: "Черновик",
    deleted: "Удалена",
    formed: "Сформирована",
    completed: "Завершена",
    rejected: "Отклонена",
  };
  if (status == null || status === "") return "—";
  const k = status.trim().toLowerCase();
  return m[k] ?? status;
}
