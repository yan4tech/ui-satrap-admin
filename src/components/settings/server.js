import { cookies } from 'next/headers';

import { defaultSettings, SETTINGS_STORAGE_KEY } from './settings-config';

// ----------------------------------------------------------------------

export async function detectSettings(storageKey = SETTINGS_STORAGE_KEY) {
  const cookieStore = await cookies();

  const settingsStore = cookieStore.get(storageKey);

  const merged = settingsStore
    ? { ...defaultSettings, ...JSON.parse(settingsStore.value) }
    : defaultSettings;

  return { ...merged, direction: 'rtl' };
}
