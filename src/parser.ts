export interface FuriganaToken {
  from: number;
  to: number;
  raw: string;
  base: string;
  readings: string[];
}

export function parseFurigana(source: string): FuriganaToken[] {
  const tokens: FuriganaToken[] = [];

  for (let index = 0; index < source.length; index++) {
    if (source[index] !== "{") {
      continue;
    }

    const close = findTokenEnd(source, index + 1);
    if (close === -1) {
      continue;
    }

    const raw = source.slice(index, close + 1);
    const parsed = parseTokenBody(source.slice(index + 1, close));

    if (!parsed) {
      continue;
    }

    tokens.push({
      from: index,
      to: close + 1,
      raw,
      base: parsed.base,
      readings: parsed.readings,
    });

    index = close;
  }

  return tokens;
}

function findTokenEnd(source: string, start: number): number {
  for (let index = start; index < source.length; index++) {
    const char = source[index];

    if (char === "\n" || char === "\r" || char === "{") {
      return -1;
    }

    if (char === "}") {
      return index;
    }
  }

  return -1;
}

function parseTokenBody(body: string): { base: string; readings: string[] } | null {
  const segments: string[] = [];
  let current = "";

  for (let index = 0; index < body.length; index++) {
    const char = body[index];

    if (char === "{" || char === "}" || char === "\n" || char === "\r") {
      return null;
    }

    if (char === "|") {
      segments.push(current);
      current = "";
      continue;
    }

    if (char === "\\" && body[index + 1] === "|") {
      segments.push(current);
      current = "";
      index++;
      continue;
    }

    current += char;
  }

  segments.push(current);

  if (segments.length < 2 || segments.some((segment) => segment.length === 0)) {
    return null;
  }

  return {
    base: segments[0],
    readings: segments.slice(1),
  };
}
