import { describe, expect, it } from "vitest";
import { isPrivateAddress, parseTargetUrl } from "../target-url";

describe("isPrivateAddress", () => {
  it.each([
    ["169.254.169.254", "cloud instance metadata"],
    ["127.0.0.1", "loopback"],
    ["10.0.0.1", "RFC 1918"],
    ["172.16.0.1", "RFC 1918, bottom of the range"],
    ["172.31.255.255", "RFC 1918, top of the range"],
    ["192.168.1.1", "RFC 1918"],
    ["100.64.0.1", "carrier-grade NAT"],
    ["0.0.0.0", "this network"],
    ["255.255.255.255", "broadcast"],
    ["::1", "IPv6 loopback"],
    ["fd00::1", "IPv6 unique local"],
    ["fe80::1", "IPv6 link local"],
    ["::ffff:169.254.169.254", "IPv4-mapped metadata address"],
  ])("refuses %s (%s)", (address) => {
    expect(isPrivateAddress(address)).toBe(true);
  });

  it.each([
    ["8.8.8.8", "public resolver"],
    ["172.32.0.1", "just past RFC 1918"],
    ["172.15.255.255", "just before RFC 1918"],
    ["100.128.0.1", "just past carrier-grade NAT"],
    ["1.1.1.1", "public resolver"],
    ["2606:4700:4700::1111", "public IPv6"],
  ])("allows %s (%s)", (address) => {
    expect(isPrivateAddress(address)).toBe(false);
  });
});

describe("parseTargetUrl", () => {
  it("assumes https for a bare hostname, because that is what people paste", async () => {
    const target = await parseTargetUrl("example.com");
    expect(target).toMatchObject({ ok: true });
    if (target.ok) expect(target.url.protocol).toBe("https:");
  });

  it("keeps the path, so a store on a subpath is still reachable", async () => {
    const target = await parseTargetUrl("https://example.com/loja");
    if (!target.ok)
      throw new Error(`expected a usable target, got ${target.reason}`);
    expect(target.url.pathname).toBe("/loja");
  });

  it.each([
    ["", "malformed"],
    ["   ", "malformed"],
    ["não é uma url", "malformed"],
    ["file:///etc/passwd", "unsupported-scheme"],
    ["ftp://example.com", "unsupported-scheme"],
    ["https://example.com:8080", "unsupported-port"],
    ["http://127.0.0.1", "private-address"],
    ["http://169.254.169.254/latest/meta-data/", "private-address"],
    ["http://[::1]/", "private-address"],
    ["http://10.0.0.1", "private-address"],
  ])("refuses %s as %s", async (raw, reason) => {
    expect(await parseTargetUrl(raw)).toEqual({ ok: false, reason });
  });

  it("refuses a name that does not resolve", async () => {
    const target = await parseTargetUrl(
      "https://nao-existe-mesmo.bugsniff-invalid"
    );
    expect(target).toEqual({ ok: false, reason: "unresolvable" });
  });
});

describe("scheme detection versus host and port", () => {
  it.each([
    ["mailto:alguem@example.com", "unsupported-scheme"],
    ["javascript:alert(1)", "unsupported-scheme"],
    ["data:text/html,<script>1</script>", "unsupported-scheme"],
    ["gopher://example.com", "unsupported-scheme"],
  ])("%s is a scheme, refused as %s", async (raw, reason) => {
    expect(await parseTargetUrl(raw)).toEqual({ ok: false, reason });
  });

  it("reads loja.com:8080 as a host and a port, not as a scheme", async () => {
    // The port is what should be refused here. Reading "loja.com" as a scheme
    // would refuse it for the wrong reason and mislead whoever reads the error.
    expect(await parseTargetUrl("loja.com:8080")).toEqual({
      ok: false,
      reason: "unsupported-port",
    });
  });
});
