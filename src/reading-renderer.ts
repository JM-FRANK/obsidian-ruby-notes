import type { FuriganaSettings } from "./settings";
import { parseFurigana } from "./parser";
import { createRubyElement } from "./ruby-widget";

const SKIPPED_TAGS = new Set(["code", "pre", "script", "style", "ruby", "textarea"]);

export function renderFuriganaInReadingView(root: HTMLElement, settings: FuriganaSettings): void {
  if (!settings.enableReadingView) {
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!shouldSkipTextNode(node)) {
      nodes.push(node);
    }
  }

  nodes.forEach(replaceTextNode);
}

function shouldSkipTextNode(node: Text): boolean {
  let parent = node.parentElement;

  while (parent) {
    const tag = parent.tagName.toLowerCase();

    if (SKIPPED_TAGS.has(tag) || parent.classList.contains("cm-editor")) {
      return true;
    }

    parent = parent.parentElement;
  }

  return false;
}

function replaceTextNode(node: Text): void {
  const source = node.textContent ?? "";
  const tokens = parseFurigana(source);

  if (tokens.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();
  let cursor = 0;

  tokens.forEach((token) => {
    if (token.from > cursor) {
      fragment.appendText(source.slice(cursor, token.from));
    }

    fragment.appendChild(createRubyElement(token));
    cursor = token.to;
  });

  if (cursor < source.length) {
    fragment.appendText(source.slice(cursor));
  }

  node.replaceWith(fragment);
}
