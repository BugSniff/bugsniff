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

/**
 * How long something has been going on, to the second.
 *
 * Separate from `timeAgo`, which rounds anything under a minute to "agora" —
 * right for a scan that finished, useless for one that is still running. A
 * person watching a page work wants to see the number move; that is most of
 * what tells them the page is not stuck.
 */
export function elapsed(from: string | Date, now: Date = new Date()): string {
  const seconds = Math.max(
    0,
    Math.round((now.getTime() - new Date(from).getTime()) / 1000)
  );

  if (seconds < 60)
    return `${seconds} ${seconds === 1 ? "segundo" : "segundos"}`;

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}
