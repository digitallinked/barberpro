export function normalizeMalaysiaMobile(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 0) return "";

  if (digits.startsWith("60") && digits.length >= 11 && digits.length <= 12) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length >= 9 && digits.length <= 11) {
    return `+60${digits.slice(1)}`;
  }
  if (!digits.startsWith("0") && digits.length >= 9 && digits.length <= 10) {
    return `+60${digits}`;
  }

  return digits.startsWith("60") ? `+${digits}` : `+${digits}`;
}

export function malaysiaPhoneLookupVariants(raw: string): string[] {
  const trimmed = raw.trim();
  const norm = normalizeMalaysiaMobile(trimmed);
  const out = new Set<string>();
  if (trimmed.length > 0) out.add(trimmed);
  if (norm.length > 0) out.add(norm);

  if (norm.startsWith("+60") && norm.length >= 12) {
    const national = norm.slice(3);
    out.add(`0${national}`);
    out.add(`60${national}`);
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("60") && digits.length >= 11) {
    out.add(`+${digits}`);
  }

  return [...out].filter(Boolean);
}
