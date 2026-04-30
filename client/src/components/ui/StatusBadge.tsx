import { Badge } from './Badge';
import type { MatchStatus } from '../../types';

const map: Record<
  MatchStatus,
  { tone: 'green' | 'blue' | 'red' | 'gray' | 'gold'; label: string }
> = {
  completed: { tone: 'green', label: 'Completed' },
  scheduled: { tone: 'blue', label: 'Scheduled' },
  in_progress: { tone: 'gold', label: 'Live' },
  cancelled: { tone: 'gray', label: 'Cancelled' },
};

export function StatusBadge({ status }: { status: MatchStatus }) {
  const m = map[status] ?? map.scheduled;
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
