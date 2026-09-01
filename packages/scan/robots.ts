/**
 * Onde o exame não foi convidado, ele pergunta antes de entrar.
 *
 * The counterweight to ADR-0008. Once our browser stops announcing itself as
 * automated, a site loses the one signal it had for telling us from a shopper —
 * so the place we give that signal back is the place the web already has for
 * it, which is `robots.txt`.
 *
 * Only for hosts other than the store being examined, and the distinction is
 * the whole point. The shop's own pages are read because its owner asked us to
 * read them; a `Disallow` there is addressed to crawlers indexing the web, not
 * to the audit the owner just requested, and honouring it would mean refusing
 * to do the job we were hired for. The policy that lives on a sibling domain is
 * the other case: nobody there asked us for anything, and smiles.com.br
 * publishing its policy on voegol.com.br is exactly how the search ends up
 * knocking on a stranger's door.
 *
 * What this is not: a crawler's robots implementation. There is no crawl-delay,
 * no sitemap, no per-agent group beyond `*`, and the pattern matching is prefix
 * with `*` and `$`. It reads the one rule that could plausibly say "not here",
 * and errs towards reading — a file we could not fetch or could not parse is
 * not a refusal.
 */

/** Long enough for a small text file, short enough to not cost a reading. */
const ROBOTS_TIMEOUT_MS = 5_000;

/**
 * The `Disallow` rules that apply to everyone, as written.
 *
 * Only the `User-agent: *` group. We have no token of our own to match — a
 * scan that announced one would be back to being refused for announcing it
 * (measured: an identified user agent gets 403 where a plain one gets 200) —
 * so the rules for everybody are the rules for us.
 */
export function disallowedPaths(robots: string): string[] {
  const paths: string[] = [];
  let listening = false;

  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;

    const [field, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    const name = field.trim().toLowerCase();

    if (name === "user-agent") {
      // A group can be introduced by several agents in a row, and `*` anywhere
      // among them makes the group ours.
      listening = value === "*";
      continue;
    }

    // An empty `Disallow` is the explicit way of allowing everything, and it
    // must not be read as "disallow /".
    if (listening && name === "disallow" && value) paths.push(value);
  }

  return paths;
}

/** Whether one rule covers this path. */
function covers(rule: string, path: string): boolean {
  const anchored = rule.endsWith("$");
  const pattern = anchored ? rule.slice(0, -1) : rule;
  const parts = pattern.split("*");

  let at = 0;
  for (const [index, part] of parts.entries()) {
    if (part === "") continue;

    // The first piece is anchored at the start of the path; the rest may slide.
    const found =
      index === 0 ? (path.startsWith(part) ? 0 : -1) : path.indexOf(part, at);
    if (found === -1) return false;
    at = found + part.length;
  }

  return anchored ? at === path.length : true;
}

/** Whether `robots.txt` tells everyone to stay out of this path. */
export function disallows(robots: string, path: string): boolean {
  return disallowedPaths(robots).some((rule) => covers(rule, path));
}

/**
 * Asks a host's `robots.txt` whether we may open this address.
 *
 * Anything that goes wrong is a yes. A host with no `robots.txt`, one that
 * times out, one that answers HTML — none of those is a refusal, and treating
 * them as one would turn our own network trouble into a policy we never read.
 */
export async function mayOpen(url: URL): Promise<boolean> {
  try {
    const response = await fetch(new URL("/robots.txt", url.origin), {
      signal: AbortSignal.timeout(ROBOTS_TIMEOUT_MS),
      redirect: "follow",
    });

    if (!response.ok) return true;

    return !disallows(await response.text(), url.pathname + url.search);
  } catch {
    return true;
  }
}
