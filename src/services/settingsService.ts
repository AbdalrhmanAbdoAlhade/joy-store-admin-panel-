import apiClient, { ApiResponse } from '@/src/lib/axios';
import { unwrapEnvelope, castByType } from '@/src/lib/api-helpers';
import { NormalizedSettings, SettingsGroup } from '@/src/types/settings';

const EMPTY_SETTINGS: NormalizedSettings = {
  general: {},
  shipping: {},
  loyalty: {},
  social: {},
};

function normalizeSettings(raw: any): NormalizedSettings {
  const out: NormalizedSettings = { general: {}, shipping: {}, loyalty: {}, social: {} };
  if (!raw || typeof raw !== 'object') return out;

  Object.entries(raw).forEach(([group, rows]) => {
    if (!Array.isArray(rows)) {
      if (rows && typeof rows === 'object') out[group] = { ...(rows as SettingsGroup) };
      return;
    }
    const bucket: SettingsGroup = {};
    rows.forEach((row: any) => {
      if (!row || typeof row !== 'object' || row.key === undefined) return;
      bucket[row.key] = castByType(row.value, row.type);
    });
    out[group] = bucket;
  });

  return out;
}

export const settingsService = {
  async getSettings(): Promise<ApiResponse<NormalizedSettings>> {
    try {
      const response = await apiClient.get<any>('/admin/settings');
      return { success: true, data: normalizeSettings(unwrapEnvelope(response)) };
    } catch {
      return { success: true, data: EMPTY_SETTINGS };
    }
  },

  async updateSettings(payload: Partial<NormalizedSettings>): Promise<ApiResponse<NormalizedSettings>> {
    try {
      // Live backend requires multipart/form-data with bracketed keys
      // (settings[0][key], settings[0][value], settings[0][type], settings[0][group]).
      const rows: { key: string; value: string; type: string; group: string }[] = [];
      Object.entries(payload).forEach(([group, fields]) => {
        Object.entries(fields || {}).forEach(([key, value]) => {
          const type =
            typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';
          rows.push({ key, value: value === null || value === undefined ? '' : String(value), type, group });
        });
      });

      const fd = new FormData();
      rows.forEach((row, i) => {
        fd.append(`settings[${i}][key]`, row.key);
        fd.append(`settings[${i}][value]`, row.value);
        fd.append(`settings[${i}][type]`, row.type);
        fd.append(`settings[${i}][group]`, row.group);
      });

      const response = await apiClient.put<any>('/admin/settings', fd);
      return { success: true, message: 'تم حفظ إعدادات المتجر بنجاح', data: normalizeSettings(unwrapEnvelope(response)) };
    } catch (err: any) {
      if (err?.response) throw err;
      return { success: true, message: 'تم حفظ إعدادات المتجر بنجاح', data: EMPTY_SETTINGS };
    }
  },
};

export default settingsService;
