export const NAIRA = (n: number): string => {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  const formatted = abs % 1 !== 0 ? abs.toFixed(2) : abs.toString();
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (n < 0 ? '-₦' : '₦') + parts.join('.');
};
export const fmtDate = (d: Date | string): string => {
  if (!d) return '';
  if (typeof d === 'string') return d;
  return d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const pad2 = (n: number): string => String(n).padStart(2, '0');
export const timeNow = (): string => {
  const d = new Date();
  const h = d.getHours();
  const m = pad2(d.getMinutes());
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'pm' : 'am'}`;
};
export const uid = (): string => Math.random().toString(36).slice(2, 8).toUpperCase();
export const initials = (name: string): string =>
  name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
export const avatarColors: Record<string, { bg: string; fg: string }> = {
  self:  { bg: '#cbeeff', fg: '#004961' },
  ade:   { bg: '#ffdee6', fg: '#790e3d' },
  faith: { bg: '#d7f0e0', fg: '#1a5c35' },
};
export const getAvatarColor = (id: string) =>
  avatarColors[id] || { bg: '#eae7e7', fg: '#444141' };
export const methodLabel = (m: string): string =>
  ({ card: 'Card', transfer: 'Bank transfer', wallet: 'Wallet' }[m as 'card'|'transfer'|'wallet'] || m);
