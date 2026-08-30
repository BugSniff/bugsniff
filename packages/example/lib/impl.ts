// Implementação: vive num subpasta, então é privada. Ninguém de fora alcança.
const ACENTOS = /[\u0300-\u036f]/g;

export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(ACENTOS, "").trim().toUpperCase();
}
