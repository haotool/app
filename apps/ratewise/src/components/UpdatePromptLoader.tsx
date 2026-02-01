import React from 'react';
import { logger } from '../utils/logger';

/**
 * UpdatePromptLoader
 *
 * 負責在瀏覽器端動態載入 UpdatePrompt
 * 避免 SSR 時載入 workbox-window 造成錯誤
 */
export function UpdatePromptLoader() {
  const isBrowser = typeof window !== 'undefined';
  const [UpdatePrompt, setUpdatePrompt] = React.useState<React.ComponentType | null>(null);

  React.useEffect(() => {
    if (!isBrowser) return;

    let isMounted = true;

    import('./UpdatePrompt')
      .then((module) => {
        if (isMounted) {
          setUpdatePrompt(() => module.UpdatePrompt);
        }
      })
      .catch((error) => {
        const errorObject = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to load UpdatePrompt', errorObject);
      });

    return () => {
      isMounted = false;
    };
  }, [isBrowser]);

  return UpdatePrompt ? <UpdatePrompt /> : null;
}

export default UpdatePromptLoader;
