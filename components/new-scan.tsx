import { requestScan } from "@/app/scan-action";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scanRefusal } from "@/lib/copy";

/** The one control that starts a reading, wherever it happens to sit. */
export function NewScan({
  erro,
  label,
  className,
  voltar = "/painel",
  url,
}: {
  erro?: string;
  label: string;
  className?: string;
  voltar?: string;
  /** Prefilled, on a page that is already about one store. */
  url?: string;
}) {
  return (
    <form
      action={requestScan}
      className={`flex flex-col gap-2 ${className ?? ""}`}
    >
      <input type="hidden" name="voltar" value={voltar} />
      <div className="flex gap-2">
        <Label htmlFor="url" className="sr-only">
          Endereço da loja
        </Label>
        <Input
          id="url"
          name="url"
          required
          defaultValue={url}
          placeholder="loja.com.br"
          className={className ? "" : "w-56"}
        />
        <SubmitButton working="Começando…" className={buttonVariants()}>
          {label}
        </SubmitButton>
      </div>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {scanRefusal(erro)}
        </p>
      )}
    </form>
  );
}
