import { Plugin } from "obsidian";
import { createFuriganaLivePreviewExtension } from "./live-preview-extension";
import { createFuriganaReadingViewChild } from "./reading-renderer";
import { DEFAULT_SETTINGS, FuriganaSettings } from "./settings";

export default class MarkdownFurigana extends Plugin {
  settings: FuriganaSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerMarkdownPostProcessor((el, ctx) => {
      ctx.addChild(createFuriganaReadingViewChild(el, () => this.settings));
    });

    this.registerEditorExtension(createFuriganaLivePreviewExtension(() => this.settings));
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
}
