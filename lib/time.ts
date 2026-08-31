/**
 * How long ago, in the words a person would use.
 *
 * `Intl.RelativeTimeFormat` picks the wording and the plural; the only decision
 * here is which unit fits. Anything under a minute is "agora": a scan that
 * finished forty seconds ago did not finish "há 40 segundos", it just
 * finished.
 */
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const relative = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function timeAgo(when: string | Date, now: Date = new Date()): string {
  const elapsed = now.getTime() - new Date(when).getTime();

  if (elapsed < MINUTE) return "agora";
  if (elapsed < HOUR)
    return relative.format(-Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY)
    return relative.format(-Math.floor(elapsed / HOUR), "hour");
  return relative.format(-Math.floor(elapsed / DAY), "day");
}
