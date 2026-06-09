export interface FuriganaSettings {
  enableReadingView: boolean;
  enableLivePreview: boolean;
  renderOnActiveLine: boolean;
}

export const DEFAULT_SETTINGS: FuriganaSettings = {
  enableReadingView: true,
  enableLivePreview: true,
  renderOnActiveLine: false,
};
