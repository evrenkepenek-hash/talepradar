import type { CSSProperties } from 'react';

const paths = {
  radar: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 6-6M12 3v2M3 12h2"/><circle cx="12" cy="12" r="1"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  history: <><path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7M12 7v5l3 2"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
  settings: <><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  x: <path d="m6 6 12 12M6 18 18 6"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  chevron: <path d="m8 5 7 7-7 7"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  phone: <path d="m7 3 3 5-3 3a14 14 0 0 0 6 6l3-3 5 3-1 4C10 22 2 14 3 4z"/>,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/></>,
  link: <><path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M13 17a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-1 1" transform="translate(1 -1) scale(.9)"/></>,
  external: <><path d="M14 3h7v7m0-7L10 14M10 3H4v17h17v-6"/></>,
  alert: <><path d="m12 3 10 18H2zM12 9v5M12 17v1"/></>,
  file: <><path d="M14 2H5v20h14V7zM14 2v5h5M8 12h8M8 16h8"/></>,
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="2"/>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></>,
  filter: <><path d="M4 7h16M7 12h10M10 17h4"/></>,
  refresh: <><path d="M20 7a9 9 0 0 0-15-1L3 9m0-6v6h6M4 17a9 9 0 0 0 15 1l2-3m0 6v-6h-6"/></>,
} as const;

export type IconName = keyof typeof paths;
export function Icon({ name, size = 20, className = '', style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg aria-hidden="true" className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
