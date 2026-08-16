export function normalizeOntologyLabel(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export function tokenizeOntologyLabel(value: string): string[] {
  return normalizeOntologyLabel(value)
    .split(/[^\p{L}\p{N}+#]+/u)
    .filter(Boolean);
}
