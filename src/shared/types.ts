export type SourceId = 'r10' | 'wmaraci' | `custom-${string}`;
export type Category = 'Web sitesi' | 'E-ticaret' | 'Özel yazılım' | 'Mobil uygulama' | 'Entegrasyon';
export type LeadStatus = 'new' | 'contacted' | 'won' | 'dismissed';
export type Qualification = 'qualified' | 'review' | 'closed' | 'stale';

export interface Lead {
  id: string;
  sourceId: SourceId;
  sourceName?: string;
  url: string;
  title: string;
  author: string;
  company: string;
  fullName: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  category: Category;
  summary: string;
  evidence: string;
  contactEvidence: string;
  budget: string;
  deadline: string;
  publishedAt: string | null;
  discoveredAt: string;
  checkedAt: string;
  qualification: Qualification;
  priority: number;
  reasons: string[];
  warnings: string[];
  status: LeadStatus;
  notes: string;
}

export interface Source {
  id: SourceId;
  name: string;
  host: string;
  listingUrl: string;
  description: string;
  custom?: boolean;
  mode?: 'listing' | 'page';
  linkPath?: string;
  enabled?: boolean;
}

export interface SourceInput {
  id?: SourceId;
  name: string;
  url: string;
  mode: 'listing' | 'page';
  linkPath?: string;
  enabled?: boolean;
}

export interface ScanOptions {
  sources: SourceId[];
  days: 1 | 7 | 30;
  categories: Category[];
  maxPages: number;
}

export interface SourceResult {
  sourceId: SourceId;
  sourceName?: string;
  status: 'ok' | 'partial' | 'error';
  message: string;
  checked: number;
  matched: number;
}

export interface ScanRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: 'running' | 'completed' | 'partial' | 'cancelled' | 'failed';
  checked: number;
  found: number;
  options: ScanOptions;
  sources: SourceResult[];
}

export interface Progress {
  runId: string;
  running: boolean;
  checked: number;
  found: number;
  message: string;
  sourceId?: SourceId;
}

export interface Snapshot {
  version?: string;
  leads: Lead[];
  runs: ScanRun[];
  sources: Source[];
  progress: Progress | null;
  excludedCount: number;
  preferences: Preferences;
}

export interface Preferences {
  autoScan: boolean;
  autoDays: 1 | 7 | 30;
  delimiter: ',' | ';';
  nextAutoScanAt: string | null;
}

export interface DesktopApi {
  snapshot(): Promise<Snapshot>;
  startScan(options: ScanOptions): Promise<string>;
  cancelScan(): Promise<void>;
  updateLead(id: string, patch: { status?: LeadStatus; notes?: string }): Promise<void>;
  deleteLead(id: string): Promise<void>;
  clearExclusions(): Promise<void>;
  updatePreferences(patch: { autoScan?: boolean; autoDays?: 1 | 7 | 30; delimiter?: ',' | ';' }): Promise<void>;
  saveSource(input: SourceInput): Promise<Source>;
  deleteSource(id: SourceId): Promise<void>;
  exportCsv(ids: string[], delimiter: ',' | ';'): Promise<{ cancelled: boolean; count: number; path?: string }>;
  importUrl(url: string, days: 1 | 7 | 30): Promise<string>;
  openExternal(url: string): Promise<void>;
  onProgress(callback: (progress: Progress) => void): () => void;
}

declare global { interface Window { izlek?: DesktopApi } }
