interface Rule { allow: boolean; path: string }
interface Group { agents: string[]; rules: Rule[]; delay: number }

export function robotsPolicy(text: string, url: string, agent = 'IzlekBot'): { allowed: boolean; delayMs: number } {
  const groups: Group[] = [];
  let current: Group | null = null;
  let directives = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === 'user-agent') {
      if (!current || directives) { current = { agents: [], rules: [], delay: 0 }; groups.push(current); directives = false; }
      current.agents.push(value.toLowerCase());
    } else if (current) {
      directives = true;
      if ((key === 'allow' || key === 'disallow') && value) current.rules.push({ allow: key === 'allow', path: value });
      if (key === 'crawl-delay' && Number.isFinite(+value)) current.delay = Math.max(0, +value * 1000);
    }
  }
  const named = groups.filter(g => g.agents.some(a => a !== '*' && agent.toLowerCase().includes(a)));
  const matching = named.length ? named : groups.filter(g => g.agents.includes('*'));
  const u = new URL(url);
  const target = u.pathname + u.search;
  let best: Rule | undefined;
  let bestLength = -1;
  for (const rule of matching.flatMap(g => g.rules)) {
    const ending = rule.path.endsWith('$');
    const pattern = (ending ? rule.path.slice(0, -1) : rule.path).split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
    const length = rule.path.replace(/[\*$]/g, '').length;
    if (new RegExp(`^${pattern}${ending ? '$' : ''}`).test(target) && (length > bestLength || (length === bestLength && rule.allow))) { best = rule; bestLength = length; }
  }
  return { allowed: best?.allow ?? true, delayMs: Math.max(1500, ...matching.map(g => g.delay)) };
}
