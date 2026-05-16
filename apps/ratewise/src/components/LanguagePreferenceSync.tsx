import React from 'react';
import { syncClientLanguagePreference } from '../i18n';

export function LanguagePreferenceSync() {
  React.useEffect(() => {
    syncClientLanguagePreference();
  }, []);

  return null;
}
