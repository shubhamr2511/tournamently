export interface ScheduleInput {
  startDate: Date;
  endDate: Date;
  matchesPerDay: number;
  weekdaysOnly: boolean;
  totalMatches: number;
}

export function buildAvailableDates(
  startDate: Date,
  endDate: Date,
  weekdaysOnly: boolean,
): Date[] {
  const out: Date[] = [];
  const cur = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    ),
  );
  const last = new Date(
    Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
    ),
  );
  while (cur.getTime() <= last.getTime()) {
    const day = cur.getUTCDay();
    const isWeekend = day === 0 || day === 6;
    if (!weekdaysOnly || !isWeekend) {
      out.push(new Date(cur));
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export function distributeFixturesAcrossDates(
  fixtureCount: number,
  input: ScheduleInput,
): { ok: true; assignments: Date[] } | { ok: false; error: string } {
  const dates = buildAvailableDates(
    input.startDate,
    input.endDate,
    input.weekdaysOnly,
  );
  const totalSlots = dates.length * input.matchesPerDay;
  if (fixtureCount > totalSlots) {
    return {
      ok: false,
      error: `Cannot fit ${fixtureCount} matches: only ${totalSlots} slots available across ${dates.length} day(s) × ${input.matchesPerDay}/day. Extend the date range, raise matchesPerDay, or include weekends.`,
    };
  }

  const assignments: Date[] = [];
  let idx = 0;
  for (const date of dates) {
    for (let i = 0; i < input.matchesPerDay; i++) {
      if (idx >= fixtureCount) break;
      assignments.push(date);
      idx++;
    }
    if (idx >= fixtureCount) break;
  }
  return { ok: true, assignments };
}
