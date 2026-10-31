import type { Preferences } from '../shared/types.ts';

export const SIX_HOURS = 6 * 60 * 60 * 1000;
export function nextScanAt(now = new Date()): string { return new Date(now.getTime() + SIX_HOURS).toISOString(); }
export function scanIsDue(preferences: Preferences, running: boolean, now = new Date()): boolean {
  return preferences.autoScan && !running && !!preferences.nextAutoScanAt && new Date(preferences.nextAutoScanAt).getTime() <= now.getTime();
}
export function updatePreferences(previous: Preferences, input: unknown, now = new Date()): Preferences {
  if (!input || typeof input !== 'object') throw new Error('Geçersiz ayar.');
  const patch = input as Record<string, unknown>;
  const result = { ...previous };
  if (patch.autoScan !== undefined) {
    if (typeof patch.autoScan !== 'boolean') throw new Error('Geçersiz otomatik tarama tercihi.');
    result.autoScan = patch.autoScan;
    if (!patch.autoScan) result.nextAutoScanAt = null;
    else if (!previous.autoScan) result.nextAutoScanAt = nextScanAt(now);
  }
  if (patch.autoDays !== undefined) {
    if (![1, 7, 30].includes(patch.autoDays as number)) throw new Error('Geçersiz otomatik tarama aralığı.');
    result.autoDays = patch.autoDays as 1 | 7 | 30;
  }
  if (patch.delimiter !== undefined) {
    if (patch.delimiter !== ',' && patch.delimiter !== ';') throw new Error('Geçersiz CSV ayıracı.');
    result.delimiter = patch.delimiter;
  }
  return result;
}
