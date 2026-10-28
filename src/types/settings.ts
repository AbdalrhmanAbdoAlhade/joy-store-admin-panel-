export type SettingsValue = string | number | boolean;

export interface SettingsGroup {
  [key: string]: SettingsValue;
}

/**
 * Normalized settings shape returned by the backend.
 * The backend returns groups of `{ key, value, type, group }` rows which are
 * flattened here into key/value objects with `castByType` applied.
 */
export interface NormalizedSettings {
  general: SettingsGroup;
  shipping: SettingsGroup;
  loyalty: SettingsGroup;
  social: SettingsGroup;
  [group: string]: SettingsGroup;
}

/** @deprecated use NormalizedSettings */
export type StoreSettings = NormalizedSettings;
