export function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('en-US');
}

function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

export function nowStamp(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export function attrLabel(attr: string): string {
  if (attr === 'live_births') return 'live births';
  if (attr === 'marriages') return 'marriages';
  if (attr === 'population') return 'population';
  return attr;
}
