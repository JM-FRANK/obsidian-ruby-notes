import { Plugin } from "obsidian";
import { createFuriganaLivePreviewExtension } from "./live-preview-extension";
import { createFuriganaReadingViewChild, renderFuriganaInExternalWidget } from "./reading-renderer";
import { DEFAULT_SETTINGS, FuriganaSettings } from "./settings";

const SHEETS_EXTENDED_LIVE_PREVIEW_RENDERED_EVENT = "sheets-extended:live-preview-rendered";

type SheetsExtendedRenderedEventDetail = {
  root?: unknown;
  table?: unknown;
  tableWrapper?: unknown;
  source?: unknown;
  sourcePath?: unknown;
  blockType?: unknown;
};

export default class MarkdownFurigana extends Plugin {
  settings: FuriganaSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerMarkdownPostProcessor((el, ctx) => {
      ctx.addChild(createFuriganaReadingViewChild(el, () => this.settings));
    });

    this.registerEditorExtension(createFuriganaLivePreviewExtension(() => this.settings));
    this.registerSheetsExtendedLivePreviewHandler();
  }

  async loadSettings(): Promise<void> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(await this.loadData()),
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private registerSheetsExtendedLivePreviewHandler(): void {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<SheetsExtendedRenderedEventDetail>).detail;
      const root = detail?.root;

      if (!(root instanceof HTMLElement)) {
        return;
      }

      if (!this.settings.enableLivePreview && !this.settings.enableReadingView) {
        return;
      }

      renderFuriganaInExternalWidget(root, this.settings);
    };

    document.addEventListener(SHEETS_EXTENDED_LIVE_PREVIEW_RENDERED_EVENT, handler);

    this.register(() => {
      document.removeEventListener(SHEETS_EXTENDED_LIVE_PREVIEW_RENDERED_EVENT, handler);
    });
  }
}
