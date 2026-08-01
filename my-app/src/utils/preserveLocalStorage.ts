const ALWAYS_KEEP_KEYS = ['app-language', 'app-theme'];
const KEEP_KEY_PREFIXES = ['ai-image-editor-tour-seen'];

export const clearLocalStorageForLogout = () => {
  const saved: Record<string, string> = {};

  Object.keys(localStorage).forEach((key) => {
    const shouldKeep = ALWAYS_KEEP_KEYS.includes(key) || KEEP_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
    if (!shouldKeep) return;

    const value = localStorage.getItem(key);
    if (value !== null) {
      saved[key] = value;
    }
  });

  localStorage.clear();
  Object.entries(saved).forEach(([key, value]) => localStorage.setItem(key, value));
};
