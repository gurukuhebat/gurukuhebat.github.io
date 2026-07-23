// Indonesian-friendly number parser for grade inputs.
// Supports "80, 75, 90" (multiple values), "75,5" (Indonesian decimal), "75.5" (intl decimal).
// Returns an array of numbers clamped to [0, 100].

export function parseNilai(teks: string | null | undefined): number[] {
  if (!teks) return [];
  // Normalize semicolons & tabs → spaces
  let s = String(teks).trim().replace(/[;\t]+/g, " ");
  // Split tokens: by whitespace OR by ", " (comma + space).
  // Token without space after comma stays intact, e.g. "75,5" → token "75,5".
  const tokens = s.split(/\s+|,\s+/).filter(Boolean);
  return tokens
    .map((tok) => {
      // Comma between digits → Indonesian decimal
      const norm = tok.replace(",", ".");
      const n = parseFloat(norm);
      if (isNaN(n)) return null;
      return Math.max(0, Math.min(100, n));
    })
    .filter((x): x is number => x !== null);
}

// Format an array of numbers back to display string: "80, 75, 90"
export function formatNilai(arr: number[]): string {
  return arr.join(", ");
}
