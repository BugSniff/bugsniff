import { IconMail } from "@tabler/icons-react";
import Link from "next/link";
import { Mark } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { showAddress } from "@/lib/copy";

/**
 * The card that stands where a form was, once the link is on its way.
 *
 * A screen of its own, and not a notice above the form, because the next thing
 * the person does happens in their inbox: a notice stacked on top of a form
 * they already submitted invites them to submit it again, and two links in the
 * inbox is two links with no way to tell which one is theirs.
 *
 * Shared by both doors — the landing asks for a store and an address, the login
 * screen only for an address — because what happens next is the same either way.
 */
export function LinkSent({
  to,
  children,
  back,
}: {
  /** Where the link went. Shown only when it is an address (`showAddress`). */
  to: string;
  /** What waits on the other side of the link. Differs by which door it was. */
  children: React.ReactNode;
  back: { href: string; label: string };
}) {
  return (
    <Card className="w-[460px] items-start gap-4 px-6">
      <Mark size="lg">
        <IconMail size={20} stroke={2} />
      </Mark>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Link enviado</h1>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>

      {showAddress(to) && (
        <>
          <Separator />
          <div className="flex flex-col gap-1">
            <span className="text-xs">Enviado para</span>
            <span className="font-mono text-xs text-muted-foreground">
              {to}
            </span>
          </div>
        </>
      )}

      <Link href={back.href} className={buttonVariants({ variant: "outline" })}>
        {back.label}
      </Link>
    </Card>
  );
}
