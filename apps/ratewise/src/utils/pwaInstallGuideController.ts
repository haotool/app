type ShowHandler = () => void;

let showHandler: ShowHandler | null = null;

export function registerPwaInstallGuideShow(handler: ShowHandler) {
  showHandler = handler;
  return () => {
    if (showHandler === handler) {
      showHandler = null;
    }
  };
}

export function requestPwaInstallGuide() {
  showHandler?.();
}
