export function formatDate(d?: string | Date): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(d?: string | Date): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function pluralize(n: number, single: string, plural?: string): string {
  return `${n} ${n === 1 ? single : plural || single + 's'}`;
}

export function characterColor(name?: string): string {
  if (!name) return '#555577';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('');
}

export function firstNameWithInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  const [first, ...rest] = parts;
  const lastInitials = rest
    .map((p) => p[0]?.toUpperCase() || '')
    .filter(Boolean)
    .join(' ');
  return lastInitials ? `${first} ${lastInitials}` : first;
}
