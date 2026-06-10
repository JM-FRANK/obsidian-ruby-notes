import { MarkdownRenderChild } from "obsidian";
import type { FuriganaSettings } from "./settings";
import { parseFurigana } from "./parser";
import { createRubyElement } from "./ruby-widget";

const SKIPPED_TAGS = new Set(["code", "pre", "ruby", "rt", "rp", "script", "style", "textarea", "input"]);

type RenderDomOptions = {
  allowInsideCmEditor: boolean;
};

export function createFuriganaReadingViewChild(
  root: HTMLElement,
  getSettings: () => FuriganaSettings,
): MarkdownRenderChild {
  return new FuriganaReadingViewChild(root, getSettings);
}

class FuriganaReadingViewChild extends MarkdownRenderChild {
  private observer: MutationObserver | null = null;
  private frameId: number | null = null;

  constructor(
    containerEl: HTMLElement,
    private readonly getSettings: () => FuriganaSettings,
  ) {
    super(containerEl);
  }

  onload(): void {
    this.renderSoon();

    this.observer = new MutationObserver((mutations) => {
      if (!this.getSettings().enableReadingView) {
        return;
      }

      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of Array.from(mutation.addedNodes)) {
            if (nodeMayContainRubySource(node)) {
              this.renderSoon();
              return;
            }
          }
        }

        if (mutation.type === "characterData" && textMayContainRubySource(mutation.target.textContent ?? "")) {
          this.renderSoon();
          return;
        }
      }
    });

    this.observer.observe(this.containerEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  onunload(): void {
    this.observer?.disconnect();
    this.observer = null;

    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  private renderSoon(): void {
    if (this.frameId !== null) {
      return;
    }

    this.frameId = requestAnimationFrame(() => {
      this.frameId = null;

      const settings = this.getSettings();
      if (!settings.enableReadingView) {
        return;
      }

      renderFuriganaInReadingView(this.containerEl, settings);
    });
  }
}

export function renderFuriganaInReadingView(root: HTMLElement, settings: FuriganaSettings): void {
  if (!settings.enableReadingView) {
    return;
  }

  renderFuriganaInDomRoot(root, { allowInsideCmEditor: false });
}

export function renderFuriganaInExternalWidget(root: HTMLElement, settings: FuriganaSettings): void {
  if (!settings.enableLivePreview) {
    return;
  }

  renderFuriganaInDomRoot(root, { allowInsideCmEditor: true });
}

function renderFuriganaInDomRoot(root: HTMLElement, options: RenderDomOptions): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!shouldSkipTextNode(node, options)) {
      nodes.push(node);
    }
  }

  nodes.forEach(replaceTextNode);
}

function shouldSkipTextNode(node: Text, options: RenderDomOptions): boolean {
  let parent = node.parentElement;

  while (parent) {
    const tag = parent.tagName.toLowerCase();

    if (SKIPPED_TAGS.has(tag) || (!options.allowInsideCmEditor && parent.classList.contains("cm-editor"))) {
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
      fragment.appendChild(document.createTextNode(source.slice(cursor, token.from)));
    }

    fragment.appendChild(createRubyElement(token));
    cursor = token.to;
  });

  if (cursor < source.length) {
    fragment.appendChild(document.createTextNode(source.slice(cursor)));
  }

  node.replaceWith(fragment);
}

function nodeMayContainRubySource(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return textMayContainRubySource(node.textContent ?? "");
  }

  if (node instanceof HTMLElement) {
    if (shouldSkipElement(node)) {
      return false;
    }

    return textMayContainRubySource(node.textContent ?? "");
  }

  return false;
}

function textMayContainRubySource(text: string): boolean {
  return text.includes("{") && text.includes("|");
}

function shouldSkipElement(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;

  while (current) {
    const tag = current.tagName.toLowerCase();

    if (SKIPPED_TAGS.has(tag) || current.classList.contains("cm-editor")) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}
