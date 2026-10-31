import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopApi, Progress } from '../src/shared/types.ts';

const api: DesktopApi = {
  snapshot: () => ipcRenderer.invoke('izlek:snapshot'),
  startScan: options => ipcRenderer.invoke('izlek:start', options),
  cancelScan: () => ipcRenderer.invoke('izlek:cancel'),
  updateLead: (id, patch) => ipcRenderer.invoke('izlek:update', id, patch),
  deleteLead: id => ipcRenderer.invoke('izlek:delete', id),
  clearExclusions: () => ipcRenderer.invoke('izlek:clear-exclusions'),
  updatePreferences: patch => ipcRenderer.invoke('izlek:preferences', patch),
  saveSource: input => ipcRenderer.invoke('izlek:save-source', input),
  deleteSource: id => ipcRenderer.invoke('izlek:delete-source', id),
  exportCsv: (ids, delimiter) => ipcRenderer.invoke('izlek:export', ids, delimiter),
  importUrl: (url, days) => ipcRenderer.invoke('izlek:import', url, days),
  openExternal: url => ipcRenderer.invoke('izlek:open', url),
  onProgress: callback => {
    const handler = (_event: unknown, progress: Progress) => callback(progress);
    ipcRenderer.on('izlek:progress', handler);
    return () => ipcRenderer.removeListener('izlek:progress', handler);
  },
};
contextBridge.exposeInMainWorld('izlek', api);
