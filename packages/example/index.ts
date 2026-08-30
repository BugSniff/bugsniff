// Entry point: a superfície pública deste pacote.
// Um pacote pode ter vários arquivos de raiz (index.ts, client.ts, server.ts).
// Prefira vários entry points pequenos a um barrel que reexporta tudo.
import { normalizar } from "./lib/impl";

/** Compara dois nomes ignorando acento, caixa e espaço em volta. */
export function mesmoNome(a: string, b: string): boolean {
  return normalizar(a) === normalizar(b);
}
