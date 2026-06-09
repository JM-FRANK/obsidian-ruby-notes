export interface FuriganaToken {
  from: number;
  to: number;
  raw: string;
  base: string;
  readings: string[];
}

const FURIGANA_PATTERN = /\{([^{}\|\r\n]+)\|([^{}\r\n]+)\}/g;

export function parseFurigana(source: string): FuriganaToken[] {
  const tokens: FuriganaToken[] = [];

  for (const match of source.matchAll(FURIGANA_PATTERN)) {
    const raw = match[0];
    const base = match[1];
    const readings = match[2].split("|");

    if (!base || readings.some((reading) => reading.length === 0)) {
      continue;
    }

    tokens.push({
      from: match.index ?? 0,
      to: (match.index ?? 0) + raw.length,
      raw,
      base,
      readings,
    });
  }

  return tokens;
}
