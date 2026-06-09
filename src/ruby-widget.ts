import { WidgetType } from "@codemirror/view";
import type { FuriganaToken } from "./parser";

export const RUBY_CLASS = "markdown-furigana-ruby";

export function createRubyElement(token: FuriganaToken): HTMLElement {
  const ruby = document.createElement("ruby");
  ruby.addClass(RUBY_CLASS);

  if (token.readings.length === 1) {
    appendRubyPair(ruby, token.base, token.readings[0]);
    return ruby;
  }

  const baseChars = Array.from(token.base);
  if (baseChars.length === token.readings.length) {
    baseChars.forEach((base, index) => {
      appendRubyPair(ruby, base, token.readings[index]);
    });
    return ruby;
  }

  appendRubyPair(ruby, token.base, token.readings.join(" "));
  return ruby;
}

function appendRubyPair(ruby: HTMLElement, base: string, reading: string): void {
  const rb = document.createElement("rb");
  rb.textContent = base;
  ruby.appendChild(rb);
  ruby.createEl("rt", { text: reading });
}

export class RubyWidget extends WidgetType {
  constructor(private readonly token: FuriganaToken) {
    super();
  }

  toDOM(): HTMLElement {
    return createRubyElement(this.token);
  }

  eq(other: RubyWidget): boolean {
    return this.token.raw === other.token.raw;
  }

  ignoreEvent(): boolean {
    return false;
  }
}
