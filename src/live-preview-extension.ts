import { RangeSetBuilder, StateField } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import { parseFurigana } from "./parser";
import { RubyWidget } from "./ruby-widget";
import type { FuriganaSettings } from "./settings";

const EXCLUDED_NODE_NAMES = [
  "code",
  "codemark",
  "codetext",
  "fencedcode",
  "htmlblock",
  "inlinecode",
  "frontmatter",
  "yaml",
];

export function createFuriganaLivePreviewExtension(getSettings: () => FuriganaSettings) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view, getSettings());
      }

      update(update: ViewUpdate): void {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
          this.decorations = buildDecorations(update.view, getSettings());
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    },
  );
}

function buildDecorations(view: EditorView, settings: FuriganaSettings): DecorationSet {
  if (!settings.enableLivePreview || !isLivePreview(view)) {
    return Decoration.none;
  }

  const builder = new RangeSetBuilder<Decoration>();

  for (const range of view.visibleRanges) {
    let line = view.state.doc.lineAt(range.from);

    while (line.from <= range.to) {
      if (line.to >= range.from) {
        addLineDecorations(builder, view, line.text, line.from);
      }

      if (line.to >= range.to || line.number >= view.state.doc.lines) {
        break;
      }

      line = view.state.doc.line(line.number + 1);
    }
  }

  return builder.finish();
}

function addLineDecorations(
  builder: RangeSetBuilder<Decoration>,
  view: EditorView,
  lineText: string,
  lineStart: number,
): void {
  parseFurigana(lineText).forEach((token) => {
    const from = lineStart + token.from;
    const to = lineStart + token.to;

    if (intersectsSelection(from, to, view) || isInExcludedSyntax(view, from, to)) {
      return;
    }

    builder.add(
      from,
      to,
      Decoration.replace({
        widget: new RubyWidget(token),
        inclusive: false,
      }),
    );
  });
}

function isLivePreview(view: EditorView): boolean {
  return view.state.field(editorLivePreviewField as StateField<boolean>, false) === true;
}

function intersectsSelection(from: number, to: number, view: EditorView): boolean {
  return view.state.selection.ranges.some((range) => range.from <= to && range.to >= from);
}

function isInExcludedSyntax(view: EditorView, from: number, to: number): boolean {
  return hasExcludedSyntaxAncestor(view, from) || hasExcludedSyntaxAncestor(view, Math.max(from, to - 1));
}

function hasExcludedSyntaxAncestor(view: EditorView, pos: number): boolean {
  let node = syntaxTree(view.state).resolveInner(pos, -1);

  while (node) {
    const name = node.name.toLowerCase();
    if (EXCLUDED_NODE_NAMES.some((excluded) => name.includes(excluded))) {
      return true;
    }

    node = node.parent;
  }

  return false;
}
