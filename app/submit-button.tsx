"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that says it is working and refuses a second press.
 *
 * Not a nicety on this form. Submitting twice parks two scans and sends two
 * magic links, so the person gets two e-mails without knowing which one is
 * theirs, and both spend from the same daily quota. A server action gives no
 * visible sign of having started, so without this the natural thing to do when
 * nothing happens is to click again.
 *
 * `useFormStatus` reads the state of the form this sits inside, which is why it
 * has to be its own component rather than a prop on the page.
 */
export function SubmitButton({
  children,
  working,
  className,
}: {
  children: React.ReactNode;
  /** What the button says while the action runs. */
  working: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? working : children}
    </button>
  );
}
